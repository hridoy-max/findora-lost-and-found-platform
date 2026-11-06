import pytest
from fastapi.testclient import TestClient
from models import Item, ItemStatus, Category
from app import app
from datetime import datetime, timedelta, timezone

client = TestClient(app)

def test_filter_by_item_type(db_session, demo_user, active_categories):
    user = demo_user["user"]
    category = list(active_categories.values())[0]

    # Create items of both types
    item_lost = Item(
        title="Lost Wallet", description="Brown leather wallet",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Park", event_date=datetime.now(timezone.utc)
    )
    item_found = Item(
        title="Found Keys", description="Silver keys",
        item_type="found", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Mall", event_date=datetime.now(timezone.utc)
    )
    db_session.add_all([item_lost, item_found])
    db_session.commit()

    # Filter for 'lost'
    response = client.get("/api/v1/items?item_type=lost")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Lost Wallet"

    # Filter for 'found'
    response = client.get("/api/v1/items?item_type=found")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Found Keys"

def test_filter_by_category(db_session, demo_user):
    user = demo_user["user"]
    cat1 = Category(name="Electronics", description="Gadgets", is_active=True)
    cat2 = Category(name="Clothing", description="Clothes", is_active=True)
    db_session.add_all([cat1, cat2])
    db_session.commit()

    item1 = Item(
        title="iPhone", description="iPhone 13",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=cat1.id, user_id=user.id,
        location="Office", event_date=datetime.now(timezone.utc)
    )
    item2 = Item(
        title="T-shirt", description="Blue T-shirt",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=cat2.id, user_id=user.id,
        location="Home", event_date=datetime.now(timezone.utc)
    )
    db_session.add_all([item1, item2])
    db_session.commit()

    response = client.get(f"/api/v1/items?category_id={cat1.id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "iPhone"

def test_filter_by_status(db_session, demo_user, active_categories):
    user = demo_user["user"]
    category = list(active_categories.values())[0]

    item_open = Item(
        title="Open Item", description="Item description",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=datetime.now(timezone.utc)
    )
    item_claimed = Item(
        title="Claimed Item", description="Item description",
        item_type="lost", status=ItemStatus.CLAIMED,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=datetime.now(timezone.utc)
    )
    db_session.add_all([item_open, item_claimed])
    db_session.commit()

    response = client.get("/api/v1/items?status=claimed")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["status"] == "claimed"

def test_filter_by_date_range(db_session, demo_user, active_categories):
    user = demo_user["user"]
    category = list(active_categories.values())[0]
    now = datetime.now(timezone.utc)
    date_old = now - timedelta(days=10)
    date_mid = now - timedelta(days=5)
    date_new = now - timedelta(days=1)

    item1 = Item(
        title="Old", description="Old item",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=date_old
    )
    item2 = Item(
        title="Mid", description="Mid item",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=date_mid
    )
    item3 = Item(
        title="New", description="New item",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=date_new
    )
    db_session.add_all([item1, item2, item3])
    db_session.commit()

    # Filter from 7 days ago to 2 days ago (should only get item2)
    start = (now - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end = (now - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    response = client.get(f"/api/v1/items?start_date={start}&end_date={end}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Mid"

def test_filter_all_option(db_session, demo_user, active_categories):
    user = demo_user["user"]
    category = list(active_categories.values())[0]

    item_lost = Item(
        title="Lost", description="Desc",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=datetime.now(timezone.utc)
    )
    item_found = Item(
        title="Found", description="Desc",
        item_type="found", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=datetime.now(timezone.utc)
    )
    db_session.add_all([item_lost, item_found])
    db_session.commit()

    # item_type=all should return both
    response = client.get("/api/v1/items?item_type=all")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 2

def test_combined_filters(db_session, demo_user, active_categories):
    user = demo_user["user"]
    category = list(active_categories.values())[0]
    now = datetime.now(timezone.utc)

    item1 = Item(
        title="Match", description="Desc",
        item_type="found", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=now
    )
    item2 = Item(
        title="No Match Type", description="Desc",
        item_type="lost", status=ItemStatus.OPEN,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=now
    )
    item3 = Item(
        title="No Match Status", description="Desc",
        item_type="found", status=ItemStatus.CLAIMED,
        category_id=category.id, user_id=user.id,
        location="Loc", event_date=now
    )
    db_session.add_all([item1, item2, item3])
    db_session.commit()

    response = client.get("/api/v1/items?item_type=found&status=open")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Match"
