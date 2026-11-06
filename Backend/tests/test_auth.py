import pytest
from fastapi import status
from utils import security
from datetime import timedelta
from models import User
from sqlalchemy import text

def test_register_success(client, db_session):
    payload = {
        "full_name": "New User",
        "email": "new@test.com",
        "password": "Password123!",
        "phone": "+1234567890"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED

    user = db_session.query(User).filter(User.email == "new@test.com").first()
    assert user is not None
    assert user.password_hash.startswith("$2b$") # bcrypt check

def test_register_duplicate_email(client, demo_user):
    payload = {
        "full_name": "Duplicate User",
        "email": demo_user["user"].email,
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_409_CONFLICT

def test_register_forbidden_role(client):
    payload = {
        "full_name": "Hacker",
        "email": "hacker@test.com",
        "password": "Password123!",
        "role": "admin" # Should be forbidden by extra="forbid"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_register_weak_password(client):
    payload = {
        "full_name": "Weak",
        "email": "weak@test.com",
        "password": "123" # Too short, no letter
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_login_success(client, demo_user):
    payload = {
        "email": demo_user["user"].email,
        "password": "User123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, demo_user):
    payload = {
        "email": demo_user["user"].email,
        "password": "WrongPassword123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid email or password"

def test_login_unknown_email(client):
    payload = {
        "email": "unknown@test.com",
        "password": "SomePassword123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid email or password"

def test_login_inactive_user(client, db_session, demo_user):
    user = demo_user["user"]
    user.is_active = False
    db_session.commit()

    payload = {
        "email": user.email,
        "password": "User123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_refresh_success(client, demo_user):
    # Create a refresh token
    refresh_token = security.create_token(
        subject=str(demo_user["user"].id),
        token_type="refresh",
        expires_delta=timedelta(days=7),
        password_hash=demo_user["user"].password_hash
    )

    payload = {"refresh_token": refresh_token}
    response = client.post("/api/v1/auth/refresh", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_refresh_invalid_token_type(client, demo_user):
    # Use access token as refresh token
    access_token = demo_user["token"]

    payload = {"refresh_token": access_token}
    response = client.post("/api/v1/auth/refresh", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_auth_me_success(client, demo_user):
    headers = {"Authorization": f"Bearer {demo_user['token']}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == demo_user["user"].email

def test_auth_me_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
