from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from auth import get_current_user
from database import get_db
from main import app
from models import SKU, StockEntry, StockExit


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