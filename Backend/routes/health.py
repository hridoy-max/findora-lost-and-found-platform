from fastapi import APIRouter, Depends
from database import get_db
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter(tags=["Health"])

@router.get("/", tags=["Health"])
async def root():
    return {"message": "Welcome to Findora API. Visit /docs for documentation."}

@router.get("/health", tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}
