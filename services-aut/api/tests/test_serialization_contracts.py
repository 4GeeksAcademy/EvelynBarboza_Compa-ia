import pytest
from fastapi.testclient import TestClient

import auth
import services
from main import app


def test_registration_and_auth_me_never_expose_password_hash(
    client: TestClient,
    db,
    valid_user,
    profile,
):
    registration = client.post(
        "/users",
        json={
            "email": "new@example.com",
            "password": "Password-123",
            "name": "Nueva persona",
            "phone": "123",
            "address": "Calle 1",
        },
    )

    assert registration.status_code == 200
    assert set(registration.json()) == {"user", "profile"}
    assert "hashed_password" not in registration.text
    assert set(registration.json()["user"]) == {
        "id", "email", "is_active", "role", "created_at",
    }

    services.users_table.insert(valid_user)
    services.profiles_table.insert(profile)
    token = auth.create_access_token(valid_user["id"])
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert "hashed_password" not in response.text
    assert response.json()["profile"]["phone"] == profile["phone"]


def test_personal_data_lists_are_restricted_to_admins(
    client: TestClient,
    seed_user,
    valid_access_token,
):
    headers = {"Authorization": f"Bearer {valid_access_token}"}

    assert client.get("/users", headers=headers).status_code == 403
    assert client.get("/profiles", headers=headers).status_code == 403

    services.users_table.update(
        {"role": "admin"},
        services.User.id == seed_user["id"],
    )
    admin_token = auth.create_access_token(seed_user["id"])
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    users = client.get("/users", headers=admin_headers)
    profiles = client.get("/profiles", headers=admin_headers)

    assert users.status_code == 200
    assert users.json()[0]["email"] == seed_user["email"]
    assert profiles.status_code == 200
    assert profiles.json()[0]["phone"] == "+5491100000000"


def test_owner_profile_keeps_contact_fields_for_existing_consumers(
    client: TestClient,
    seed_user,
    valid_access_token,
    profile,
):
    headers = {"Authorization": f"Bearer {valid_access_token}"}
    current = client.get("/profiles/me", headers=headers)

    assert current.status_code == 200
    assert current.json()["address"] == profile["address"]

    updated = client.put(
        "/profiles/me",
        headers=headers,
        json={"name": "Nombre actualizado", "phone": "555"},
    )

    assert updated.status_code == 200
    assert updated.json()["name"] == "Nombre actualizado"
    assert updated.json()["phone"] == "555"
    assert updated.json()["address"] == profile["address"]


@pytest.mark.parametrize("field", ["name", "phone"])
def test_my_profile_requires_non_blank_name_and_phone(
    client: TestClient,
    seed_user,
    valid_access_token,
    field,
):
    payload = {"name": "Nombre", "phone": "123"}
    payload[field] = "   "

    response = client.put(
        "/profiles/me",
        headers={"Authorization": f"Bearer {valid_access_token}"},
        json=payload,
    )

    assert response.status_code == 422
    assert field in {error["loc"][-1] for error in response.json()["detail"]}


def test_inventory_order_list_matches_consumer_shape(
    client: TestClient,
    monkeypatch,
):
    from sqlalchemy.pool import StaticPool
    from sqlmodel import Session, SQLModel, create_engine

    from database import get_db
    from models import SKU, StockEntry

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
            session.add(StockEntry(
                sku_id=product.id,
                quantity=2,
                reference="purchase-1",
                warehouse="Main",
                user_uuid="user-1",
            ))
            session.commit()

        response = client.get("/inventory/orders")

        assert response.status_code == 200
        assert response.json()[0]["movement_type"] == "inbound"
        assert response.json()[0]["sku"]["sku"] == "SKU-1"
        assert "current_stock" not in response.json()[0]["sku"]
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()