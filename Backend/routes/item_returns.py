from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from database import DbSession
from schemas import ItemReturnCreate, ItemReturnResponse
from services.return_service import ReturnService
from utils.dependencies import get_current_user
from models import Item, Claim, ItemReturn
from config import settings

router = APIRouter(tags=["Item Returns"])

@router.post("/claims/{claim_id}/return", status_code=status.HTTP_201_CREATED, response_model=ItemReturnResponse)
async def record_return(
    claim_id: UUID,
    data: ItemReturnCreate,
    db: DbSession,
    current_user=Depends(get_current_user)
):
    # Only reporter or admin can record return
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    item = db.query(Item).filter(Item.id == claim.item_id).first()

    if current_user.id != item.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the item reporter or an admin can record the return")

    return ReturnService.record_handover(
        db=db,
        claim_id=claim_id,
        reporter_id=current_user.id,
        notes=data.notes
    )

@router.get("/returns/{return_id}", response_model=ItemReturnResponse)
async def get_return(return_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    ret = ReturnService.get_return_by_id(db, return_id)
    if not ret:
        raise HTTPException(status_code=404, detail="Return record not found")

    # Access: Claimant, Reporter, or Admin
    if (current_user.id != ret.received_by and
        current_user.id != ret.returned_by and
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="You do not have permission to view this return")

    return ret

@router.get("/items/{item_id}/return", response_model=ItemReturnResponse)
async def get_item_return(item_id: UUID, db: DbSession, current_user=Depends(get_current_user)):
    ret = ReturnService.get_return_by_item(db, item_id)
    if not ret:
        raise HTTPException(status_code=404, detail="No return recorded for this item")

    # Access: Claimant, Reporter, or Admin
    if (current_user.id != ret.received_by and
        current_user.id != ret.returned_by and
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="You do not have permission to view this return")

    return ret
