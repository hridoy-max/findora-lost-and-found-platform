from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Annotated
from fastapi import Depends
from config import settings

# create_engine uses the connection string from settings.
# For PostgreSQL, the URL should start with postgresql+psycopg://
engine = create_engine(
    settings.DATABASE_URL,
    # echo=True, # Uncomment for SQL logging during development
)

# SessionLocal is the factory for database sessions.
# expire_on_commit=False is crucial for accessing attributes after commit.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# Modern SQLAlchemy 2.0 Base class
class Base(DeclarativeBase):
    pass

# Dependency to get the database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Type alias for cleaner dependency injection in routes
DbSession = Annotated[Session, Depends(get_db)]
