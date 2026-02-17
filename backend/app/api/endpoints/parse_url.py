import logging
import re
from ipaddress import ip_address
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parse-url", tags=["utils"])

MAX_CONTENT_SIZE = 1 * 1024 * 1024  # 1 MB
TIMEOUT = 5.0

# SSRF protection: block private/internal IPs
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}


class ParseUrlRequest(BaseModel):
    url: str = Field(max_length=2000)


class ParseUrlResponse(BaseModel):
    title: str | None = None
    image_url: str | None = None
    description: str | None = None
    price: int | None = None


def is_private_ip(hostname: str) -> bool:
    try:
        ip = ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_reserved
    except ValueError:
        return False


def extract_price(text: str | None) -> int | None:
    if not text:
        return None
    # Match price patterns like "25 000 ₽", "25000 руб", "$250"
    patterns = [
        r'([\d\s]+)\s*(?:₽|руб|рублей|RUB)',
        r'(?:от\s+)?([\d\s]+)\s*(?:₽|руб)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(" ", "").replace("\xa0", "")
            try:
                price = int(price_str)
                if 1 <= price <= 10_000_000:
                    return price
            except ValueError:
                continue
    return None


@router.post("", response_model=ParseUrlResponse)
async def parse_url(
    data: ParseUrlRequest,
    user: User = Depends(get_current_user),
):
    url = data.url.strip()

    # Validate URL format
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поддерживаются только HTTP/HTTPS ссылки",
        )

    hostname = parsed.hostname or ""
    if hostname in BLOCKED_HOSTS or is_private_ip(hostname):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый адрес",
        )

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=TIMEOUT,
            max_redirects=3,
        ) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; Vishlist/1.0)",
                    "Accept": "text/html",
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось загрузить страницу",
                )

            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > MAX_CONTENT_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Страница слишком большая",
                )

            html = response.text[:MAX_CONTENT_SIZE]

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Превышено время ожидания",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось подключиться к сайту",
        )

    soup = BeautifulSoup(html, "lxml")

    # Extract OG tags
    og_title = soup.find("meta", property="og:title")
    og_image = soup.find("meta", property="og:image")
    og_description = soup.find("meta", property="og:description")

    title = og_title["content"] if og_title and og_title.get("content") else None
    if not title:
        title_tag = soup.find("title")
        title = title_tag.string.strip() if title_tag and title_tag.string else None

    image_url = og_image["content"] if og_image and og_image.get("content") else None
    description = og_description["content"] if og_description and og_description.get("content") else None

    # Try to extract price from page content
    price = extract_price(html[:50000])

    return ParseUrlResponse(
        title=title[:200] if title else None,
        image_url=image_url[:2000] if image_url else None,
        description=description[:500] if description else None,
        price=price,
    )
