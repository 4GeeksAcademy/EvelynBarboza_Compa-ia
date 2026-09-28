from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from jose import jwt
from passlib.hash import bcrypt

import auth


def login_form(email, password):
    return SimpleNamespace(username=email, password=password)


def test_login_returns_access_token_for_valid_credentials(seed_user, known_password):
    result = auth.login(login_form(seed_user["email"], known_password))

    assert result["token_type"] == "bearer"
    assert result["access_token"]


def test_login_rejects_unknown_email(db):
    with pytest.raises(HTTPException) as error:
        auth.login(login_form("missing@example.com", "anything"))

    assert error.value.status_code == 401


def test_login_rejects_incorrect_password(seed_user):
    with pytest.raises(HTTPException) as error:
        auth.login(login_form(seed_user["email"], "wrong-password"))

    assert error.value.status_code == 401


def test_login_uses_same_error_for_unknown_email_and_wrong_password(seed_user):
    with pytest.raises(HTTPException) as unknown_error:
        auth.login(login_form("missing@example.com", "wrong-password"))
    with pytest.raises(HTTPException) as password_error:
        auth.login(login_form(seed_user["email"], "wrong-password"))

    assert unknown_error.value.status_code == password_error.value.status_code == 401
    assert unknown_error.value.detail == password_error.value.detail


@pytest.mark.parametrize("email,password", [("", ""), ("", "password"), ("user@example.com", "")])
def test_login_rejects_empty_credentials(db, email, password):
    with pytest.raises(HTTPException) as error:
        auth.login(login_form(email, password))

    assert error.value.status_code == 401


def test_login_token_contains_user_claims(seed_user, known_password):
    result = auth.login(login_form(seed_user["email"], known_password))
    payload = jwt.decode(result["access_token"], auth.JWT_SECRET, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == seed_user["id"]
    assert payload["exp"]


def test_login_currently_allows_inactive_user(seed_inactive_user, known_password):
    # This is an explicit characterization of current behavior, not a desired policy.
    result = auth.login(login_form(seed_inactive_user["email"], known_password))

    assert result["token_type"] == "bearer"


def test_login_with_corrupt_password_hash_is_not_successful(db):
    user = {
        "id": "corrupt-user",
        "email": "corrupt@example.com",
        "hashed_password": "not-a-bcrypt-hash",
        "is_active": True,
        "role": "user",
        "created_at": "2026-01-01T00:00:00+00:00",
    }
    from services import users_table
    users_table.insert(user)

    with pytest.raises(Exception):
        auth.login(login_form(user["email"], "password"))
