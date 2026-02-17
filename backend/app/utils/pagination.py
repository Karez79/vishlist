import math

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE


async def paginate(
    db: AsyncSession,
    query: Select,
    page: int = 1,
    per_page: int = DEFAULT_PAGE_SIZE,
) -> dict:
    per_page = min(per_page, MAX_PAGE_SIZE)
    page = max(page, 1)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * per_page
    paginated_query = query.offset(offset).limit(per_page)
    result = await db.execute(paginated_query)
    items = list(result.scalars().all())

    pages = math.ceil(total / per_page) if per_page > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }
