from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from database import DbSession
from schemas import ClaimCreate, ClaimReview, ClaimResponse, Page, PageParams
from services.claim_service import ClaimService
from utils.dependencies import get_current_user
from models import Claim, User, Item
from config import settings

router = APIRouter(tags=["Claims"])

def format_claim_response(claim: Claim, current_user_id: Optional[UUID]) -> ClaimResponse:
    """
    Handles the visibility rules for ClaimResponse.
    """
    # Basic data
    res = ClaimResponse(
        id=claim.id,
        item_id=claim.item_id,
        claimant_id=claim.claimant_id,
        status=getattr(claim.status, 'value', claim.status),
        created_at=claim.created_at,
        updated_at=claim.updated_at,
        item={
            "id": claim.item.id,
            "title": claim.item.title,
            "item_type": getattr(claim.item.item_type, 'value', claim.item.item_type),
            "status": getattr(claim.item.status, 'value', claim.item.status)
        },
        claimant={
            "id": claim.claimant.id,
            "full_name": claim.claimant.full_name,
            "role": getattr(claim.claimant.role, 'value', claim.claimant.role),
            "created_at": claim.claimant.created_at
        },
        review_note=getattr(claim.review_note, 'value', claim.review_note) if claim.review_note else None
    )

    # 1. Proof Visibility: Claimant, Item Reporter, or Admin
    # If current_user_id is None, we assume it's an Admin call from admin routes
    if current_user_id is None or current_user_id == claim.claimant_id or current_user_id == claim.item.user_id:
        res.ownership_proof = claim.ownership_proof

    # 2. Contact Visibility: Only approved claims, only to Claimant and Reporter
    if getattr(claim.status, 'value', claim.status) == "approved":
        if current_user_id:
            if current_user_id == claim.claimant_id:
                # Claimant sees Reporter's contact
                reporter = claim.item.reporter
                res.counterparty_contact = {
                    "full_name": reporter.full_name,
                    "email": reporter.email,
                    "phone": reporter.phone
                }
            elif current_user_id == claim.item.user_id:
                # Reporter sees Claimant's contact
                claimant = claim.claimant
                res.counterparty_contact = {
                    "full_name": claimant.full_name,
                    "email": claimant.email,
                    "phone": claimant.phone
                }
        else:
            # Admin sees both (or custom admin view)
            # As per spec, contact details only for parties.
            # But typically admin might need them for verification.
            # For now, let's keep it strict: Admin doesn't get counterparty_contact
            # unless specifically requested, to avoid leaking PII unnecessarily.
            pass

    return res

@router.get("/my-claims", response_model=Page[ClaimResponse])
async def my_claims(
    db: DbSession,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    query = db.query(Claim).filter(Claim.claimant_id == current_user.id)
    if status:
        query = query.filter(Claim.status == status)

    total = query.count()
    claims = query.offset((page-1)*page_size).limit(page_size).all()

    return Page(
        data=[format_claim_response(c, current_user.id) for c in claims],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(claim_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Access: Claimant, Item Reporter, or Admin
    if current_user.id != claim.claimant_id and current_user.id != claim.item.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view this claim")

    return format_claim_response(claim, current_user.id)

@router.get("/my-claims", response_model=Page[ClaimResponse])

@router.patch("/{claim_id}/review", response_model=ClaimResponse)
async def review_claim(claim_id: UUID, data: ClaimReview, db: DbSession, current_user=Depends(get_current_user)):
    claim = ClaimService.review_claim(db, claim_id, current_user.id, data)
    return format_claim_response(claim, current_user.id)

@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_claim(claim_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    ClaimService.withdraw_claim(db, claim_id, current_user.id)
    return None
