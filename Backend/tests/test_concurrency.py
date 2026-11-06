import pytest
from fastapi import status
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.exc import IntegrityError
from models import Item, ItemStatus, ItemType, Claim, ClaimStatus, ItemReturn

def test_concurrent_claim_approvals(client, db_session, admin_user, demo_user, active_categories):
    # Setup: One found item with two pending claims
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Concurrent Item",
        "description": "Testing race conditions for approval",
        "location": "Test Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    # User 1 claims
    res1 = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 1 long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id1 = res1.json()["id"]

    # User 2 claims
    reg_res = client.post("/api/v1/auth/register", json={"full_name": "User 2", "email": "user2@test.com", "password": "Password123"})
    log_res = client.post("/api/v1/auth/login", json={"email": "user2@test.com", "password": "Password123"})
    user2_token = log_res.json()["access_token"]
    res2 = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 2 long enough"}, headers={"Authorization": f"Bearer {user2_token}"})
    claim_id2 = res2.json()["id"]

    # Concurrent approval requests
    review_payload = {"status": "approved", "review_note": "Verified"}

    def approve_claim(cid):
        return client.patch(f"/api/v1/claims/{cid}/review", json=review_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(approve_claim, [claim_id1, claim_id2]))

    status_codes = [r.status_code for r in results]

    # Exactly one should succeed (200), the other should conflict (409)
    assert status_codes.count(status.HTTP_200_OK) == 1
    assert status_codes.count(status.HTTP_409_CONFLICT) == 1

    # Verify DB state: only one approved, others rejected
    # We must use the shared session 'db_session'
    claims = db_session.query(Claim).filter(Claim.item_id == item_id).all()
    approved = [c for c in claims if c.status == ClaimStatus.APPROVED]
    rejected = [c for c in claims if c.status == ClaimStatus.REJECTED]

    assert len(approved) == 1
    assert len(rejected) == 1

def test_concurrent_item_returns(client, db_session, admin_user, demo_user, active_categories):
    # Setup: One approved claim on a claimed item
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Return Race Item",
        "description": "Testing race conditions for return",
        "location": "Test Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    res_claim = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id = res_claim.json()["id"]
    client.patch(f"/api/v1/claims/{claim_id}/review", json={"status": "approved"}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    # Concurrent return requests
    def record_return():
        return client.post(f"/api/v1/item-returns/claims/{claim_id}/return", json={}, headers={"Authorization": f"Bearer {admin_user['token']}"})

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda _: record_return(), [1, 2]))

    status_codes = [r.status_code for r in results]

    assert status_codes.count(status.HTTP_201_CREATED) == 1
    assert status_codes.count(status.HTTP_409_CONFLICT) == 1

    # Verify only one return record exists
    returns = db_session.query(ItemReturn).filter(ItemReturn.item_id == item_id).all()
    assert len(returns) == 1

def test_database_approved_claim_constraint(client, db_session, admin_user, demo_user, active_categories):
    # Verify the partial unique index: UNIQUE (item_id) WHERE status = 'approved'
    category = list(active_categories.values())[0]
    item_payload = {
        "title": "Constraint Item",
        "description": "Testing DB partial index",
        "location": "Loc",
        "event_date": datetime.now(timezone.utc).isoformat(),
        "category_id": str(category.id),
        "item_type": "found"
    }
    res = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {admin_user['token']}"})
    item_id = res.json()["id"]

    # Create two claims
    res1 = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 1 long enough"}, headers={"Authorization": f"Bearer {demo_user['token']}"})
    claim_id1 = res1.json()["id"]

    reg_res = client.post("/api/v1/auth/register", json={"full_name": "User X", "email": "x@test.com", "password": "Password123"})
    log_res = client.post("/api/v1/auth/login", json={"email": "x@test.com", "password": "Password123"})
    user_x_token = log_res.json()["access_token"]
    res2 = client.post(f"/api/v1/items/{item_id}/claims", json={"ownership_proof": "Proof 2 long enough"}, headers={"Authorization": f"Bearer {user_x_token}"})
    claim_id2 = res2.json()["id"]

    # Manually force both to 'approved' using the shared session 'db_session' to bypass service logic
    claim1 = db_session.query(Claim).filter(Claim.id == claim_id1).first()
    claim1.status = ClaimStatus.APPROVED
    claim1.reviewed_at = datetime.now(timezone.utc)
    db_session.commit()

    # This should raise IntegrityError because of the partial unique index
    try:
        claim2 = db_session.query(Claim).filter(Claim.id == claim_id2).first()
        claim2.status = ClaimStatus.APPROVED
        claim2.reviewed_at = datetime.now(timezone.utc)
        db_session.commit()
        pytest.fail("IntegrityError was not raised when inserting second approved claim")
    except IntegrityError:
        db_session.rollback()
        # Success
