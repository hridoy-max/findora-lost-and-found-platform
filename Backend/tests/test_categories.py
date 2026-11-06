import pytest
from fastapi import status
from datetime import datetime
from models import Category
from schemas import CategoryCreate, CategoryUpdate

def test_list_categories_public(client, active_categories):
    response = client.get("/api/v1/categories")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    # Page response: data is in ['data']
    categories = data["data"]
    assert len(categories) >= len(active_categories)
    for cat in categories:
        assert cat["is_active"] is True

def test_get_category_success(client, active_categories):
    cat_id = list(active_categories.values())[0].id
    response = client.get(f"/api/v1/categories/{cat_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == list(active_categories.values())[0].name

def test_create_category_admin(client, admin_user):
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    payload = {"name": "New Tech", "description": "Tech category"}
    response = client.post("/api/v1/categories", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "New Tech"

def test_create_category_user_forbidden(client, demo_user):
    headers = {"Authorization": f"Bearer {demo_user['token']}"}
    payload = {"name": "Forbidden Cat", "description": "Should fail"}
    response = client.post("/api/v1/categories", json=payload, headers=headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_category_duplicate_name(client, admin_user, active_categories):
    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    existing_name = list(active_categories.values())[0].name
    payload = {"name": existing_name, "description": "Duplicate"}
    response = client.post("/api/v1/categories", json=payload, headers=headers)
    assert response.status_code == status.HTTP_409_CONFLICT

def test_delete_category_success(client, admin_user, db_session):
    # Create a category with no items
    cat = Category(name="DeleteMe", is_active=True)
    db_session.add(cat)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    response = client.delete(f"/api/v1/categories/{cat.id}", headers=headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_delete_category_referenced(client, admin_user, db_session, active_categories, demo_user):
    # Create an item linked to a category
    from models import Item
    cat = list(active_categories.values())[0]
    item = Item(
        title="Test Item", description="Desc", location="Loc",
        event_date=datetime.now(), category_id=cat.id, user_id=demo_user["user"].id,
        item_type="found", status="open"
    )
    db_session.add(item)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_user['token']}"}
    response = client.delete(f"/api/v1/categories/{cat.id}", headers=headers)
    assert response.status_code == status.HTTP_409_CONFLICT
