from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from uuid import UUID
from models import User, UserRole
from schemas import UserRegister, UserLogin, UserMe, TokenResponse
from utils import security
from config import settings
from datetime import timedelta

class UserService:
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        # Email normalization
        email = user_data.email.strip().lower()

        # Check duplicate email
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        # Create user
        new_user = User(
            full_name=user_data.full_name.strip(),
            email=email,
            phone=user_data.phone,
            password_hash=security.hash_password(user_data.password),
            role="user",
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Optional[User]:
        email = login_data.email.strip().lower()
        user = db.query(User).filter(User.email == email).first()

        # Dummy hash check to prevent timing attacks
        if not user:
            # Use a valid bcrypt hash to avoid ValueError: Invalid salt
            # This is just to ensure the timing is similar.
            security.verify_password("dummy_password", security.hash_password("dummy_password"))
            return None

        if not security.verify_password(login_data.password, user.password_hash):
            return None

        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create_token_response(user: User) -> TokenResponse:
        access_token = security.create_token(
            subject=str(user.id),
            token_type="access",
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            password_hash=user.password_hash
        )
        refresh_token = security.create_token(
            subject=str(user.id),
            token_type="refresh",
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            password_hash=user.password_hash
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserMe(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                role=user.role if isinstance(user.role, str) else user.role.value,
                is_active=user.is_active,
                created_at=user.created_at
            )
        )
