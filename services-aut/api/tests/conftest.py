import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from uuid import uuid4

os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("RESET_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("FRONTEND_URL", "http://test-frontend")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from passlib.hash import bcrypt
from tinydb import TinyDB

import auth
import services
from main import app


TEST_SECRET = "test-jwt-secret"
TEST_ALGORITHM = "HS256"


@pytest.fixture
def db(tmp_path, monkeypatch):
    database = TinyDB(tmp_path / "test-db.json")
    users = database.table("users")
    profiles = database.table("profiles")
    reset_tokens = database.table("reset_tokens")
    monkeypatch.setattr(services, "users_table", users)
    monkeypatch.setattr(services, "profiles_table", profiles)
    monkeypatch.setattr(services, "reset_tokens_table", reset_tokens)
    yield database
    database.close()


@pytest.fixture
def client(db):
    return TestClient(app)


@pytest.fixture
def known_password():
    return "Correct-Horse-123"


@pytest.fixture
def known_password_hash(known_password):
    return bcrypt.hash(known_password)


@pytest.fixture
def valid_user(known_password_hash):
    return {
        "id": "user-valid",
        "email": "usuario@example.com",
        "hashed_password": known_password_hash,
        "is_active": True,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@pytest.fixture
def inactive_user(known_password_hash):
    return {
        "id": "user-inactive",
        "email": "inactive@example.com",
        "hashed_password": known_password_hash,
        "is_active": False,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@pytest.fixture
def profile():
    return {
        "id": "profile-valid",
        "user_id": "user-valid",
        "name": "Usuario de prueba",
        "phone": "+5491100000000",
        "address": "Direccion de prueba",
    }


@pytest.fixture
def seed_user(db, valid_user, profile):
    services.users_table.insert(valid_user)
    services.profiles_table.insert(profile)
    return valid_user


@pytest.fixture
def seed_inactive_user(db, inactive_user):
    services.users_table.insert(inactive_user)
    return inactive_user


@pytest.fixture
def valid_access_token(seed_user):
    return auth.create_access_token(seed_user["id"])


@pytest.fixture
def expired_token(seed_user):
    return jwt.encode(
        {"sub": seed_user["id"], "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        TEST_SECRET,
        algorithm=TEST_ALGORITHM,
    )


@pytest.fixture
def wrongly_signed_token(seed_user):
    return jwt.encode(
        {"sub": seed_user["id"], "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        "wrong-secret",
        algorithm=TEST_ALGORITHM,
    )


@pytest.fixture
def reset_token_record(seed_user):
    jti = str(uuid4())
    token = jwt.encode(
        {
            "sub": seed_user["id"],
            "jti": jti,
            "purpose": "reset",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        },
        TEST_SECRET,
        algorithm=TEST_ALGORITHM,
    )
    record = {"jti": jti, "user_id": seed_user["id"], "used": False}
    services.reset_tokens_table.insert(record)
    return {"token": token, "record": record}


@pytest.fixture
def used_reset_token(reset_token_record):
    services.reset_tokens_table.update(
        {"used": True},
        lambda row: row["jti"] == reset_token_record["record"]["jti"],
    )
    reset_token_record["record"]["used"] = True
    return reset_token_record
