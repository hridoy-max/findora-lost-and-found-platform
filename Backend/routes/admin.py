from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from database import DbSession
from schemas import (
    AdminUserCreate, AdminUserStatusUpdate, AdminUserRoleUpdate,
    ItemStatusUpdate, AdminDashboard, UserPublic, CategoryAdminResponse, Page, ClaimResponse, ItemResponse, CategoryResponse, CategoryCreate
)
from services.dashboard_service import DashboardService
from utils.dependencies import get_current_user, require_admin
from models import User, Item, ItemStatus, Category, Claim
from config import settings

router = APIRouter(tags=["Admin"])

# --- User Management ---

@router.get("/users", response_model=Page[UserPublic])
async def list_admin_users(
    db: DbSession,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin=Depends(require_admin)
):
    from utils.pagination import Page, escape_like
    import math

    query = db.query(User)
    if search:
        search_esc = escape_like(search)
        query = query.filter(
            (User.full_name.ilike(f"%{search_esc}%")) |
            (User.email.ilike(f"%{search_esc}%")) |
            (User.id == search) # Handle exact UUID search
        )
    if role:
        if role.lower() != "all":
            query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    # Stable sort by created_at and id as tie-breaker
    items = query.order_by(User.created_at.desc(), User.id).offset((page - 1) * page_size).limit(page_size).all()

    return Page(
        data=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0
    )

@router.post("/users", status_code=status.HTTP_201_CREATED, response_model=UserPublic)
async def create_admin_user(data: AdminUserCreate, db: DbSession, admin=Depends(require_admin)):
    # Normal registration checks
    existing = db.query(User).filter(User.email.ilike(data.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    from utils import security
    new_user = User(
        full_name=data.full_name,
        email=data.email.strip().lower(),
        password_hash=security.hash_password(data.password),
        role=data.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: UUID, data: AdminUserStatusUpdate, db: DbSession, admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Protection: Last Active Admin
    if data.is_active == False and user.role == "admin":
        active_admins = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if active_admins <= 1:
            raise HTTPException(status_code=409, detail="Cannot deactivate the last active admin")

    user.is_active = data.is_active
    db.commit()
    return {"detail": "User status updated"}

@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: UUID, data: AdminUserRoleUpdate, db: DbSession, admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Protection: Last Active Admin
    if data.role != "admin" and user.role == "admin":
        active_admins = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if active_admins <= 1:
            raise HTTPException(status_code=409, detail="Cannot demote the last active admin")

    user.role = data.role
    db.commit()
    return {"detail": "User role updated"}

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID, db: DbSession, admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Protection: Last Active Admin
    if user.role == "admin" and user.is_active:
        active_admins = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if active_admins <= 1:
            raise HTTPException(status_code=409, detail="Cannot delete the last active admin")

    # Check history (items, claims)
    item_count = db.query(Item).filter(Item.user_id == user_id).count()
    claim_count = db.query(Claim).filter(Claim.claimant_id == user_id).count()
    if item_count > 0 or claim_count > 0:
        raise HTTPException(status_code=409, detail="User has item or claim history and cannot be deleted")

    db.delete(user)
    db.commit()
    return None

# --- Claims Oversight ---

@router.get("/claims", response_model=Page[ClaimResponse])
async def list_admin_claims(
    db: DbSession,
    search: Optional[str] = None,
    status: Optional[str] = None,
    item_id: Optional[UUID] = None,
    claimant_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin=Depends(require_admin)
):
    from utils.pagination import escape_like
    import math
    from routes.claims import format_claim_response

    query = db.query(Claim)
    if search:
        search_esc = escape_like(search)
        query = query.join(Item).join(User, Claim.claimant_id == User.id).filter(
            (Item.title.ilike(f"%{search_esc}%")) |
            (User.full_name.ilike(f"%{search_esc}%")) |
            (Claim.id == search)
        )
    if status:
        if status.lower() != "all":
            try:
                from models import ClaimStatus
                query = query.filter(Claim.status == ClaimStatus(status))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid claim status: {status}")
    if item_id:
        query = query.filter(Claim.item_id == item_id)
    if claimant_id:
        query = query.filter(Claim.claimant_id == claimant_id)

    total = query.count()
    # Stable sort by created_at
    claims = query.order_by(Claim.created_at.desc(), Claim.id).offset((page - 1) * page_size).limit(page_size).all()

    return Page(
        data=[format_claim_response(c, None) if admin else format_claim_response(c, None) for c in claims], # Admin sees everything
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0
    )

@router.get("/claims/pending", response_model=Page[ClaimResponse])
async def list_admin_pending_claims(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin=Depends(require_admin)
):
    from routes.claims import format_claim_response
    import math
    from models import ClaimStatus

    query = db.query(Claim).filter(Claim.status == ClaimStatus.PENDING)
    total = query.count()
    claims = query.order_by(Claim.created_at.asc(), Claim.id).offset((page - 1) * page_size).limit(page_size).all()

    return Page(
        data=[format_claim_response(c, None) for c in claims],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0
    )

# --- Category Management ---

@router.post("/categories", status_code=status.HTTP_201_CREATED, response_model=CategoryResponse)
async def create_admin_category(data: CategoryCreate, db: DbSession, admin=Depends(require_admin)):
    # Case-insensitive unique check
    existing = db.query(Category).filter(Category.name.ilike(data.name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")

    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# --- Item/Category Moderation ---

@router.get("/items", response_model=Page[ItemResponse])
async def list_admin_items(
    db: DbSession,
    search: Optional[str] = None,
    item_type: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = "created_at",
    order: str = "desc",
    admin=Depends(require_admin)
):
    from utils.pagination import PageParams
    import math
    from services.item_service import ItemService
    from schemas import ItemResponse
    from datetime import datetime, timezone
    import uuid

    # 1. Handle empty strings and normalize inputs
    search = search.strip() if search else None
    item_type = item_type.strip() if item_type else None
    if item_type == "all":
        item_type = None

    status = status.strip() if status else None
    if status == "all":
        status = None

    # category_id handling
    parsed_category_id = None
    if category_id and category_id.strip():
        if category_id.strip().lower() != "all":
            try:
                parsed_category_id = uuid.UUID(category_id.strip())
            except ValueError:
                parsed_category_id = None
        else:
            parsed_category_id = None


    # Date handling
    def parse_date(date_str):
        if not date_str or not date_str.strip() or date_str.strip().lower() == "all": return None
        try:
            return datetime.fromisoformat(date_str.strip().replace("Z", "+00:00"))
        except ValueError:
            return None


    parsed_start = parse_date(start_date)
    parsed_end = parse_date(end_date)

    params = PageParams(page=page, page_size=page_size, search=search, sort_by=sort_by, order=order)

    items, total = ItemService.list_items(
        db, params,
        include_closed=True,
        item_type=item_type,
        category_id=parsed_category_id,
        status=status,
        start_date=parsed_start,
        end_date=parsed_end
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
        total_pages=math.ceil(total / page_size) if total > 0 else 0
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
        total_pages=math.ceil(total / page_size) if total > 0 else 0
    )

@router.get("/categories", response_model=List[CategoryAdminResponse])

async def list_admin_categories(db: DbSession, admin=Depends(require_admin)):
    # Return all categories with item counts
    from sqlalchemy import func
    data = db.query(Category, func.count(Item.id)).join(Item, isouter=True).group_by(Category.id).all()

    return [CategoryAdminResponse(
        id=cat.id, name=cat.name, description=cat.description,
        is_active=cat.is_active, items_count=count
    ) for cat, count in data]

@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_admin_item(item_id: UUID, db: DbSession, admin=Depends(require_admin)):
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

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_item(item_id: UUID, db: DbSession, admin=Depends(require_admin)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check for claims
    claim_count = db.query(Claim).filter(Claim.item_id == item_id).count()
    if claim_count > 0:
        raise HTTPException(status_code=409, detail="Item has claims and cannot be deleted")

    db.delete(item)
    db.commit()
    return None

@router.patch("/items/{item_id}/status")
async def moderate_item_status(item_id: UUID, data: ItemStatusUpdate, db: DbSession, admin=Depends(require_admin)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Only open <-> closed moderation
    new_status = data.status
    if new_status not in ["open", "closed"]:
        raise HTTPException(status_code=400, detail="Admins can only moderate between 'open' and 'closed'")

    if item.status == ItemStatus.RETURNED:
        raise HTTPException(status_code=400, detail="Returned items cannot be moderated")

    item.status = new_status
    db.commit()
    return {"detail": "Item status updated"}

@router.get("/dashboard", response_model=AdminDashboard)
async def get_admin_dashboard(db: DbSession, admin=Depends(require_admin)):
    return DashboardService.get_admin_dashboard(db)
