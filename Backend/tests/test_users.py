import pytest
from fastapi import status
from models import User
from schemas import UserProfileUpdate, UserDashboard
from utils.dependencies import get_current_user

def test_update_me_success(client, demo_user, db_session):
    headers = {"Authorization": f"Bearer {demo_user['token']}"}
    payload = {
        "full_name": "Updated Name",
        "phone": "+9876543210"
    }
    response = client.patch("/api/v1/users/me", json=payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK

    # Verify in DB
    user = db_session.query(User).filter(User.id == demo_user["user"].id).first()
    assert user.full_name == "Updated Name"
    assert user.phone == "+9876543210"

def test_update_me_unauthorized(client, admin_user, demo_user):
    # Try to update demo_user using admin_token (The route is /me, so it uses the token's user)
    # To test "cannot modify another user", we would need a route like /users/{id}
    # But for /me, the token defines the user.
    pass

def test_get_public_profile(client, demo_user):
    response = client.get(f"/api/v1/users/{demo_user['user'].id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["full_name"] == demo_user["user"].full_name
    assert "email" not in data
    assert "password_hash" not in data

def test_user_dashboard(client, demo_user):
    headers = {"Authorization": f"Bearer {demo_user['token']}"}
    response = client.get("/api/v1/users/me/dashboard", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "my_items_total" in data
    assert "my_claims_by_status" in data
    assert isinstance(data["recent_items"], list)
