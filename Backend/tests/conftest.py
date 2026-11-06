import pytest
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
from app import app
from database import Base
from models import User, Category
from utils import security
import uuid
from datetime import timedelta

# 1. Setup Test Database
# Use TEST_DATABASE_URL from settings
TEST_DATABASE_URL = settings.TEST_DATABASE_URL

test_engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False
)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure the test database schema is up to date before running tests."""
    # In a real scenario, we'd call 'alembic upgrade head'
    # For simplicity in tests, we can use Base.metadata.create_all,
    # but the spec says Alembic is the only schema-management method.
    # We assume the bootstrap_test_db.py has been run or we do it here.
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    """Provides a transactional session that rolls back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Crucial: the app uses a different session from get_db.
    # We must override the app's get_db dependency to use this test session.
    from app import app
    from database import get_db
    app.dependency_overrides[get_db] = lambda: session

    yield session

    app.dependency_overrides.clear()
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client():
    """FastAPI TestClient."""
    with TestClient(app) as client:
        yield client

@pytest.fixture
def async_client():
    """Async FastAPI Client using httpx."""
    # Removed 'async with' because this is a sync fixture
    # For true async tests, use pytest-asyncio and async fixtures
    with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def admin_user(db_session):
    """Creates an admin user and returns their details and token."""
    admin = User(
        id=uuid.uuid4(),
        full_name="Test Admin",
        email="admin@test.com",
        password_hash=security.hash_password("Admin123!"),
        role="admin",
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    token = security.create_token(
        subject=str(admin.id),
        token_type="access",
        expires_delta=timedelta(minutes=30),
        password_hash=admin.password_hash
    )
    return {"user": admin, "token": token}

@pytest.fixture
def demo_user(db_session):
    """Creates a regular user and returns their details and token."""
    user = User(
        id=uuid.uuid4(),
        full_name="Test User",
        email="user@test.com",
        password_hash=security.hash_password("User123!"),
        role="user",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    token = security.create_token(
        subject=str(user.id),
        token_type="access",
        expires_delta=timedelta(minutes=30),
        password_hash=user.password_hash
    )
    return {"user": user, "token": token}

@pytest.fixture
def active_categories(db_session):
    """Seeds a set of active categories."""
    categories = ["Electronics", "Documents", "Wallets & Bags", "Keys"]
    cat_map = {}
    for name in categories:
        cat = Category(id=uuid.uuid4(), name=name, is_active=True)
        db_session.add(cat)
        cat_map[name] = cat
    db_session.commit()
    return cat_map
