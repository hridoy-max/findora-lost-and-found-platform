from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Dict, Any
from uuid import UUID
from models import User, Item, ItemStatus, Category, Claim, ClaimStatus
from schemas import UserDashboard, AdminDashboard
from utils.pagination import Page, PageParams

class DashboardService:
    @staticmethod
    def get_user_dashboard(db: Session, user_id: UUID) -> UserDashboard:
        try:
            # 1. Item stats
            my_items = db.query(Item).filter(Item.user_id == user_id).all()
            total_items = len(my_items)

            by_status = {}
            by_type = {}
            for i in my_items:
                status_val = getattr(i.status, 'value', i.status)
                type_val = getattr(i.item_type, 'value', i.item_type)
                by_status[status_val] = by_status.get(status_val, 0) + 1
                by_type[type_val] = by_type.get(type_val, 0) + 1

            # 2. Claim stats
            my_claims = db.query(Claim).filter(Claim.claimant_id == user_id).all()
            claims_by_status = {}
            for c in my_claims:
                status_val = getattr(c.status, 'value', c.status)
                claims_by_status[status_val] = claims_by_status.get(status_val, 0) + 1

            # 3. Pending claims on my items
            pending_claims_data = {
                "count": 0,
                "recent": []
            }

            from models import User
            pending_claims = db.query(Claim).join(Item).filter(
                Item.user_id == user_id,
                Claim.status == ClaimStatus.PENDING
            ).order_by(Claim.created_at.desc()).all()

            pending_claims_data["count"] = len(pending_claims)
            for pc in pending_claims[:5]:
                claimant_name = pc.claimant.full_name if pc.claimant else "Unknown"
                pending_claims_data["recent"].append({
                    "id": pc.id,
                    "title": pc.item.title if pc.item else "Unknown Item",
                    "claimant": claimant_name,
                    "created_at": pc.created_at
                })

            # 4. Recent reports
            recent_items_raw = db.query(Item).filter(Item.user_id == user_id).order_by(Item.created_at.desc()).limit(5).all()

            # Fix Pydantic ValidationError by manually mapping ORM objects to dicts
            recent_items = []
            for i in recent_items_raw:
                recent_items.append({
                    "id": i.id,
                    "title": i.title,
                    "description": i.description,
                    "item_type": i.item_type if isinstance(i.item_type, str) else i.item_type.value,
                    "status": i.status if isinstance(i.status, str) else i.status.value,
                    "location": i.location,
                    "event_date": i.event_date,
                    "image_url": i.image_url,
                    "category": {"id": i.category.id, "name": i.category.name} if i.category else None,
                    "reporter": {"id": i.reporter.id, "full_name": i.reporter.full_name} if i.reporter else None,
                    "created_at": i.created_at,
                    "updated_at": i.updated_at
                })

            return UserDashboard(
                my_items_total=total_items,
                my_items_by_status=by_status,
                my_items_by_type=by_type,
                my_claims_by_status=claims_by_status,
                pending_claims_on_my_items=pending_claims_data,
                recent_items=recent_items
            )
        except Exception as e:
            import traceback
            print(f"CRITICAL ERROR in get_user_dashboard for user {user_id}: {str(e)}")
            traceback.print_exc()
            raise e

    @staticmethod
    def get_admin_dashboard(db: Session) -> AdminDashboard:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()

        from models import ItemType
        total_found = db.query(Item).filter(Item.item_type == ItemType.FOUND).count()
        total_lost = db.query(Item).filter(Item.item_type == ItemType.LOST).count()

        open_items = db.query(Item).filter(Item.status == ItemStatus.OPEN).count()
        pending_claims = db.query(Claim).filter(Claim.status == ClaimStatus.PENDING).count()
        returned_items = db.query(Item).filter(Item.status == ItemStatus.RETURNED).count()

        from sqlalchemy import func
        cat_data = db.query(Category.name, func.count(Item.id)).join(Item).group_by(Category.name).all()
        items_by_category = [{"category": name, "count": count} for name, count in cat_data]

        claim_data = db.query(Claim.status, func.count(Claim.id)).group_by(Claim.status).all()
        claims_by_status = [{"status": getattr(s, 'value', s), "count": count} for s, count in claim_data]

        from datetime import datetime, timedelta, timezone
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        time_data = db.query(func.date(Item.created_at), func.count(Item.id)).filter(Item.created_at >= thirty_days_ago).group_by(func.date(Item.created_at)).all()
        items_over_time = [{"date": str(d), "count": count} for d, count in time_data]

        return AdminDashboard(
            total_users=total_users,
            active_users=active_users,
            total_lost_items=total_lost,
            total_found_items=total_found,
            open_items=open_items,
            pending_claims=pending_claims,
            returned_items=returned_items,
            items_by_category=items_by_category,
            items_over_time=items_over_time,
            claims_by_status=claims_by_status
        )
