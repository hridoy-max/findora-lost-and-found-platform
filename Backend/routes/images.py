from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
from uuid import UUID
import os
import uuid
import shutil
from pathlib import Path

from database import DbSession
from models import Item
from utils.dependencies import get_current_user
from config import settings

router = APIRouter(tags=["Images"])

# Configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_image(
    db: DbSession,
    current_user=Depends(get_current_user),
    file: UploadFile = File(...)
):
    # 1. Validate Extension
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Validate File Size
    # Note: UploadFile.size is available in recent FastAPI/Starlette versions
    # If not, we read in chunks
    file_size = 0
    content = []

    # Read file to check size and validate content
    try:
        while chunk := await file.read(1024 * 1024):
            file_size += len(chunk)
            content.append(chunk)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File too large. Maximum allowed size is 5MB"
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

    # Reset file pointer if we need to use shutil.copyfileobj,
    # but we already have the content in memory (since it's < 5MB)

    # 3. Generate Unique Filename
    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / unique_filename

    # 4. Save File
    try:
        with open(file_path, "wb") as buffer:
            for chunk in content:
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # 5. Construct URL
    # In production, this would be a CDN or S3 URL.
    # For local dev, we serve /static/uploads
    image_url = f"{settings.FRONTEND_URL}/static/uploads/{unique_filename}"
    # Actually, the backend should provide its own base URL or a relative path.
    # Let's use a common pattern: /static/uploads/... and let the frontend prepend the backend base URL.
    # But the requirements say "return their accessible URL".
    # Let's assume the backend will be served at http://localhost:8000
    # I will use a relative path that the backend static mount will handle.

    return {
        "url": f"/static/uploads/{unique_filename}",
        "filename": unique_filename
    }
