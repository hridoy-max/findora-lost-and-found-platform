from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from database import DbSession
from schemas import UserProfileUpdate, UserDashboard, UserPublic, UserMe
from services.dashboard_service import DashboardService
from utils.dependencies import get_current_user
from models import User

router = APIRouter(tags=["Users"])

@router.patch("/me", response_model=UserMe)
async def update_me(data: UserProfileUpdate, db: DbSession, current_user=Depends(get_current_user)):
    update_dict = data.model_dump(exclude_unset=True)
    if "full_name" in update_dict and update_dict["full_name"] is not None:
        update_dict["full_name"] = update_dict["full_name"].strip()
    for key, value in update_dict.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/dashboard", response_model=UserDashboard)
async def get_my_dashboard(db: DbSession, current_user=Depends(get_current_user)):
    return DashboardService.get_user_dashboard(db, current_user.id)

@router.get("/{user_id}", response_model=UserPublic)
async def get_user_profile(user_id: UUID, db: DbSession):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
