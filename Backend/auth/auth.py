from fastapi import APIRouter, Depends, HTTPException, status, Form
from typing import Annotated
from sqlalchemy.orm import Session
from database import DbSession
from models import User
from schemas import (
    UserRegister, UserLogin, UserMe, TokenResponse,
    RefreshRequest, PasswordChange, ForgotPasswordRequest, ResetPasswordRequest
)
from services.user_service import UserService
from utils.dependencies import get_current_user
from utils import security
from config import settings
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# DbDependency = DbSession
UserDependency = Annotated[User, Depends(get_current_user)]

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserMe)
async def register(user_data: UserRegister, db: DbSession):
    user = UserService.register_user(db, user_data)
    return UserMe(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role if isinstance(user.role, str) else user.role.value,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: DbSession):
    user = UserService.authenticate_user(db, login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return UserService.create_token_response(user)

@router.post("/login/oauth2", response_model=TokenResponse)
async def login_oauth2(
    username: Annotated[str, Form()],
    password: Annotated[str, Form()],
    db: DbSession
):
    # \"\"\"
    # Separate endpoint for Swagger/OAuth2 compatibility.
    # Uses form data as required by the OAuth2 specification.
    # \"\"\"
    login_data = UserLogin(email=username, password=password)
    user = UserService.authenticate_user(db, login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return UserService.create_token_response(user)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: DbSession):
    try:
        payload = security.decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        user = UserService.get_user_by_id(db, payload["sub"])
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # Verify pwf
        if security.create_password_fingerprint(user.password_hash) != payload.get("pwf"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        return UserService.create_token_response(user)

    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.get("/me", response_model=UserMe)
async def me(current_user=Depends(get_current_user)):
    return UserMe(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role if isinstance(current_user.role, str) else current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.post("/logout")
async def logout():
    return {"detail": "Successfully logged out"}

@router.patch("/change-password", response_model=TokenResponse)
async def change_password(data: PasswordChange, db: DbSession, current_user=Depends(get_current_user)):
    if not security.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect current password")

    if data.new_password == data.current_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must differ from current")

    current_user.password_hash = security.hash_password(data.new_password)
    db.commit()
    db.refresh(current_user)

    return UserService.create_token_response(current_user)

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: DbSession):
    # Business logic for forgot password (send email) would go in a service
    # But for now, we just return the generic message
    # ... call email_service.send_reset_link(...)
    return {"detail": "If an account exists for this email, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: DbSession):
    try:
        payload = security.decode_token(data.token)
        if payload.get("type") != "reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or has expired")

        user = UserService.get_user_by_id(db, payload["sub"])
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or has expired")

        if security.create_password_fingerprint(user.password_hash) != payload.get("pwf"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or has expired")

        user.password_hash = security.hash_password(data.new_password)
        db.commit()

        return {"detail": "Password has been reset successfully"}

    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or has expired")
