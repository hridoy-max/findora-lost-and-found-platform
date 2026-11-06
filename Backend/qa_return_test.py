import httpx
import uuid
import json
from config import settings

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        response.raise_for_status()
        return response.json()["access_token"]

# Personas
ADMIN_TOKEN = get_token(settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)
USER_TOKEN = get_token(settings.DEMO_USER_EMAIL, settings.DEMO_USER_PASSWORD)

def create_random_user():
    email = f"random_{uuid.uuid4()}@test.com"
    password = "Password123"
    with httpx.Client(base_url=BASE_URL) as client:
        client.post("/api/v1/auth/register", json={
            "full_name": "Random User",
            "email": email,
            "password": password
        })
    return get_token(email, password)

RANDOM_USER_TOKEN = create_random_user()

def run_test():
    results = []

    with httpx.Client(base_url=BASE_URL) as client:
        # Setup Item A: Claimed and Approved
        cat_resp = client.get("/api/v1/categories")
        cat_id = cat_resp.json()["data"][0]["id"]
        
        item_payload = {
            "title": "QA Return Item A",
            "description": "Test item for return workflow",
            "item_type": "found",
            "category_id": cat_id,
            "location": "QA Lab",
            "event_date": "2026-10-01T10:00:00Z"
        }
        item_create = client.post("/api/v1/items", json=item_payload, headers={"Authorization": f"Bearer {USER_TOKEN}"})
        item_id = item_create.json()["id"]
        
        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {USER_TOKEN}"})
        reporter_id = me_resp.json()["id"]

        # Create Claimant
        claimant_email = f"claimant_{uuid.uuid4()}@test.com"
        claimant_pw = "Password123"
        client.post("/api/v1/auth/register", json={"full_name": "Claimant User", "email": claimant_email, "password": claimant_pw})
        claimant_token = get_token(claimant_email, claimant_pw)
        me_claimant = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {claimant_token}"})
        claimant_id = me_claimant.json()["id"]

        # Create and Approve Claim
        claim_resp = client.post(f"/api/v1/items/{item_id}/claims", 
                                 json={"ownership_proof": "I have the receipt"},
                                 headers={"Authorization": f"Bearer {claimant_token}"})
        claim_id = claim_resp.json()["id"]
        client.patch(f"/api/v1/claims/{claim_id}/review", 
                     json={"status": "approved", "review_note": "Valid"},
                     headers={"Authorization": f"Bearer {USER_TOKEN}"})

        # --- Scenario 1: Recording Return ---
        # 1.1 Reporter Success
        resp = client.post(f"/api/v1/claims/{claim_id}/return", json={"notes": "Handed over"}, headers={"Authorization": f"Bearer {USER_TOKEN}"})
        results.append(("1.1", "Reporter", resp.status_code, resp.text, resp.status_code == 201))
        return_id = resp.json()["id"] if resp.status_code == 201 else None
        
        # 1.2 Admin - Already Returned
        resp = client.post(f"/api/v1/claims/{claim_id}/return", json={"notes": "Admin"}, headers={"Authorization": f"Bearer {ADMIN_TOKEN}"})
        results.append(("1.2", "Admin (Already Returned)", resp.status_code, resp.text, resp.status_code == 409))
        
        # 1.3 Claimant - Forbidden
        resp = client.post(f"/api/v1/claims/{claim_id}/return", json={"notes": "Me"}, headers={"Authorization": f"Bearer {claimant_token}"})
        results.append(("1.3", "Claimant", resp.status_code, resp.text, resp.status_code == 403))
        
        # 1.4 Random - Forbidden
        resp = client.post(f"/api/v1/claims/{claim_id}/return", json={"notes": "Random"}, headers={"Authorization": f"Bearer {RANDOM_USER_TOKEN}"})
        results.append(("1.4", "Random User", resp.status_code, resp.text, resp.status_code == 403))

        # --- Scenario 2: Viewing by Return ID ---
        if return_id:
            resp = client.get(f"/api/v1/returns/{return_id}", headers={"Authorization": f"Bearer {USER_TOKEN}"})
            results.append(("2.1", "Reporter", resp.status_code, resp.text, resp.status_code == 200))
            
            resp = client.get(f"/api/v1/returns/{return_id}", headers={"Authorization": f"Bearer {claimant_token}"})
            results.append(("2.2", "Claimant", resp.status_code, resp.text, resp.status_code == 200))
            
            resp = client.get(f"/api/v1/returns/{return_id}", headers={"Authorization": f"Bearer {ADMIN_TOKEN}"})
            results.append(("2.3", "Admin", resp.status_code, resp.text, resp.status_code == 200))
            
            resp = client.get(f"/api/v1/returns/{return_id}", headers={"Authorization": f"Bearer {RANDOM_USER_TOKEN}"})
            results.append(("2.4", "Random User", resp.status_code, resp.text, resp.status_code == 403))

        # --- Scenario 3: Viewing by Item ID ---
        resp = client.get(f"/api/v1/items/{item_id}/return", headers={"Authorization": f"Bearer {USER_TOKEN}"})
        results.append(("3.1", "Reporter", resp.status_code, resp.text, resp.status_code == 200))
        
        resp = client.get(f"/api/v1/items/{item_id}/return", headers={"Authorization": f"Bearer {claimant_token}"})
        results.append(("3.2", "Claimant", resp.status_code, resp.text, resp.status_code == 200))
        
        resp = client.get(f"/api/v1/items/{item_id}/return", headers={"Authorization": f"Bearer {ADMIN_TOKEN}"})
        results.append(("3.3", "Admin", resp.status_code, resp.text, resp.status_code == 200))
        
        # Case 3.4: No return yet
        item_2_payload = item_payload.copy()
        item_2_payload["title"] = "QA No Return Item"
        item_2_create = client.post("/api/v1/items", json=item_2_payload, headers={"Authorization": f"Bearer {USER_TOKEN}"})
        item_2_id = item_2_create.json()["id"]
        
        claim_2_resp = client.post(f"/api/v1/items/{item_2_id}/claims", 
                                  json={"ownership_proof": "Proof 2"}, 
                                  headers={"Authorization": f"Bearer {claimant_token}"})
        
        if claim_2_resp.status_code == 201:
            claim_2_id = claim_2_resp.json()["id"]
            client.patch(f"/api/v1/claims/{claim_2_id}/review", 
                         json={"status": "approved", "review_note": "Valid"}, 
                         headers={"Authorization": f"Bearer {USER_TOKEN}"})
        else:
            pass
            
        resp = client.get(f"/api/v1/items/{item_2_id}/return", headers={"Authorization": f"Bearer {USER_TOKEN}"})
        results.append(("3.4", "No Return", resp.status_code, resp.text, resp.status_code == 404))

    return results

if __name__ == "__main__":
    res = run_test()
    print(f"{'Case ID':<10} | {'Actor':<25} | {'Status':<10} | {'Result':<10}")
    print("-" * 60)
    passed = 0
    for cid, actor, status, text, ok in res:
        res_str = "PASS" if ok else "FAIL"
        print(f"{cid:<10} | {actor:<25} | {status:<10} | {res_str:<10}")
        if ok: passed += 1
    print("-" * 60)
    print(f"Total: {len(res)}, Passed: {passed}, Failed: {len(res)-passed}")
