from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime, timezone
from models import Item, Claim, ClaimStatus, ItemStatus, User
from schemas import ClaimCreate, ClaimReview, ClaimResponse
from utils.pagination import Page, PageParams
from utils.dependencies import get_current_user
from config import settings

class ClaimService:
    @staticmethod
    def create_claim(db: Session, item_id: UUID, claimant_id: UUID, claim_data: ClaimCreate) -> Claim:
        # 1. Item must exist, be 'found' and 'open'
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if getattr(item.item_type, 'value', item.item_type) != "found":
            raise HTTPException(status_code=409, detail="Only found items can be claimed")

        if item.status != ItemStatus.OPEN:
            raise HTTPException(status_code=409, detail="Item is no longer open for claims")

        # 2. Claimant must not be the reporter
        if item.user_id == claimant_id:
            raise HTTPException(status_code=400, detail="You cannot claim your own item")

        # 3. One claim per user per item
        existing = db.query(Claim).filter(Claim.item_id == item_id, Claim.claimant_id == claimant_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="You have already submitted a claim for this item")

        new_claim = Claim(
            item_id=item_id,
            claimant_id=claimant_id,
            ownership_proof=claim_data.ownership_proof,
            status=ClaimStatus.PENDING
        )
        db.add(new_claim)
        db.commit()
        db.refresh(new_claim)
        return new_claim

    @staticmethod
    def review_claim(db: Session, claim_id: UUID, reviewer_id: UUID, review_data: ClaimReview) -> Claim:
        # Use FOR UPDATE to lock the claim and related item for the duration of the transaction
        claim = db.query(Claim).filter(Claim.id == claim_id).with_for_update().first()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        item = db.query(Item).filter(Item.id == claim.item_id).with_for_update().first()

        # Reviewer must be reporter or admin, and NOT the claimant
        if reviewer_id == claim.claimant_id:
            raise HTTPException(status_code=403, detail="You cannot review your own claim")

        if reviewer_id != item.user_id:
            # check if reviewer is admin (this is usually handled by dependency, but we check here for safety)
            reviewer = db.query(User).filter(User.id == reviewer_id).first()
            if getattr(reviewer.role, 'value', reviewer.role) != "admin":
                raise HTTPException(status_code=403, detail="Only the reporter or an admin can review claims")

        # Transition check: only pending -> approved/rejected
        if claim.status != ClaimStatus.PENDING:
            raise HTTPException(status_code=409, detail="Claim has already been reviewed")

        if review_data.status == "approved":
            # Item must be open to be approved
            if item.status != ItemStatus.OPEN:
                raise HTTPException(status_code=409, detail="Item is no longer open")

            # Approval Transaction:
            # 1. Set this claim to approved
            claim.status = ClaimStatus.APPROVED
            claim.reviewer_id = reviewer_id
            claim.reviewed_at = datetime.now(timezone.utc)
            claim.review_note = review_data.review_note

            # 2. Set item to claimed
            item.status = ItemStatus.CLAIMED

            # 3. Auto-reject all other pending claims on this item
            db.query(Claim).filter(
                Claim.item_id == item.id,
                Claim.id != claim.id,
                Claim.status == ClaimStatus.PENDING
            ).update({
                "status": ClaimStatus.REJECTED,
                "reviewer_id": reviewer_id,
                "reviewed_at": datetime.now(timezone.utc),
                "review_note": "Another claim was approved for this item."
            })

        elif review_data.status == "rejected":
            claim.status = ClaimStatus.REJECTED
            claim.reviewer_id = reviewer_id
            claim.reviewed_at = datetime.now(timezone.utc)
            claim.review_note = review_data.review_note
        else:
            raise HTTPException(status_code=422, detail="Invalid review status")

        db.commit()
        db.refresh(claim)
        return claim

    @staticmethod
    def withdraw_claim(db: Session, claim_id: UUID, claimant_id: UUID):
        claim = db.query(Claim).filter(Claim.id == claim_id, Claim.claimant_id == claimant_id).first()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        if claim.status != ClaimStatus.PENDING:
            raise HTTPException(status_code=409, detail="Reviewed claims cannot be withdrawn")

        db.delete(claim)
        db.commit()
