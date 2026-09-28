from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from jose import jwt
from passlib.hash import bcrypt

import auth
import services


def test_reset_password_updates_password_and_marks_token_used(reset_token_record, seed_user, db, monkeypatch):
    new_password = "New-Password-456"
    response = auth.reset_password(auth.ResetPasswordRequest(token=reset_token_record["token"], new_password=new_password))

    assert response["message"] == "Contrasena actualizada correctamente"
    updated = services.get_user_by_id(seed_user["id"])
    assert bcrypt.verify(new_password, updated["hashed_password"])
    assert services.get_reset_token(reset_token_record["record"]["jti"])["used"] is True


def test_reset_password_stores_hash_instead_of_plain_password(reset_token_record, seed_user, db):
    new_password = "New-Password-456"
    auth.reset_password(auth.ResetPasswordRequest(token=reset_token_record["token"], new_password=new_password))

    stored_hash = services.get_user_by_id(seed_user["id"])["hashed_password"]
    assert stored_hash != new_password
    assert bcrypt.verify(new_password, stored_hash)


@pytest.mark.parametrize(
    "token_factory",
    [
        lambda record: jwt.encode({"sub": record["user_id"], "jti": record["jti"], "purpose": "reset", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, auth.JWT_SECRET, algorithm=auth.ALGORITHM),
        lambda record: jwt.encode({"sub": record["user_id"], "jti": record["jti"], "purpose": "reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}, "wrong-secret", algorithm=auth.ALGORITHM),
    ],
)
def test_reset_password_rejects_expired_or_wrongly_signed_token(reset_token_record, db, token_factory):
    token = token_factory(reset_token_record["record"])

    with pytest.raises(HTTPException) as error:
        auth.reset_password(auth.ResetPasswordRequest(token=token, new_password="New-Password-456"))

    assert error.value.status_code == 400


def test_reset_password_rejects_wrong_purpose(reset_token_record, db):
    record = reset_token_record["record"]
    token = jwt.encode(
        {"sub": record["user_id"], "jti": record["jti"], "purpose": "access", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        auth.reset_password(auth.ResetPasswordRequest(token=token, new_password="New-Password-456"))

    assert error.value.status_code == 400


def test_reset_password_rejects_token_without_jti(seed_user, db):
    token = jwt.encode(
        {"sub": seed_user["id"], "purpose": "reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        auth.reset_password(auth.ResetPasswordRequest(token=token, new_password="New-Password-456"))

    assert error.value.status_code == 400


def test_reset_password_rejects_unpersisted_token(seed_user, db):
    token = jwt.encode(
        {"sub": seed_user["id"], "jti": "unpersisted", "purpose": "reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        auth.reset_password(auth.ResetPasswordRequest(token=token, new_password="New-Password-456"))

    assert error.value.status_code == 400


def test_reset_password_rejects_used_token(used_reset_token, db):
    # The persisted used flag makes a reset token single-use.
    with pytest.raises(HTTPException) as error:
        auth.reset_password(auth.ResetPasswordRequest(token=used_reset_token["token"], new_password="New-Password-456"))

    assert error.value.status_code == 400


def test_reset_password_rejects_missing_user(reset_token_record, db):
    record = reset_token_record["record"]
    token = jwt.encode(
        {"sub": "missing-user", "jti": record["jti"], "purpose": "reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        auth.reset_password(auth.ResetPasswordRequest(token=token, new_password="New-Password-456"))

    assert error.value.status_code == 400


def test_reset_password_currently_hashes_empty_password(reset_token_record, seed_user, db):
    auth.reset_password(auth.ResetPasswordRequest(token=reset_token_record["token"], new_password=""))

    stored_hash = services.get_user_by_id(seed_user["id"])["hashed_password"]
    assert stored_hash != ""
    assert bcrypt.verify("", stored_hash)


def test_reset_password_rejects_second_use_of_same_token(reset_token_record, db):
    data = auth.ResetPasswordRequest(token=reset_token_record["token"], new_password="New-Password-456")
    auth.reset_password(data)

    # Characterizes the persisted state after the first successful reset.
    with pytest.raises(HTTPException) as error:
        auth.reset_password(data)

    assert error.value.status_code == 400
