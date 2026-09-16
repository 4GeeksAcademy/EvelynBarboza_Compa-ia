import pytest
from fastapi import HTTPException
from passlib.hash import bcrypt

import services
import users


@pytest.mark.parametrize(
    "email, should_create",
    [
        ("usuario@example.com", True),
        ("usuario", True),
        ("usuario@", True),
        ("@example.com", True),
        ("", True),
        ("usuario@@example.com", True),
        (" usuario@example.com ", True),
    ],
)
def test_register_characterizes_current_email_validation(db, email, should_create):
    result = users.register(users.UserCreate(email=email, password="Password-123"))

    assert (result["user"]["email"] == email) is should_create


def test_register_creates_user_and_profile(db):
    result = users.register(users.UserCreate(email="new@example.com", password="Password-123"))

    assert result["user"]["email"] == "new@example.com"
    assert result["user"]["role"] == "user"
    assert result["user"]["is_active"] is True
    assert result["profile"]["user_id"] == result["user"]["id"]
    assert services.get_user_by_id(result["user"]["id"]) is not None
    assert services.get_profile_by_user_id(result["user"]["id"]) is not None


def test_register_rejects_duplicate_email(db, valid_user):
    services.users_table.insert(valid_user)

    with pytest.raises(HTTPException) as error:
        users.register(users.UserCreate(email=valid_user["email"], password="Password-123"))

    assert error.value.status_code == 400


def test_register_stores_password_as_hash(db):
    password = "Password-123"
    result = users.register(users.UserCreate(email="hash@example.com", password=password))
    stored = services.get_user_by_id(result["user"]["id"])["hashed_password"]

    assert stored != password
    assert bcrypt.verify(password, stored)


def test_register_preserves_optional_profile_fields(db):
    result = users.register(
        users.UserCreate(
            email="profile@example.com",
            password="Password-123",
            name="Nombre",
            phone="123",
            address="Direccion",
        )
    )

    assert result["profile"]["name"] == "Nombre"
    assert result["profile"]["phone"] == "123"
    assert result["profile"]["address"] == "Direccion"


def test_register_allows_missing_optional_profile_fields(db):
    result = users.register(users.UserCreate(email="optional@example.com", password="Password-123"))

    assert result["profile"]["name"] is None
    assert result["profile"]["phone"] is None
    assert result["profile"]["address"] is None


def test_register_currently_hashes_empty_password(db):
    # Characterizes current behavior; production validation is intentionally unchanged.
    result = users.register(users.UserCreate(email="empty-password@example.com", password=""))
    stored = services.get_user_by_id(result["user"]["id"])["hashed_password"]

    assert bcrypt.verify("", stored)


@pytest.mark.parametrize("payload", [{"password": "Password-123"}, {"email": "new@example.com"}, {}])
def test_register_rejects_missing_required_fields(client, payload):
    response = client.post("/users", json=payload)

    assert response.status_code == 422
