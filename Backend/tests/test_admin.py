import pytest
from fastapi import status
from uuid import uuid4
from datetime import datetime, timezone
from models import User, Item, ItemStatus, Category, Claim
from utils import security

def test_admin_access_blocked_for_user(client, demo_user):
    """Verify that a regular user cannot access admin endpoints."""
    headers = {"Authorization": f"Bearer {demo_user['token']}"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_admin_access_blocked_unauthenticated(client):
    """Verify that unauthenticated users cannot access admin endpoints."""
    response = client.get("/api/v1/admin/users", headers={})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_admin_user(client, admin_user):
    """Verify an admin can create another user/admin."""
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    payload = {
        "full_name": "New Admin",
        "email": "newadmin@test.com",
        "password": "Password123!",
        "role": "admin"
    }
    response = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["full_name"] == "New Admin"
    assert response.json()["role"] == "admin"

def test_last_active_admin_protection_deactivation(client, db_session, admin_user):
    """Verify that the last active admin cannot be deactivated."""
    # Ensure only one active admin exists
    admins = db_session.query(User).filter(User.role == "admin", User.is_active == True).all()
    for a in admins:
        if a.id != admin_user["user"].id:
            a.is_active = False
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    payload = {"is_active": False}
    response = client.patch(f"/api/v1/admin/users/{admin_user['user'].id}/status", json=payload, headers=headers)

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "last active admin" in response.json()["detail"].lower()

def test_last_active_admin_protection_demotion(client, db_session, admin_user):
    """Verify that the last active admin cannot be demoted to user."""
    admins = db_session.query(User).filter(User.role == "admin", User.is_active == True).all()
    for a in admins:
        if a.id != admin_user["user"].id:
            a.is_active = False
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    payload = {"role": "user"}
    response = client.patch(f"/api/v1/admin/users/{admin_user['user'].id}/role", json=payload, headers=headers)

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "last active admin" in response.json()["detail"].lower()

def test_last_active_admin_protection_deletion(client, db_session, admin_user):
    """Verify that the last active admin cannot be deleted."""
    admins = db_session.query(User).filter(User.role == "admin", User.is_active == True).all()
    for a in admins:
        if a.id != admin_user["user"].id:
            a.is_active = False
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    response = client.delete(f"/api/v1/admin/users/{admin_user['user'].id}", headers=headers)

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "last active admin" in response.json()["detail"].lower()

def test_admin_moderate_item_status(client, admin_user, demo_user, active_categories):
    """Verify admin can moderate items between open and closed."""
    category = list(active_categories.values())[0]

    headers_user = {"Authorization": f"Bearer {demo_user['token']}"}
    create_res = client.post("/api/v1/items", json={
        "title": "Test Item",
        "description": "Test Description for items",
        "location": "Test Location",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }, headers=headers_user)
    item_id = create_res.json()["id"]

    headers_admin = {"Authorization": f"Bearer {admin_user['token']}"}

    # Open -> Closed
    res = client.patch(f"/api/v1/admin/items/{item_id}/status", json={"status": "closed"}, headers=headers_admin)
    assert res.status_code == status.HTTP_200_OK

    # Closed -> Open
    res = client.patch(f"/api/v1/admin/items/{item_id}/status", json={"status": "open"}, headers=headers_admin)
    assert res.status_code == status.HTTP_200_OK

def test_admin_delete_item_with_claims(client, admin_user, demo_user, active_categories, db_session):
    """Verify admin cannot delete an item that has claims."""
    category = list(active_categories.values())[0]

    headers_user = {"Authorization": f"Bearer {demo_user['token']}"}
    create_res = client.post("/api/v1/items", json={
        "title": "Claimed Item",
        "description": "Description for claimed item",
        "location": "Test Location",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }, headers=headers_user)
    item_id = create_res.json()["id"]

    # Manually create a claim to bypass self-claim check
    claim = Claim(
        id=uuid4(),
        item_id=item_id,
        claimant_id=uuid4(),
        ownership_proof="Proof",
        status="pending"
    )
    db_session.add(claim)
    db_session.commit()

    headers_admin = {"Authorization": f"Bearer {admin_user['token']}"}
    response = client.delete(f"/api/v1/admin/items/{item_id}", headers=headers_admin)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "has claims" in response.json()["detail"].lower()

def test_admin_delete_item_no_claims(client, admin_user, demo_user, active_categories):
    """Verify admin can delete an item with no claims."""
    category = list(active_categories.values())[0]
    headers_user = {"Authorization": f"Bearer {demo_user['token']}"}
    create_res = client.post("/api/v1/items", json={
        "title": "Deletable Item",
        "description": "Description for deletable item",
        "location": "Test Location",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }, headers=headers_user)
    item_id = create_res.json()["id"]

    headers_admin = {"Authorization": f"Bearer {admin_user['token']}"}
    response = client.delete(f"/api/v1/admin/items/{item_id}", headers=headers_admin)
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_admin_dashboard_access(client, admin_user):
    """Verify admin can access the dashboard."""
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    response = client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert "total_users" in response.json()
