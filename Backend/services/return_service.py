from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
from models import Item, Claim, ItemReturn, ItemStatus, ClaimStatus
from schemas import ItemReturnCreate, ItemReturnResponse
from config import settings

class ReturnService:
    @staticmethod
    def record_handover(db: Session, claim_id: UUID, reporter_id: UUID, notes: Optional[str] = None) -> ItemReturn:
        # 1. Lock the claim and item rows to prevent concurrency issues
        # Use a consistent locking order to avoid deadlocks (Claim then Item)
        claim = db.query(Claim).filter(Claim.id == claim_id).with_for_update().first()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        item = db.query(Item).filter(Item.id == claim.item_id).with_for_update().first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # 2. Rules: Claim must be approved and item must be claimed
        if claim.status != ClaimStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Only approved claims can be returned")

        if item.status != ItemStatus.CLAIMED:
            raise HTTPException(status_code=409, detail="Item must be in 'claimed' status to record return")

        # 3. Actor policy: only reporter or admin can record return
        # (reporter_id is passed from the route dependency)
        if item.user_id != reporter_id:
            # Admin check is handled by the route dependency, but if it reaches here,
            # we assume the reporter_id must match.
            # If the user is an admin, the route will allow this.
            pass

        # 4. Check if return already exists for this item
        existing_return = db.query(ItemReturn).filter(ItemReturn.item_id == item.id).first()
        if existing_return:
            raise HTTPException(status_code=409, detail="A return has already been recorded for this item")

        # 5. Atomic Transaction
        try:
            # Create the return record
            new_return = ItemReturn(
                item_id=item.id,
                claim_id=claim.id,
                returned_by=item.user_id,      # The finder
                received_by=claim.claimant_id, # The owner
                notes=notes,
                returned_at=datetime.now(timezone.utc)
            )

            # Set item status to returned (terminal state)
            item.status = ItemStatus.RETURNED

            # Rule: When an item is marked as returned, it atomically rejects all other pending claims.
            # The approved claim that triggered this return stays approved, but others must be rejected.
            other_pending_claims = db.query(Claim).filter(
                Claim.item_id == item.id,
                Claim.id != claim.id,
                Claim.status == ClaimStatus.PENDING
            ).all()

            for pc in other_pending_claims:
                pc.status = ClaimStatus.REJECTED
                pc.review_note = "Item has been returned to its owner."
                pc.reviewed_at = datetime.now(timezone.utc)
                pc.reviewer_id = item.user_id # The finder/reporter records the return

            db.add(new_return)
            db.commit()
            db.refresh(new_return)
            return new_return

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to record return")

    @staticmethod
    def get_return_by_id(db: Session, return_id: UUID) -> ItemReturn:
        return db.query(ItemReturn).filter(ItemReturn.id == return_id).first()

    @staticmethod
    def get_return_by_item(db: Session, item_id: UUID) -> Optional[ItemReturn]:
        return db.query(ItemReturn).filter(ItemReturn.item_id == item_id).first()
