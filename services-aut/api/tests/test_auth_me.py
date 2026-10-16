def test_get_me_returns_user_and_profile(client, seed_user, valid_access_token, profile):
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {valid_access_token}"})

    assert response.status_code == 200
    assert response.json() == {
        "id": seed_user["id"],
        "email": seed_user["email"],
        "role": seed_user["role"],
        "profile": profile,
        "theme": "light",
    }


def test_get_me_returns_null_profile_for_user_without_profile(client, db, valid_user):
    from services import users_table
    users_table.insert(valid_user)
    from auth import create_access_token
    valid_access_token = create_access_token(valid_user["id"])
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {valid_access_token}"})

    assert response.status_code == 200
    assert response.json()["profile"] is None


def test_theme_preference_is_saved_for_user_and_returned_by_auth_me(
    client,
    seed_user,
    valid_access_token,
):
    from services import get_user_by_id

    headers = {"Authorization": f"Bearer {valid_access_token}"}
    updated = client.patch(
        "/auth/me/preferences",
        headers=headers,
        json={"theme": "dark"},
    )

    assert updated.status_code == 200
    assert updated.json() == {"theme": "dark"}
    assert get_user_by_id(seed_user["id"])["theme"] == "dark"

    current = client.get("/auth/me", headers=headers)

    assert current.status_code == 200
    assert current.json()["theme"] == "dark"


def test_get_me_rejects_expired_token(client, expired_token, db):
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})

    assert response.status_code == 401
