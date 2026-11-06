from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional

T = TypeVar("T")

class PageParams(BaseModel):
    page: int = 1
    page_size: int = 10
    search: Optional[str] = None
    sort_by: Optional[str] = None
    order: str = "desc"

class Page(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

def escape_like(value: str) -> str:
    """
    Escape special characters for SQL ILIKE patterns.
    """
    if not value:
        return ""
    return value.replace("%", "\\%").replace("_", "\\_")
