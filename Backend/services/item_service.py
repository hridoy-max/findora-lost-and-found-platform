from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from models import Category, Item, ItemStatus
from schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryAdminResponse,
    ItemCreate, ItemUpdate, ItemResponse, ItemStatusUpdate
)
from utils.pagination import Page, PageParams, escape_like
from utils.dependencies import get_current_user
from config import settings

class ItemService:
    @staticmethod
    def create_item(db: Session, item_data: ItemCreate, user_id: UUID) -> Item:
        # Verify category exists and is active
        category = db.query(Category).filter(Category.id == item_data.category_id, Category.is_active == True).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active category not found")

        # Event date must not be in the future
        event_date = item_data.event_date
        if event_date.tzinfo is None:
            event_date = event_date.replace(tzinfo=timezone.utc)

        if event_date > datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Event date cannot be in the future")

        # image_url validation (https only)
        if item_data.image_url and not item_data.image_url.startswith("https://"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image URL must use HTTPS")

        # Check IMAGE_ALLOWED_HOSTS
        if settings.IMAGE_ALLOWED_HOSTS and item_data.image_url:
            allowed = settings.IMAGE_ALLOWED_HOSTS.split(",")
            host = item_data.image_url.split("//")[1].split("/")[0]
            if host not in allowed:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image host not allowed")

        new_item = Item(
            **item_data.model_dump(),
            user_id=user_id,
            status=ItemStatus.OPEN
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def list_items(
        db: Session,
        params: PageParams,
        include_closed: bool = False,
        item_type: Optional[str] = None,
        category_id: Optional[UUID] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple[List[Item], int]:
        from sqlalchemy.orm import joinedload
        query = db.query(Item).options(joinedload(Item.category), joinedload(Item.reporter))

        if not include_closed:
            query = query.filter(Item.status != ItemStatus.CLOSED)

        # Search
        if params.search:
            search_term = escape_like(params.search.strip())
            # Match by title or description
            query = query.filter(
                (Item.title.ilike(f"%{search_term}%")) |
                (Item.description.ilike(f"%{search_term}%"))
            )
            try:
                import uuid
                uid = uuid.UUID(params.search)
                query = query.filter(
                    (Item.title.ilike(f"%{search_term}%")) |
                    (Item.description.ilike(f"%{search_term}%")) |
                    (Item.id == uid)
                )
            except ValueError:
                pass

        # Additional Filters
        if item_type and item_type != "all":
            query = query.filter(Item.item_type == item_type)
        if category_id:
            query = query.filter(Item.category_id == category_id)
        if status and status != "all":
            query = query.filter(Item.status == status)
        if start_date:
            query = query.filter(Item.event_date >= start_date)
        if end_date:
            query = query.filter(Item.event_date <= end_date)

        # Sorting
        sort_map = {
            "created_at": Item.created_at,
            "event_date": Item.event_date,
            "title": Item.title
        }
        sort_col = sort_map.get(params.sort_by, Item.created_at)
        query = query.order_by(sort_col.desc() if params.order == "desc" else sort_col.asc(), Item.id.asc())

        total = query.count()
        items = query.offset((params.page - 1) * params.page_size).limit(params.page_size).all()

        return items, total

    @staticmethod
    def update_item(db: Session, item_id: UUID, update_data: ItemUpdate, user_id: UUID, is_admin: bool) -> Item:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # Ownership/Role checks
        if not is_admin and item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this item")

        # State checks
        if item.status == ItemStatus.RETURNED:
            raise HTTPException(status_code=400, detail="Returned items cannot be edited")

        if not is_admin and item.status != ItemStatus.OPEN:
            raise HTTPException(status_code=400, detail="Only open items can be edited by the owner")

        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(item, key, value)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_item(db: Session, item_id: UUID, user_id: UUID, is_admin: bool):
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if not is_admin and item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this item")

        # check for claims
        from models import Claim
        claim_count = db.query(Claim).filter(Claim.item_id == item_id).count()
        if claim_count > 0:
            raise HTTPException(status_code=409, detail="Item has claims; close it instead")

        db.delete(item)
        db.commit()

    @staticmethod
    def close_item(db: Session, item_id: UUID, user_id: UUID, is_admin: bool):
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if not is_admin and item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to close this item")

        item.status = ItemStatus.CLOSED
        db.commit()
        db.refresh(item)
        return item
