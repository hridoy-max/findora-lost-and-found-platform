import httpx
import pytest
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:8081"

# Personas
ADMIN_EMAIL = "admin@findora.com"
ADMIN_PASSWORD = "Admin123"
USER_EMAIL = "user@findora.com"
USER_PASSWORD = "User123"
OTHER_USER_EMAIL = "other@findora.com"
OTHER_USER_PASSWORD = "OtherPassword123"

def get_token(email, password):
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        response.raise_for_status()
        return response.json()["access_token"]

def create_user(email, password, full_name="Test User"):
    with httpx.Client(base_url=BASE_URL) as client:
        return client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "full_name": full_name
        })

def setup_personas():
    # Ensure other user exists
    create_user(OTHER_USER_EMAIL, OTHER_USER_PASSWORD, "Other User")

    return {
        "admin": get_token(ADMIN_EMAIL, ADMIN_PASSWORD),
        "reporter": get_token(USER_EMAIL, USER_PASSWORD),
        "other": get_token(OTHER_USER_EMAIL, OTHER_USER_PASSWORD),
    }

def test_items_qa():
    tokens = setup_personas()
    headers_reporter = {"Authorization": f"Bearer {tokens['reporter']}"}
    headers_admin = {"Authorization": f"Bearer {tokens['admin']}"}
    headers_other = {"Authorization": f"Bearer {tokens['other']}"}

    results = []

    def log_result(scenario, action, expected_code, actual_code, response_body, result):
        results.append({
            "Scenario": scenario,
            "Action": action,
            "Expected": expected_code,
            "Actual": actual_code,
            "Response": str(response_body)[:100],
            "Result": result
        })

    with httpx.Client(base_url=BASE_URL) as client:
        # 1. Setup Categories
        cat_resp = client.get("/api/v1/categories")
        category_id = cat_resp.json()["data"][0]["id"]

        # --- A. Creation Tests ---

        # A.1 Success Path
        item_data = {
            "title": "Found iPhone 13",
            "description": "Found an iPhone 13 near the park. Blue color.",
            "item_type": "found",
            "category_id": category_id,
            "location": "Central Park",
            "event_date": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        }
        resp = client.post("/api/v1/items", json=item_data, headers=headers_reporter)
        actual_code = resp.status_code
        item_id = resp.json().get("id") if actual_code == 201 else None
        res = "PASS" if actual_code == 201 else "FAIL"
        log_result("A.1 Success Path", "Create valid found item", 201, actual_code, resp.text, res)

        # A.2 Future Date
        item_future = item_data.copy()
        item_future["event_date"] = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        resp = client.post("/api/v1/items", json=item_future, headers=headers_reporter)
        res = "PASS" if resp.status_code == 422 else "FAIL"
        log_result("A.2 Future Date", "Create item with future date", 422, resp.status_code, resp.text, res)

        # A.3 Insecure Image
        item_img = item_data.copy()
        item_img["image_url"] = "http://insecure.com/img.jpg"
        resp = client.post("/api/v1/items", json=item_img, headers=headers_reporter)
        res = "PASS" if resp.status_code == 422 else "FAIL"
        log_result("A.3 Insecure Image", "Create item with http image", 422, resp.status_code, resp.text, res)

        # A.4 Invalid Category
        item_cat = item_data.copy()
        item_cat["category_id"] = str(uuid.uuid4())
        resp = client.post("/api/v1/items", json=item_cat, headers=headers_reporter)
        res = "PASS" if resp.status_code == 404 or resp.status_code == 422 else "FAIL"
        log_result("A.4 Invalid Category", "Create item with non-existent category", 404, resp.status_code, resp.text, res)

        # --- B. Public Listing ---

        # B.1 Search Text
        resp = client.get("/api/v1/items", params={"search": "iPhone"}, headers={})
        res = "PASS" if resp.status_code == 200 and any("iPhone" in i["title"] for i in resp.json()["data"]) else "FAIL"
        log_result("B.1 Search Text", "Search items by title", 200, resp.status_code, resp.text, res)

        # B.2 Search UUID
        if item_id:
            resp = client.get("/api/v1/items", params={"search": item_id}, headers={})
            res = "PASS" if resp.status_code == 200 and len(resp.json()["data"]) > 0 and resp.json()["data"][0]["id"] == item_id else "FAIL"
            log_result("B.2 Search UUID", f"Search items by ID {item_id}", 200, resp.status_code, resp.text, res)
        else:
            log_result("B.2 Search UUID", "Skip - Item not created", 200, 0, "N/A", "SKIP")

        # B.3 Filter Type
        resp = client.get("/api/v1/items", params={"item_type": "found"}, headers={})
        res = "PASS" if resp.status_code == 200 and all(i["item_type"] == "found" for i in resp.json()["data"]) else "FAIL"
        log_result("B.3 Filter Type", "Filter by item_type=found", 200, resp.status_code, resp.text, res)

        # --- C. User & Admin Views ---

        # C.1 My Items
        resp = client.get("/api/v1/items/my-items", headers=headers_reporter)
        res = "PASS" if resp.status_code == 200 and any(i["id"] == item_id for i in resp.json()["data"]) else "FAIL"
        log_result("C.1 My Items", "Verify owner sees own items", 200, resp.status_code, resp.text, res)

        # C.2 Admin Items
        resp = client.get("/api/v1/admin/items", headers=headers_admin)
        res = "PASS" if resp.status_code == 200 else "FAIL"
        log_result("C.2 Admin Items", "Verify admin sees all items", 200, resp.status_code, resp.text, res)

        # --- D. Updates ---

        # D.1 Owner Update
        update_data = {"title": "Updated iPhone Title"}
        resp = client.patch(f"/api/v1/items/{item_id}", json=update_data, headers=headers_reporter)
        res = "PASS" if resp.status_code == 200 else "FAIL"
        log_result("D.1 Owner Update", "Owner updates own item", 200, resp.status_code, resp.text, res)

        # D.2 Other User Update
        resp = client.patch(f"/api/v1/items/{item_id}", json=update_data, headers=headers_other)
        res = "PASS" if resp.status_code == 403 else "FAIL"
        log_result("D.2 Other User Update", "Non-owner updates item", 403, resp.status_code, resp.text, res)

        # --- E. Deletion ---

        # E.1 Owner Delete
        resp = client.delete(f"/api/v1/items/{item_id}", headers=headers_reporter)
        res = "PASS" if resp.status_code == 204 else "FAIL"
        log_result("E.1 Owner Delete", "Owner deletes own item", 204, resp.status_code, resp.text, res)

        # E.2 Delete Non-existent
        resp = client.delete(f"/api/v1/items/{uuid.uuid4()}", headers=headers_reporter)
        res = "PASS" if resp.status_code == 404 else "FAIL"
        log_result("E.2 Delete Non-existent", "Delete random UUID", 404, resp.status_code, resp.text, res)

    # Report Summary
    passed = sum(1 for r in results if r["Result"] == "PASS")
    print(f"\n--- QA REPORT ---")
    for r in results:
        print(f"{r['Scenario']} | {r['Action']} | Expected: {r['Expected']} | Actual: {r['Actual']} | Result: {r['Result']}")
    print(f"\nTotal Tests: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {len(results) - passed}")

if __name__ == "__main__":
    test_items_qa()
