import logging
import re
import socket
from ipaddress import ip_address
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.constants import URL_PARSER_MAX_CONTENT_LENGTH, URL_PARSER_TIMEOUT
from app.core.limiter import limiter
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parse-url", tags=["utils"])

# SSRF protection: block private/internal IPs
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}


class ParseUrlRequest(BaseModel):
    url: str = Field(max_length=2000)


class ParseUrlResponse(BaseModel):
    title: str | None = None
    image_url: str | None = None
    description: str | None = None
    price: int | None = None


def _is_private_ip(hostname: str) -> bool:
    """Check if an IP address string is private/loopback/reserved."""
    try:
        ip = ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_reserved
    except ValueError:
        return False


def is_blocked_host(hostname: str) -> bool:
    """Check hostname against blocklist, including DNS resolution."""
    if hostname in BLOCKED_HOSTS:
        return True
    if _is_private_ip(hostname):
        return True
    # Resolve hostname and check all resolved IPs
    try:
        for _, _, _, _, sockaddr in socket.getaddrinfo(hostname, None):
            if _is_private_ip(sockaddr[0]):
                return True
    except socket.gaierror:
        pass
    return False


async def _validate_redirect(response: httpx.Response) -> None:
    """Block redirects to private/internal IPs (SSRF protection)."""
    if response.is_redirect and response.next_request:
        target = response.next_request.url
        hostname = target.host or ""
        if is_blocked_host(hostname):
            raise httpx.TooManyRedirects(
                "Redirect to private IP blocked",
                request=response.request,
            )
        if target.scheme not in ("http", "https"):
            raise httpx.TooManyRedirects(
                "Redirect to non-HTTP scheme blocked",
                request=response.request,
            )


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


# --- Marketplace-specific parsers ---

def _get_wb_basket(vol: int) -> str:
    """Determine WB CDN basket number from volume."""
    ranges = [
        (143, "01"), (287, "02"), (431, "03"), (719, "04"),
        (1007, "05"), (1061, "06"), (1115, "07"), (1169, "08"),
        (1313, "09"), (1601, "10"), (1655, "11"), (1919, "12"),
        (2045, "13"), (2189, "14"), (2405, "15"), (2621, "16"),
        (2837, "17"), (3053, "18"), (3269, "19"), (3485, "20"),
    ]
    for limit, basket in ranges:
        if vol <= limit:
            return basket
    return "21"


def _parse_wildberries(url: str) -> ParseUrlResponse | None:
    """Extract product image from Wildberries URL using CDN."""
    match = re.search(r"/catalog/(\d+)", url)
    if not match:
        return None

    nm_id = int(match.group(1))
    vol = nm_id // 100000
    part = nm_id // 1000
    basket = _get_wb_basket(vol)

    image_url = (
        f"https://basket-{basket}.wbbasket.ru"
        f"/vol{vol}/part{part}/{nm_id}/images/big/1.webp"
    )

    return ParseUrlResponse(
        title=None,
        image_url=image_url,
        description=None,
        price=None,
    )


def _parse_ozon(url: str) -> ParseUrlResponse | None:
    """Extract what we can from Ozon URL."""
    # Ozon URLs: /product/product-name-slug-123456789/
    match = re.search(r"/product/(.+?)(?:/|\?|$)", url)
    if not match:
        return None

    slug = match.group(1)
    # Extract readable title from slug (replace hyphens, remove trailing ID)
    title_parts = slug.rsplit("-", 1)
    if len(title_parts) == 2 and title_parts[1].isdigit():
        title = title_parts[0].replace("-", " ").strip().capitalize()
    else:
        title = slug.replace("-", " ").strip().capitalize()

    if len(title) > 200:
        title = title[:200]

    return ParseUrlResponse(
        title=title if title else None,
        image_url=None,
        description=None,
        price=None,
    )


def _try_marketplace_parse(url: str) -> ParseUrlResponse | None:
    """Try marketplace-specific parsers before generic fetch."""
    hostname = urlparse(url).hostname or ""

    if "wildberries.ru" in hostname or "wb.ru" in hostname:
        return _parse_wildberries(url)

    if "ozon.ru" in hostname:
        return _parse_ozon(url)

    return None


@router.post("", response_model=ParseUrlResponse)
@limiter.limit("10/minute")
async def parse_url(
    request: Request,
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
    if is_blocked_host(hostname):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый адрес",
        )

    # Try marketplace-specific parsers first (no HTTP fetch needed)
    marketplace_result = _try_marketplace_parse(url)
    if marketplace_result is not None:
        return marketplace_result

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=URL_PARSER_TIMEOUT,
            max_redirects=3,
            event_hooks={"response": [_validate_redirect]},
        ) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось загрузить страницу",
                )

            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > URL_PARSER_MAX_CONTENT_LENGTH:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Страница слишком большая",
                )

            html = response.text[:URL_PARSER_MAX_CONTENT_LENGTH]

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Превышено время ожидания",
        )
    except httpx.TooManyRedirects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый адрес",
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
