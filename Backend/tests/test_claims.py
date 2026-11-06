import pytest
from fastapi import status
from datetime import datetime, timezone
from models import Item, ItemStatus, ItemType, Claim, ClaimStatus
from schemas import ClaimCreate, ClaimReview
from uuid import uuid4

def test_create_claim_success(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Phone",
        "description": "iPhone 13 found in library",
        "location": "University Library",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    # Admin reports the item
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    # Demo user claims it
    claim_payload = {"ownership_proof": "It has a sticker of a cat on the back and my wallpaper is a mountain."}
    response = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] == "pending"
    assert data["ownership_proof"] == claim_payload["ownership_proof"]

def test_create_claim_lost_item_forbidden(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Lost Phone",
        "description": "I lost my phone in the park",
        "location": "Park",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "lost"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "This is a long enough proof"}
    response = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "Only found items can be claimed" in response.json()["detail"]

def test_create_claim_own_item_forbidden(client, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Wallet",
        "description": "Found a wallet in mall",
        "location": "Mall",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "This is a long enough proof"}
    response = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cannot claim your own item" in response.json()["detail"]

def test_create_claim_duplicate_forbidden(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Keys",
        "description": "Keys found on street",
        "location": "Street",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "Proof 1 long enough"}
    client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    # Duplicate claim
    response = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 2 long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "already submitted a claim" in response.json()["detail"]

def test_review_claim_approve_success(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Camera",
        "description": "Nice camera found on beach",
        "location": "Beach",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    claim_payload = {"ownership_proof": "This is a long enough proof"}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res_claim.status_code == status.HTTP_201_CREATED
    claim_id = res_claim.json()["id"]

    # Admin (reporter) approves
    review_payload = {"status": "approved", "review_note": "Looks correct"}
    response = client.patch(f"/api/v1/claims/{claim_id}/review", json=review_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "approved"

    # Verify item status updated to 'claimed'
    item_res = client.get(f"/api/v1/items/{item_id}")
    assert item_res.json()["status"] == "claimed"

def test_review_claim_self_review_forbidden(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Found Phone",
        "description": "Phone found in cafe",
        "location": "Cafe",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    # Admin reports it
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res.status_code == status.HTTP_201_CREATED
    item_id = res.json()["id"]

    # Demo user claims it
    claim_payload = {"ownership_proof": "This is a long enough proof"}
    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json=claim_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res_claim.status_code == status.HTTP_201_CREATED
    claim_id = res_claim.json()["id"]

    # Demo user tries to review their own claim
    review_payload = {"status": "approved"}
    response = client.patch(f"/api/v1/claims/{claim_id}/review", json=review_payload, headers={"Authorization": f"Bearer {demo_user['token']}"})

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "cannot review your own claim" in response.json()["detail"]

def test_review_claim_atomic_rejection(client, admin_user, demo_user, active_categories):
    # Create item
    category = list(active_categories.values())[0]
    item_res = client.post("/api/v1/items", json={
        "title": "Found Wallet", "description": "Wallet description long enough", "location": "X",
        "event_date": datetime.now(timezone.utc).isoformat(), "category_id": str(category.id), "item_type": "found"
    }, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert item_res.status_code == status.HTTP_201_CREATED
    item_id = item_res.json()["id"]

    # Create two claims
    # User 1 (demo_user)
    res1 = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 1 long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res1.status_code == status.HTTP_201_CREATED
    claim_id1 = res1.json()["id"]

    # User 2 (we need another user, so let's create one)
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "Second User", "email": "second@test.com", "password": "Password123"
    })
    # Login user 2
    log_res = client.post("/api/v1/auth/login", json={"email": "second@test.com", "password": "Password123"})
    user2_token = log_res.json()["access_token"]

    res2 = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 2 long enough"}, headers={"Authorization": f"Bearer {user2_token}"})
    assert res2.status_code == status.HTTP_201_CREATED
    claim_id2 = res2.json()["id"]

    # Approve claim 1
    client.patch(f"/api/v1/claims/{claim_id1}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # Verify claim 2 is auto-rejected
    res_claim2 = client.get(f"/api/v1/claims/{claim_id2}", headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res_claim2.json()["status"] == "rejected"
    assert "Another claim was approved" in res_claim2.json()["review_note"]

def test_withdraw_claim_success(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_res = client.post("/api/v1/items", json={
        "title": "Found Item", "description": "Desc long enough", "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(), "category_id": str(category.id), "item_type": "found"
    }, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert item_res.status_code == status.HTTP_201_CREATED
    item_id = item_res.json()["id"]

    claim_res = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert claim_res.status_code == status.HTTP_201_CREATED
    claim_id = claim_res.json()["id"]

    # Withdraw
    response = client.delete(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's gone
    get_res = client.get(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert get_res.status_code == status.HTTP_404_NOT_FOUND

def test_withdraw_reviewed_claim_forbidden(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_res = client.post("/api/v1/items", json={
        "title": "Found Item", "description": "Desc long enough", "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(), "category_id": str(category.id), "item_type": "found"
    }, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert item_res.status_code == status.HTTP_201_CREATED
    item_id = item_res.json()["id"]

    claim_res = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert claim_res.status_code == status.HTTP_201_CREATED
    claim_id = claim_res.json()["id"]

    # Approve first
    client.patch(f"/api/v1/claims/{claim_id}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # Now try to withdraw
    response = client.delete(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "Reviewed claims cannot be withdrawn" in response.json()["detail"]

def test_claim_visibility_rules(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_res = client.post("/api/v1/items", json={
        "title": "Found Item", "description": "Desc long enough", "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(), "category_id": str(category.id), "item_type": "found"
    }, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert item_res.status_code == status.HTTP_201_CREATED
    item_id = item_res.json()["id"]

    proof = "SECRET PROOF LONG ENOUGH"
    claim_res = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": proof}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert claim_res.status_code == status.HTTP_201_CREATED
    claim_id = claim_res.json()["id"]

    # 1. Claimant sees proof
    res_claimant = client.get(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res_claimant.json()["ownership_proof"] == proof

    # 2. Reporter sees proof
    res_reporter = client.get(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert res_reporter.json()["ownership_proof"] == proof

    # 3. Random user does not see proof (and cannot even access the claim)
    reg_res = client.post("/api/v1/auth/register", json={"full_name": "Stranger", "email": "stranger@test.com", "password": "Password123"})
    log_res = client.post("/api/v1/auth/login", json={"email": "stranger@test.com", "password": "Password123"})
    stranger_token = log_res.json()["access_token"]

    res_stranger = client.get(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {stranger_token}"})
    assert res_stranger.status_code == status.HTTP_403_FORBIDDEN

def test_contact_visibility_after_approval(client, admin_user, demo_user, active_categories):
    category = list(active_categories.values())[0]
    item_res = client.post("/api/v1/items", json={
        "title": "Found Item", "description": "Desc long enough", "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(), "category_id": str(category.id), "item_type": "found"
    }, headers={"Authorization": f"Bearer {admin_user['token']}"})
    assert item_res.status_code == status.HTTP_201_CREATED
    item_id = item_res.json()["id"]

    claim_res = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert claim_res.status_code == status.HTTP_201_CREATED
    claim_id = claim_res.json()["id"]

    # Before approval: no contact
    res_before = client.get(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    assert res_before.json().get("counterparty_contact") is None

    # Approve
    client.patch(f"/api/v1/claims/{claim_id}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # After approval: Claimant sees Reporter contact
    res_after = client.get(f"/api/v1/claims/{claim_id}", headers={"Authorization": f"Bearer {demo_user['token']}"})
    contact = res_after.json()["counterparty_contact"]
    assert contact["email"] == admin_user["user"].email
    assert contact["full_name"] == admin_user["user"].full_name
