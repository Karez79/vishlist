from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_real_ip(request: Request) -> str:
    # Use rightmost IP — it's set by the trusted proxy (Railway/Vercel).
    # Leftmost is client-controlled and can be spoofed.
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_real_ip)
