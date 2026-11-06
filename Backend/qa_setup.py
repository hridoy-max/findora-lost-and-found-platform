import httpx
from config import Settings

settings = Settings()
BASE_URL = "http://localhost:8000/api/v1"

def get_token(email, password):
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.post("/auth/login", json={"email": email, "password": password})
        if response.status_code != 200:
            return None
        return response.json()["access_token"]

def setup():
    # 1. Tokens
    admin_token = get_token(settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)
    reporter_token = get_token(settings.DEMO_USER_EMAIL, settings.DEMO_USER_PASSWORD)
    
    if not admin_token or not reporter_token:
        print("Error obtaining base tokens.")
        return None

    with httpx.Client(base_url=BASE_URL) as client:
        # 2. Create extra users
        users = [
            {"full_name": "Claimant One", "email": "claimant1@test.com", "password": "Password123"},
            {"full_name": "Claimant Two", "email": "claimant2@test.com", "password": "Password123"},
            {"full_name": "Unauthorized", "email": "unauth@test.com", "password": "Password123"},
        ]
        for u in users:
            client.post("/auth/register", json=u)
        
        c1_token = get_token("claimant1@test.com", "Password123")
        c2_token = get_token("claimant2@test.com", "Password123")
        unauth_token = get_token("unauth@test.com", "Password123")

        # 3. Get a category
        cat_res = client.get("/categories")
        if cat_res.status_code != 200:
            print("Error fetching categories")
            return None
        category_id = cat_res.json()["data"][0]["id"]

        # 4. Create Items
        with httpx.Client(base_url=BASE_URL, headers={"Authorization": f"Bearer {reporter_token}"}) as r_client:
            # Found/Open
            found_open_res = r_client.post("/items", json={
                "title": "QA Found Item",
                "description": "Found a precious item during QA testing",
                "item_type": "found",
                "category_id": category_id,
                "location": "QA Lab",
                "event_date": "2023-01-01T10:00:00Z"
            })
            found_open_id = found_open_res.json()["id"]

            # Lost/Open
            lost_open_res = r_client.post("/items", json={
                "title": "QA Lost Item",
                "description": "Lost a precious item during QA testing",
                "item_type": "lost",
                "category_id": category_id,
                "location": "QA Lab",
                "event_date": "2023-01-01T10:00:00Z"
            })
            lost_open_id = lost_open_res.json()["id"]

            # Found/Closed
            found_closed_res = r_client.post("/items", json={
                "title": "QA Found Closed Item",
                "description": "Found but already closed item",
                "item_type": "found",
                "category_id": category_id,
                "location": "QA Lab",
                "event_date": "2023-01-01T10:00:00Z"
            })
            found_closed_id = found_closed_res.json()["id"]
            r_client.patch(f"/items/{found_closed_id}/close", json={})

    return {
        "tokens": {
            "admin": admin_token,
            "reporter": reporter_token,
            "claimant1": c1_token,
            "claimant2": c2_token,
            "unauth": unauth_token
        },
        "items": {
            "found_open": found_open_id,
            "lost_open": lost_open_id,
            "found_closed": found_closed_id
        }
    }

if __name__ == "__main__":
    import json
    data = setup()
    if data:
        print(json.dumps(data))
