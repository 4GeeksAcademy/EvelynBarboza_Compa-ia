from fastapi.testclient import TestClient
import pytest
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from auth import get_current_user
from database import get_db
from main import app
from models import SKU, StockEntry, StockExit
from packages.shared.cache import TTLCache
from routers import inventory


@pytest.fixture
def cached_inventory(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    now = [0]
    monkeypatch.setattr(inventory, "orders_cache", TTLCache(15, clock=lambda: now[0]))
    reads = []

    def record_query(connection, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            reads.append(statement)

    event.listen(engine, "before_cursor_execute", record_query)

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-a"}
    with Session(engine) as session:
        session.add(SKU(
            id=1, name="Producto", sku="CACHE-1", client_name="Cliente",
            category="General", warehouse="Main",
        ))
        session.commit()
    try:
        with TestClient(app) as client:
            yield client, now, reads
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()


def test_orders_cache_is_scoped_expires_and_still_requires_auth(cached_inventory):
    client, now, reads = cached_inventory
    first = client.get("/inventory/orders")
    assert first.status_code == 200
    assert first.headers["Cache-Control"] == "private, no-store"
    assert len(reads) == 2
    assert client.get("/inventory/orders").json() == first.json()
    assert len(reads) == 2
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-b"}
    assert client.get("/inventory/orders").status_code == 200
    assert len(reads) == 4
    now[0] = 15
    assert client.get("/inventory/orders").status_code == 200
    assert len(reads) == 6
    app.dependency_overrides.pop(get_current_user)
    assert client.get("/inventory/orders").status_code == 401
    assert len(reads) == 6


def test_both_order_writes_invalidate_all_user_keys(cached_inventory):
    client, _, _ = cached_inventory
    assert client.get("/inventory/orders").json() == []
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-b"}
    assert client.get("/inventory/orders").json() == []
    inbound = client.post("/inventory/orders/inbound", json={
        "sku_id": 1, "quantity": 5, "reference": "Compra-1", "warehouse": "Main",
    })
    assert inbound.status_code == 200
    assert len(client.get("/inventory/orders").json()) == 1
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-a"}
    assert len(client.get("/inventory/orders").json()) == 1
    outbound = client.post("/inventory/orders/outbound", json={
        "sku_id": 1, "quantity": 2, "exit_type": "loss", "warehouse": "Main",
    })
    assert outbound.status_code == 200
    assert len(client.get("/inventory/orders").json()) == 2
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-b"}
    assert len(client.get("/inventory/orders").json()) == 2
    rejected = client.post("/inventory/orders/outbound", json={
        "sku_id": 1, "quantity": 4, "exit_type": "loss", "warehouse": "Main",
    })
    assert rejected.status_code == 400
    assert len(client.get("/inventory/orders").json()) == 2


def test_inbound_order_uses_authenticated_tinydb_user():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: {"id": "tinydb-user-uuid"}

    try:
        with Session(engine) as session:
            product = SKU(
                name="Product",
                sku="SKU-1",
                client_name="Client",
                category="General",
                warehouse="Main",
            )
            session.add(product)
            session.commit()
            session.refresh(product)
            product_id = product.id

        with TestClient(app) as client:
            response = client.post(
                "/inventory/orders/inbound",
                json={
                    "sku_id": product_id,
                    "quantity": 8,
                    "reference": "purchase-1",
                    "warehouse": "Main",
                    "user_uuid": "attacker-controlled-value",
                },
            )

        assert response.status_code == 200
        assert response.json()["user_uuid"] == "tinydb-user-uuid"
        with Session(engine) as session:
            entry = session.exec(select(StockEntry)).one()
            assert entry.quantity == 8
            assert entry.user_uuid == "tinydb-user-uuid"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()


def test_outbound_order_rejects_insufficient_stock_without_writing():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: {"id": "tinydb-user-uuid"}

    try:
        with Session(engine) as session:
            product = SKU(
                name="Product",
                sku="SKU-2",
                client_name="Client",
                category="General",
                warehouse="Main",
            )
            session.add(product)
            session.commit()
            session.refresh(product)
            session.add(
                StockEntry(
                    sku_id=product.id,
                    quantity=3,
                    reference="purchase-2",
                    warehouse="Main",
                    user_uuid="tinydb-user-uuid",
                )
            )
            session.commit()
            product_id = product.id

        with TestClient(app) as client:
            response = client.post(
                "/inventory/orders/outbound",
                json={
                    "sku_id": product_id,
                    "quantity": 4,
                    "exit_type": "loss",
                    "tracking_number": None,
                    "warehouse": "Main",
                },
            )

        assert response.status_code == 400
        assert "Insufficient stock" in response.json()["detail"]
        with Session(engine) as session:
            assert session.exec(select(StockExit)).all() == []
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()