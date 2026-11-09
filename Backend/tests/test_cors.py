import pytest
from fastapi.testclient import TestClient
from starlette.routing import Route
from Backend.app import app

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Module-level override of database fixture so CORS unit tests don't require PostgreSQL."""
    pass

@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)

@pytest.fixture
def temp_error_endpoint():
    """Fixture providing a temporary route that raises an error, cleaned up after test."""
    async def _failing_endpoint(request):
        raise RuntimeError("Simulated crash for CORS test")

    test_route = Route("/api/v1/test-cors-error", _failing_endpoint, methods=["GET"])
    app.routes.append(test_route)
    try:
        yield "/api/v1/test-cors-error"
    finally:
        if test_route in app.routes:
            app.routes.remove(test_route)

def test_cors_preflight_production_frontend(client):
    response = client.options(
        "/api/v1/items",
        headers={
            "Origin": "https://findora-frontend-fawn.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://findora-frontend-fawn.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "GET" in response.headers.get("access-control-allow-methods", "")

def test_cors_preflight_localhost(client):
    response = client.options(
        "/api/v1/categories",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_preflight_disallowed_origin(client):
    response = client.options(
        "/api/v1/items",
        headers={
            "Origin": "https://unauthorized-domain.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 400

def test_cors_get_production_frontend(client):
    response = client.get(
        "/health",
        headers={"Origin": "https://findora-frontend-fawn.vercel.app"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://findora-frontend-fawn.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_exception_handler_allowed_origin(client, temp_error_endpoint):
    response = client.get(
        temp_error_endpoint,
        headers={"Origin": "https://findora-frontend-fawn.vercel.app"},
    )
    assert response.status_code == 500
    assert response.headers.get("access-control-allow-origin") == "https://findora-frontend-fawn.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_exception_handler_disallowed_origin(client, temp_error_endpoint):
    response = client.get(
        temp_error_endpoint,
        headers={"Origin": "https://unauthorized-domain.com"},
    )
    assert response.status_code == 500
    assert response.headers.get("access-control-allow-origin") is None

def test_app_routes_isolation_after_tests():
    # Verify no test endpoints leak into the global app routes
    route_paths = [getattr(r, "path", None) for r in app.routes]
    assert "/api/v1/test-cors-error" not in route_paths
