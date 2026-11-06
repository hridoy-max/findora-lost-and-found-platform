from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Generic, TypeVar
from uuid import UUID
from datetime import datetime
from utils.pagination import PageParams, Page

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    detail: str

# --- User Schemas ---

class UserPublic(BaseModel):
    id: UUID
    full_name: str
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserMe(UserPublic):
    email: EmailStr
    phone: Optional[str]
    role: str
    is_active: bool

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=30)
    model_config = ConfigDict(extra="forbid")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)

# --- Auth Schemas ---

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserMe

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class RefreshRequest(BaseModel):
    refresh_token: str

# --- Category Schemas ---

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class CategoryAdminResponse(CategoryResponse):
    items_count: int

# --- Item Schemas ---

class ItemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    location: str = Field(..., max_length=255)
    event_date: datetime
    image_url: Optional[str] = Field(None, max_length=500)

class ItemCreate(ItemBase):
    category_id: UUID
    item_type: str # 'lost' or 'found'
    model_config = ConfigDict(extra="forbid")

class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = Field(None, max_length=255)
    image_url: Optional[str] = Field(None, max_length=500)

class ItemResponse(BaseModel):
    id: UUID
    title: str
    description: str
    item_type: str
    status: str
    location: str
    event_date: datetime
    image_url: Optional[str]
    category: dict # Simplified nested: {"id": uuid, "name": str}
    reporter: dict # Simplified nested: {"id": uuid, "full_name": str}
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ItemStatusUpdate(BaseModel):
    status: str

# --- Claim Schemas ---

class ClaimCreate(BaseModel):
    ownership_proof: str = Field(..., min_length=10, max_length=2000)
    model_config = ConfigDict(extra="forbid")

class ClaimReview(BaseModel):
    status: str # 'approved' or 'rejected'
    review_note: Optional[str] = Field(None, max_length=1000)

class ClaimResponse(BaseModel):
    id: UUID
    item_id: UUID
    claimant_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    item: dict # Summary: {"id", "title", "item_type", "status"}
    claimant: UserPublic
    ownership_proof: Optional[str] = None # Private
    review_note: Optional[str] = None
    counterparty_contact: Optional[dict] = None # Only for approved
    model_config = ConfigDict(from_attributes=True)

# --- Return Schemas ---

class ItemReturnCreate(BaseModel):
    notes: Optional[str] = None

class ItemReturnResponse(BaseModel):
    id: UUID
    item_id: UUID
    claim_id: UUID
    returned_by: UUID
    received_by: UUID
    returned_at: datetime
    notes: Optional[str]
    model_config = ConfigDict(from_attributes=True)

# --- Dashboard Schemas ---

class UserDashboard(BaseModel):
    my_items_total: int
    my_items_by_status: dict
    my_items_by_type: dict
    my_claims_by_status: dict
    pending_claims_on_my_items: dict # count + 5 most recent
    recent_items: List[ItemResponse]

class AdminDashboard(BaseModel):
    total_users: int
    active_users: int
    total_lost_items: int
    total_found_items: int
    open_items: int
    pending_claims: int
    returned_items: int
    items_by_category: List[dict]
    items_over_time: List[dict]
    claims_by_status: List[dict]

class AdminUserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Optional[str] = "user"
    model_config = ConfigDict(extra="forbid")

class AdminUserStatusUpdate(BaseModel):
    is_active: bool

class AdminUserRoleUpdate(BaseModel):
    role: str
