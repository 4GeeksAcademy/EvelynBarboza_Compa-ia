from unittest.mock import Mock

import pytest
from jose import jwt

import auth
import services


def test_forgot_password_creates_reset_token_and_sends_email(client, seed_user, db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_reset_email", sender)

    response = client.post("/auth/forgot-password", json={"email": seed_user["email"]})

    assert response.status_code == 200
    assert response.json()["message"]
    record = services.reset_tokens_table.all()[0]
    assert record["user_id"] == seed_user["id"]
    assert record["used"] is False
    sender.assert_called_once()


def test_forgot_password_reset_token_contains_expected_claims(seed_user, db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_reset_email", sender)

    auth.forgot_password(auth.ForgotPasswordRequest(email=seed_user["email"]))
    reset_link = sender.call_args.args[1]
    token = reset_link.split("token=", 1)[1]
    payload = jwt.decode(token, auth.JWT_SECRET, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == seed_user["id"]
    assert payload["jti"]
    assert payload["purpose"] == "reset"
    assert payload["exp"]


def test_forgot_password_does_not_send_email_for_unknown_email(client, db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_reset_email", sender)

    response = client.post("/auth/forgot-password", json={"email": "missing@example.com"})

    assert response.status_code == 200
    assert response.json()["message"] == "Si esa direccion esta registrada, recibiras un enlace en breve."
    assert services.reset_tokens_table.all() == []
    sender.assert_not_called()


def test_forgot_password_hides_email_service_os_error(client, seed_user, db, monkeypatch):
    sender = Mock(side_effect=OSError("email unavailable"))
    monkeypatch.setattr(auth, "send_reset_email", sender)

    response = client.post("/auth/forgot-password", json={"email": seed_user["email"]})

    assert response.status_code == 200
    assert services.reset_tokens_table.all()[0]["used"] is False


def test_forgot_password_empty_email_behaves_as_unknown_email(client, db, monkeypatch):
    sender = Mock()
    monkeypatch.setattr(auth, "send_reset_email", sender)

    response = client.post("/auth/forgot-password", json={"email": ""})

    assert response.status_code == 200
    assert sender.call_count == 0
    assert services.reset_tokens_table.all() == []


def test_forgot_password_persistence_failure_is_not_silently_converted(seed_user, monkeypatch):
    monkeypatch.setattr(auth, "create_reset_token", Mock(side_effect=RuntimeError("database unavailable")))

    with pytest.raises(RuntimeError):
        auth.forgot_password(auth.ForgotPasswordRequest(email=seed_user["email"]))
