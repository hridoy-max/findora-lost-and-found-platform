from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from database import DbSession
from schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemStatusUpdate, Page, PageParams, ClaimResponse, ClaimCreate
)
from services.item_service import ItemService
from utils.dependencies import get_current_user, require_admin
from models import Item, ItemStatus
from config import settings
from routes.claims import format_claim_response

from routes.claims import format_claim_response

router = APIRouter(tags=["Items"])

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ItemResponse)
async def create_item(data: ItemCreate, db: DbSession, current_user=Depends(get_current_user)):
    item = ItemService.create_item(db, data, current_user.id)
    # Convert to ItemResponse with nested dicts
    return ItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        item_type=item.item_type if isinstance(item.item_type, str) else item.item_type.value,
        status=item.status if isinstance(item.status, str) else item.status.value,
        location=item.location,
        event_date=item.event_date,
        image_url=item.image_url,
        category={"id": item.category.id, "name": item.category.name},
        reporter={"id": item.reporter.id, "full_name": item.reporter.full_name},
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.get("/admin/items", response_model=Page[ItemResponse])
async def list_admin_items(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    item_type: Optional[str] = None,
    category_id: Optional[UUID] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    admin=Depends(require_admin)
):
    params = PageParams(page=page, page_size=page_size, search=search, sort_by=sort_by, order=order)

    items, total = ItemService.list_items(
        db, params,
        include_closed=True,
        item_type=item_type,
        category_id=category_id,
        status=status,
        start_date=start_date,
        end_date=end_date
    )

    res_items = [ItemResponse(
        id=i.id, title=i.title, description=i.description,
        item_type=i.item_type if isinstance(i.item_type, str) else i.item_type.value,
        status=i.status if isinstance(i.status, str) else i.status.value,
        location=i.location, event_date=i.event_date,
        image_url=i.image_url, category={"id": i.category.id, "name": i.category.name},
        reporter={"id": i.reporter.id, "full_name": i.reporter.full_name},
        created_at=i.created_at, updated_at=i.updated_at
    ) for i in items]

    return Page(
        data=res_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("", response_model=Page[ItemResponse])
async def list_items(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    item_type: Optional[str] = None,
    category_id: Optional[UUID] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: str = "created_at",
    order: str = "desc"
):
    params = PageParams(page=page, page_size=page_size, search=search, sort_by=sort_by, order=order)

    # Pass all filters to the service
    items, total = ItemService.list_items(
        db, params,
        item_type=item_type,
        category_id=category_id,
        status=status,
        start_date=start_date,
        end_date=end_date
    )

    res_items = [ItemResponse(
        id=i.id, title=i.title, description=i.description,
        item_type=i.item_type if isinstance(i.item_type, str) else i.item_type.value,
        status=i.status if isinstance(i.status, str) else i.status.value,
        location=i.location, event_date=i.event_date,
        image_url=i.image_url, category={"id": i.category.id, "name": i.category.name},
        reporter={"id": i.reporter.id, "full_name": i.reporter.full_name},
        created_at=i.created_at, updated_at=i.updated_at
    ) for i in items]

    return Page(
        data=res_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/my-items", response_model=Page[ItemResponse])
async def my_items(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    current_user=Depends(get_current_user)
):
    params = PageParams(page=page, page_size=page_size, search=search, sort_by=sort_by, order=order)

    # Filter by user
    query = db.query(Item).filter(Item.user_id == current_user.id)
    # Apply search/sort (similar to list_items)
    # ...
    # To avoid duplication, we'd move this logic to ItemService.list_user_items

    # For now, we'll just use a simplified version
    items = query.offset((page-1)*page_size).limit(page_size).all()
    total = query.count()

    res_items = [ItemResponse(
        id=i.id, title=i.title, description=i.description,
        item_type=i.item_type if isinstance(i.item_type, str) else i.item_type.value,
        status=i.status if isinstance(i.status, str) else i.status.value,
        location=i.location, event_date=i.event_date,
        image_url=i.image_url, category={"id": i.category.id, "name": i.category.name},
        reporter={"id": i.reporter.id, "full_name": i.reporter.full_name},
        created_at=i.created_at, updated_at=i.updated_at
    ) for i in items]

    return Page(data=res_items, total=total, page=page, page_size=page_size, total_pages=(total+page_size-1)//page_size)

@router.post("/{item_id}/claims", status_code=status.HTTP_201_CREATED, response_model=ClaimResponse)
async def create_claim(item_id: UUID, data: ClaimCreate, db: DbSession, current_user=Depends(get_current_user)):
    from services.claim_service import ClaimService
    claim = ClaimService.create_claim(db, item_id, current_user.id, data)
    return format_claim_response(claim, current_user.id)

@router.get("/{item_id}/claims", response_model=Page[ClaimResponse])
async def list_item_claims(item_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    from routes.claims import list_item_claims as get_item_claims_impl
    # Since the logic is already in routes/claims.py, we can either move it
    # or call it. However, to avoid circular imports or duplication,
    # and since the user wants this under /items/{id}/claims,
    # we define it here.

    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Access: Item Reporter or Admin
    if current_user.id != item.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view claims for this item")

    query = db.query(Claim).filter(Claim.item_id == item_id)
    total = query.count()
    claims = query.all()

    return Page(
        data=[format_claim_response(c, current_user.id) for c in claims],
        total=total,
        page=1,
        page_size=len(claims),
        total_pages=1
    )

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: UUID, db: DbSession):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return ItemResponse(
        id=item.id, title=item.title, description=item.description,
        item_type=item.item_type if isinstance(item.item_type, str) else item.item_type.value,
        status=item.status if isinstance(item.status, str) else item.status.value,
        location=item.location, event_date=item.event_date,
        image_url=item.image_url, category={"id": item.category.id, "name": item.category.name},
        reporter={"id": item.reporter.id, "full_name": item.reporter.full_name},
        created_at=item.created_at, updated_at=item.updated_at
    )

@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(item_id: UUID, data: ItemUpdate, db: DbSession, current_user=Depends(get_current_user)):
    item = ItemService.update_item(db, item_id, data, current_user.id, current_user.role == "admin")
    return ItemResponse(
        id=item.id, title=item.title, description=item.description,
        item_type=item.item_type if isinstance(item.item_type, str) else item.item_type.value,
        status=item.status if isinstance(item.status, str) else item.status.value,
        location=item.location, event_date=item.event_date,
        image_url=item.image_url, category={"id": item.category.id, "name": item.category.name},
        reporter={"id": item.reporter.id, "full_name": item.reporter.full_name},
        created_at=item.created_at, updated_at=item.updated_at
    )

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    ItemService.delete_item(db, item_id, current_user.id, current_user.role == "admin")
    return None

@router.patch("/{item_id}/close", response_model=ItemResponse)
async def close_item(item_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    item = ItemService.close_item(db, item_id, current_user.id, current_user.role == "admin")
    return ItemResponse(
        id=item.id, title=item.title, description=item.description,
        item_type=item.item_type if isinstance(item.item_type, str) else item.item_type.value,
        status=item.status if isinstance(item.status, str) else item.status.value,
        location=item.location, event_date=item.event_date,
        image_url=item.image_url, category={"id": item.category.id, "name": item.category.name},
        reporter={"id": item.reporter.id, "full_name": item.reporter.full_name},
        created_at=item.created_at, updated_at=item.updated_at
    )
