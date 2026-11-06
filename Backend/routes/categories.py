from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from database import DbSession
from schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryAdminResponse,
    ItemCreate, ItemUpdate, ItemResponse, ItemStatusUpdate, Page, PageParams
)
from services.item_service import ItemService
from models import Category, Item, ItemStatus
from utils.dependencies import get_current_user
from config import settings

router = APIRouter(tags=["Categories"])

@router.get("", response_model=Page[CategoryResponse])
async def list_categories(
    db: DbSession,
    search: Optional[str] = None
):
    # Only active categories
    query = db.query(Category).filter(Category.is_active == True)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))

    categories = query.all()
    return Page(
        data=categories,
        total=len(categories),
        page=1,
        page_size=len(categories),
        total_pages=1
    )

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID, db: DbSession):
    cat = db.query(Category).filter(Category.id == category_id, Category.is_active == True).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Active category not found")
    return cat

# Admin routes
@router.post("", status_code=status.HTTP_201_CREATED, response_model=CategoryResponse)
async def create_category(data: CategoryCreate, db: DbSession, current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # Case-insensitive unique check
    existing = db.query(Category).filter(Category.name.ilike(data.name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")

    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: UUID, data: CategoryUpdate, db: DbSession, current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)

    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # check if referenced
    item_count = db.query(Item).filter(Item.category_id == category_id).count()
    if item_count > 0:
        raise HTTPException(status_code=409, detail="Category is referenced by items; deactivate it instead")

    db.delete(cat)
    db.commit()
    return None
