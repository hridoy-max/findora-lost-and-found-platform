import pytest
from fastapi import status
from datetime import datetime, timedelta, timezone
from models import Item, ItemStatus
from schemas import ItemCreate, ItemUpdate
from uuid import uuid4

def test_create_item_success(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Lost Wallet",
        "description": "Brown leather wallet with some cash",
        "location": "Central Park",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "lost",
        "image_url": "https://example.com/image.jpg"
    }
    response = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Lost Wallet"
    assert data["item_type"] == "lost"

def test_create_item_invalid_category(client, demo_user):
    payload = {
        "title": "Invalid Cat Item",
        "description": "Description",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(uuid4()),
        "item_type": "lost"
    }
    response = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_404_NOT_FOUND]

def test_create_item_future_date(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    future_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    payload = {
        "title": "Future Item",
        "description": "Description",
        "location": "Loc",
        "event_date": future_date,
        "category_id": str(category.id),
        "item_type": "lost"
    }
    response = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_item_non_https_image(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Bad Image Item",
        "description": "Description",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "lost",
        "image_url": "http://example.com/image.jpg" # Not https
    }
    response = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_list_items_public(client, demo_user, active_categories):
    # Create a few items
    category = list(active_categories.values())[0]
    for i in range(3):
        payload = {
            "title": f"Item {i}",
            "description": "Description",
            "location": "Loc",
            "event_date": datetime.now(timezone.utc).isoformat(),
            "category_id": str(category.id),
            "item_type": "found"
        }
        client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    response = client.get("/api/v1/items")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "data" in data
    assert len(data["data"]) >= 3

def test_list_items_search(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Unique-Title-Item",
        "description": "Unique-Desc-Item",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    # Search by title
    response = client.get("/api/v1/items?search=Unique-Title") # Simplified check
    assert response.status_code == status.HTTP_200_OK
    assert any("Unique-Title" in item["title"] for item in response.json()["data"])

def test_get_item_success(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Get Me",
        "description": "Description",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    item_id = res.json()["id"]

    response = client.get(f"/api/v1/items/{item_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["title"] == "Get Me"

def test_update_item_owner(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Original Title",
        "description": "Description",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    item_id = res.json()["id"]

    update_payload = {"title": "Updated Title"}
    response = client.patch(f"/api/v1/items/{item_id}", json=update_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["title"] == "Updated Title"

def test_delete_item_success(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Delete Me",
        "description": "Description",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    item_id = res.json()["id"]

    response = client.delete(f"/api/v1/items/{item_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_close_item_success(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    payload = {
        "title": "Close Me",
        "description": "Description",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    item_id = res.json()["id"]

    response = client.patch(f"/api/v1/items/{item_id}/close", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "closed"
