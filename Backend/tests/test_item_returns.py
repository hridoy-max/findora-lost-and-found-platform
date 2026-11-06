import pytest
from fastapi import status
from datetime import datetime, timezone
from models import Item, ItemStatus, ItemType, Claim, ClaimStatus
from uuid import uuid4

def test_record_return_success(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Wallet",
        "description": "Black leather wallet found in mall",
        "location": "Shopping Mall",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    # Admin reports the item
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    # Demo user claims it
    claim_payload = {"ownership_proof": "It has my ID and a membership card inside."}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res_claim.status_code == status.HTTP_201_CREATED
    claim_id = res_claim.json()["id"]

    # Admin approves the claim
    review_payload = {"status": "approved", "review_note": "Proof verified"}
    client.patch(f"/api/v1/claims/{claim_id}/review", json=review_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # Record handover
    return_payload = {"notes": "Handed over in person at the library."}
    response = client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json=return_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["notes"] == return_payload["notes"]

    # Verify item status is now 'returned'
    item_res = client.get(f"/api/v1/items/{item_id}")
    assert item_res.json()["status"] == "returned"

def test_record_return_unapproved_claim_forbidden(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Keys",
        "description": "Keys with a red keychain",
        "location": "Parking Lot",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "They are the same color as mine."}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id = res_claim.json()["id"]

    # Try to return without approval (status is pending)
    response = client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json={"notes": "Returning now"}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Only approved claims can be returned" in response.json()["detail"]

def test_record_return_duplicate_forbidden(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Phone",
        "description": "iPhone found in park",
        "location": "City Park",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "It has my wallpaper."}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id = res_claim.json()["id"]

    # Approve and return once
    client.patch(f"/api/v1/claims/{claim_id}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})
    client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json={}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # Try to return again
    response = client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json={}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    assert response.status_code == status.HTTP_409_CONFLICT
    detail = response.json()["detail"]
    assert "already been recorded" in detail or "'claimed' status" in detail

def test_record_return_authorization(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Bag",
        "description": "Backpack found in cafe",
        "location": "Cafe",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "It has my textbooks."}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id = res_claim.json()["id"]

    client.patch(f"/api/v1/claims/{claim_id}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # Claimant tries to record the return (Forbidden)
    response = client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json={}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_return_visibility(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Umbrella",
        "description": "Blue umbrella",
        "location": "Bus Stop",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "It's a specific brand."}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id = res_claim.json()["id"]

    client.patch(f"/api/v1/claims/{claim_id}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})
    ret_res = client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json={}, headers={"Authorization": f"Bearer {admin_user['token']}"})
    return_id = ret_res.json()["id"]

    # 1. Claimant can view
    res = client.get(f"/api/v1/item-returns/returns/{return_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res.status_code == status.HTTP_200_OK

    # 2. Reporter can view
    res = client.get(f"/api/v1/item-returns/returns/{return_id}", headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_200_OK

    # 3. Unrelated user cannot view
    reg_res = client.post("/api/v1/auth/register", json={"full_name": "Stranger", "email": "stranger@test.com", "password": "Password123"})
    log_res = client.post("/api/v1/auth/login", json={"email": "stranger@test.com", "password": "Password123"})
    stranger_token = log_res.json()["access_token"]

    res = client.get(f"/api/v1/item-returns/returns/{return_id}", headers={"Authorization": f"Bearer {stranger_token}"})
    assert res.status_code == status.HTTP_403_FORBIDDEN
