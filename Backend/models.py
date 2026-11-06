import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Text, Boolean, DateTime, func, CheckConstraint, UniqueConstraint, Index, ForeignKeyConstraint, text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from database import Base

# --- Enums ---

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class ItemType(str, Enum):
    LOST = "lost"
    FOUND = "found"

class ItemStatus(str, Enum):
    OPEN = "open"
    CLAIMED = "claimed"
    RETURNED = "returned"
    CLOSED = "closed"

class ClaimStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# --- Models ---

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role", values_callable=lambda e: [m.value for m in e]), default=UserRole.USER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # Relationships
    items: Mapped[List["Item"]] = relationship(back_populates="reporter")
    claims: Mapped[List["Claim"]] = relationship(back_populates="claimant", foreign_keys="[Claim.claimant_id]")
    reviewed_claims: Mapped[List["Claim"]] = relationship(back_populates="reviewer", foreign_keys="[Claim.reviewer_id]")

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[List["Item"]] = relationship(back_populates="category")

class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    item_type: Mapped[ItemType] = mapped_column(SAEnum(ItemType, name="item_type", values_callable=lambda e: [m.value for m in e]), nullable=False)
    status: Mapped[ItemStatus] = mapped_column(SAEnum(ItemStatus, name="item_status", values_callable=lambda e: [m.value for m in e]), default=ItemStatus.OPEN, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # Relationships
    category: Mapped["Category"] = relationship(back_populates="items")
    reporter: Mapped["User"] = relationship(back_populates="items")
    claims: Mapped[List["Claim"]] = relationship(back_populates="item")

    __table_args__ = (
        Index("ix_items_type_status_created", "item_type", "status", text("created_at DESC")),
        Index("ix_items_category_status", "category_id", "status"),
        Index("ix_items_user_created", "user_id", text("created_at DESC")),
        Index("ix_items_event_date", "event_date"),
    )

class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("items.id", ondelete="RESTRICT"), nullable=False)
    claimant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    ownership_proof: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ClaimStatus] = mapped_column(SAEnum(ClaimStatus, name="claim_status", values_callable=lambda e: [m.value for m in e]), default=ClaimStatus.PENDING, nullable=False)
    reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    review_note: Mapped[Optional[str]] = mapped_column(String(1000))
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # Relationships
    item: Mapped["Item"] = relationship(back_populates="claims")
    claimant: Mapped["User"] = relationship(back_populates="claims", foreign_keys=[claimant_id])
    reviewer: Mapped[Optional["User"]] = relationship(back_populates="reviewed_claims", foreign_keys=[reviewer_id])

    __table_args__ = (
        UniqueConstraint("item_id", "claimant_id", name="uq_item_claimant"),
        UniqueConstraint("id", "item_id", name="uq_claim_item"),
        CheckConstraint(
            "(status = 'pending' AND reviewed_at IS NULL) OR (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL)",
            name="chk_claim_review_timestamp"
        ),
        Index(
            "uq_claims_approved_item",
            "item_id",
            unique=True,
            postgresql_where=text("status = 'approved'")
        ),
        Index("ix_claims_item_status", "item_id", "status"),
        Index("ix_claims_claimant_created", "claimant_id", text("created_at DESC")),
    )

class ItemReturn(Base):
    __tablename__ = "item_returns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("items.id", ondelete="RESTRICT"), nullable=False)
    claim_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("claims.id", ondelete="RESTRICT"), unique=True, nullable=False)
    returned_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    received_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    returned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    notes: Mapped[Optional[str]] = mapped_column(Text)

    __table_args__ = (
        UniqueConstraint("item_id", name="uq_item_return"),
        ForeignKeyConstraint(
            ["claim_id", "item_id"],
            ["claims.id", "claims.item_id"],
            name="fk_item_returns_claim_item",
            ondelete="RESTRICT"
        ),
        CheckConstraint("returned_by <> received_by", name="chk_return_different_users"),
    )
