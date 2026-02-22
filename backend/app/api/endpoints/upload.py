import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile
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
    filename = f"items/{uuid.uuid4()}.{ext}"

    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"https://blob.vercel-storage.com/{filename}",
            content=data,
            headers={
                "Authorization": f"Bearer {settings.VERCEL_BLOB_READ_WRITE_TOKEN}",
                "x-api-version": "7",
                "x-content-type": file.content_type,
                "x-cache-control-max-age": "31536000",
            },
        )
        if resp.status_code != 200:
            raise HTTPException(502, "Ошибка загрузки файла")
        blob = resp.json()

    return UploadResponse(url=blob["url"])
