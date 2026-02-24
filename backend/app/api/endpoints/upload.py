import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.constants import ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE
from app.models.user import User

router = APIRouter()

MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

UPLOAD_DIR = Path(settings.UPLOAD_DIR)


class UploadResponse(BaseModel):
    url: str


@router.post("/upload", response_model=UploadResponse)
async def upload_image(
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Допустимые форматы: JPEG, PNG, WebP")

    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(400, "Максимальный размер файла — 5 МБ")

    ext = MIME_TO_EXT.get(file.content_type, "jpg")
    filename = f"{uuid.uuid4()}.{ext}"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(data)

    base_url = settings.BASE_URL.rstrip("/")
    return UploadResponse(url=f"{base_url}/api/uploads/{filename}")


@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(400, "Invalid filename")

    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(404, "File not found")

    ext = filepath.suffix.lower()
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }

    return FileResponse(
        filepath,
        media_type=content_types.get(ext, "application/octet-stream"),
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
