from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from jose import jwt

import auth


def test_create_access_token_contains_subject_expiration_and_algorithm(seed_user):
    token = auth.create_access_token(seed_user["id"])
    payload = jwt.decode(token, auth.JWT_SECRET, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == seed_user["id"]
    assert datetime.now(timezone.utc) < datetime.fromtimestamp(payload["exp"], timezone.utc)
    assert jwt.get_unverified_header(token)["alg"] == auth.ALGORITHM


def test_create_access_token_uses_configured_expiration(seed_user):
    before = datetime.now(timezone.utc) + timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = auth.create_access_token(seed_user["id"])
    expiration = datetime.fromtimestamp(jwt.get_unverified_claims(token)["exp"], timezone.utc)
    after = datetime.now(timezone.utc) + timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)

    # jose serializes the datetime claim to whole seconds.
    assert before - timedelta(seconds=1) <= expiration <= after


def test_get_current_user_accepts_valid_token(valid_access_token, seed_user):
    assert auth.get_current_user(valid_access_token) == seed_user


def test_get_current_user_rejects_expired_token(expired_token, db):
    with pytest.raises(HTTPException) as error:
        auth.get_current_user(expired_token)

    assert error.value.status_code == 401


def test_get_current_user_rejects_wrong_signature(wrongly_signed_token, db):
    with pytest.raises(HTTPException) as error:
        auth.get_current_user(wrongly_signed_token)

    assert error.value.status_code == 401


def test_get_current_user_rejects_token_without_subject(db):
    token = jwt.encode(
        {"exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        auth.JWT_SECRET,
        algorithm=auth.ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        auth.get_current_user(token)

    assert error.value.status_code == 401


def test_get_current_user_rejects_existingly_signed_token_for_missing_user(db):
    token = auth.create_access_token("missing-user")

    with pytest.raises(HTTPException) as error:
        auth.get_current_user(token)

    assert error.value.status_code == 401


def test_get_current_user_behavior_for_token_without_exp(seed_user):
    token = jwt.encode({"sub": seed_user["id"]}, auth.JWT_SECRET, algorithm=auth.ALGORITHM)

    assert auth.get_current_user(token) == seed_user
