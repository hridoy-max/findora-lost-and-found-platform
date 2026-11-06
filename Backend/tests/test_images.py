import pytest
from fastapi.testclient import TestClient
from fastapi import status
from database import engine, Base
from app import app
from utils.dependencies import get_current_user
from models import User
import os
import shutil
from pathlib import Path

client = TestClient(app)

# Mock current user for authenticated requests
def mock_user():
    return User(id="00000000-0000-0000-0000-000000000000", full_name="Test User", role="user")

app.dependency_overrides[get_current_user] = mock_user

@pytest.fixture(scope="module", autouse=True)
def setup_uploads():
    upload_dir = Path("uploads")
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
    upload_dir.mkdir()
    yield
    # shutil.rmtree(upload_dir) # keep for inspection if needed

def test_upload_image_success():
    # Create a dummy image file
    test_file = Path("test_image.png")
    test_file.write_bytes(b"fake image content")

    with open(test_file, "rb") as f:
        response = client.post(
            "/api/v1/images/upload",
            files={"file": ("test_image.png", f, "image/png")}
        )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/static/uploads/")
    assert os.path.exists(f"uploads/{data['filename']}")

    test_file.unlink()

def test_upload_image_invalid_type():
    test_file = Path("test_file.txt")
    test_file.write_bytes(b"fake text content")

    with open(test_file, "rb") as f:
        response = client.post(
            "/api/v1/images/upload",
            files={"file": ("test_file.txt", f, "text/plain")}
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid file type" in response.json()["detail"]

    test_file.unlink()

def test_upload_image_too_large():
    # Create a file slightly larger than 5MB
    test_file = Path("large_image.png")
    with open(test_file, "wb") as f:
        f.write(b"0" * (5 * 1024 * 1024 + 100))

    with open(test_file, "rb") as f:
        response = client.post(
            "/api/v1/images/upload",
            files={"file": ("large_image.png", f, "image/png")}
        )

    assert response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    assert "File too large" in response.json()["detail"]

    test_file.unlink()

def test_upload_unauthenticated():
    # Remove the mock
    app.dependency_overrides.clear()

    test_file = Path("test_image.png")
    test_file.write_bytes(b"fake image content")

    with open(test_file, "rb") as f:
        response = client.post(
            "/api/v1/images/upload",
            files={"file": ("test_image.png", f, "image/png")}
        )

    # Should be 401 because get_current_user fails
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # Restore mock for other tests if needed (though here we are at the end)
    app.dependency_overrides[get_current_user] = mock_user
    test_file.unlink()
