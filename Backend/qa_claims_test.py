import httpx
import pytest
import json
from config import Settings

settings = Settings()
BASE_URL = "http://localhost:8000/api/v1"

def get_token(email, password):
    with httpx.Client(base_url=BASE_URL) as client:
        response = client.post("/auth/login", json={"email": email, "password": password})
        if response.status_code != 200:
            return None
        return response.json()["access_token"]

def test_claims_qa():
    # 1. Setup Users
    admin_token = get_token(settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)
    user_token = get_token(settings.DEMO_USER_EMAIL, settings.DEMO_USER_PASSWORD)
    
    if not admin_token or not user_token:
        print("Failed to obtain tokens. Ensure server is running and seeded.")
        return

    # Create additional users for testing (Claimant 2, Unauthorized)
    with httpx.Client(base_url=BASE_URL) as client:
        # Claimant 2
        client.post("/auth/register", json={
            "full_name": "Claimant Two",
            "email": "claimant2@test.com",
            "password": "Password123"
        })
        claimant2_token = get_token("claimant2@test.com", "Password123")

        # Unauthorized User
        client.post("/auth/register", json={
            "full_name": "Unauthorized User",
            "email": "unauth@test.com",
            "password": "Password123"
        })
        unauth_token = get_token("unauth@test.com", "Password123")

    # 2. Setup Items
    # We need:
    # - Found/Open item (owned by Reporter)
    # - Lost/Open item
    # - Found/Closed item
    
    # Reporter is the demo user
    with httpx.Client(base_url=BASE_URL, headers={"Authorization": f"Bearer {user_token}"}) as client:
        # Found/Open
        item_found_open = client.post("/items", json={
            "title": "Found Watch",
            "description": "A silver watch found in the park",
            "item_type": "found",
            "category_id": "some-category-id", # Need real ID
            "location": "Central Park",
            "event_date": "2023-10-01T10:00:00Z"
        })
        # Wait, I need real category IDs. Let's fetch them.
    
    print("Setup script initialized. I will now implement the full test suite in a separate file.")

if __name__ == "__main__":
    test_claims_qa()
