def test_get_me_returns_user_and_profile(client, seed_user, valid_access_token, profile):
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {valid_access_token}"})

    assert response.status_code == 200
    assert response.json() == {
        "id": seed_user["id"],
        "email": seed_user["email"],
        "role": seed_user["role"],
        "profile": profile,
    }


def test_get_me_returns_null_profile_for_user_without_profile(client, db, valid_user):
    from services import users_table
    users_table.insert(valid_user)
    from auth import create_access_token
    valid_access_token = create_access_token(valid_user["id"])
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {valid_access_token}"})

    assert response.status_code == 200
    assert response.json()["profile"] is None


def test_get_me_rejects_expired_token(client, expired_token, db):
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})

    assert response.status_code == 401
