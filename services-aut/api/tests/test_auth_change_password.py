from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from passlib.hash import bcrypt

import auth
import services


def password_change(current, new):
    return auth.ChangePasswordRequest(current_password=current, new_password=new)


def test_change_password_updates_password_and_stores_hash(seed_user, known_password, db):
    new_password = "New-Password-456"
    response = auth.change_password(password_change(known_password, new_password), seed_user)

    assert response["message"] == "Contrasena actualizada correctamente"
    stored_hash = services.get_user_by_id(seed_user["id"])["hashed_password"]
    assert stored_hash != new_password
    assert bcrypt.verify(new_password, stored_hash)


def test_change_password_rejects_incorrect_current_password(seed_user, db):
    with pytest.raises(HTTPException) as error:
        auth.change_password(password_change("wrong-password", "New-Password-456"), seed_user)

    assert error.value.status_code == 400
    assert services.get_user_by_id(seed_user["id"])["hashed_password"] == seed_user["hashed_password"]


def test_change_password_currently_hashes_empty_new_password(seed_user, known_password, db):
    auth.change_password(password_change(known_password, ""), seed_user)

    stored_hash = services.get_user_by_id(seed_user["id"])["hashed_password"]
    assert bcrypt.verify("", stored_hash)


def test_change_password_currently_allows_same_password(seed_user, known_password, db):
    auth.change_password(password_change(known_password, known_password), seed_user)

    stored_hash = services.get_user_by_id(seed_user["id"])["hashed_password"]
    assert bcrypt.verify(known_password, stored_hash)


def test_change_password_with_inactive_user_currently_succeeds(inactive_user, known_password, db):
    services.users_table.insert(inactive_user)

    response = auth.change_password(password_change(known_password, "New-Password-456"), inactive_user)

    assert response["message"] == "Contrasena actualizada correctamente"


def test_change_password_rejects_invalid_token_at_endpoint(client, db):
    response = client.post(
        "/auth/change-password",
        json={"current_password": "anything", "new_password": "new"},
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


def test_change_password_rejects_expired_token_at_endpoint(client, expired_token, db):
    response = client.post(
        "/auth/change-password",
        json={"current_password": "anything", "new_password": "new"},
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401
