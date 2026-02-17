import asyncio
import logging
from html import escape

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    return bool(settings.RESEND_API_KEY)


async def send_reservation_confirmation(
    to_email: str,
    item_title: str,
    wishlist_title: str,
    cancel_url: str,
) -> bool:
    if not _is_configured():
        logger.warning("Resend not configured, skipping email to %s", to_email)
        return False

    resend.api_key = settings.RESEND_API_KEY

    params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": to_email,
        "subject": f"Вы зарезервировали «{escape(item_title)}»",
        "html": f"""
            <h2>Подтверждение резервации</h2>
            <p>Вы зарезервировали <strong>{escape(item_title)}</strong> в вишлисте <strong>{escape(wishlist_title)}</strong>.</p>
            <p>Чтобы отменить резервацию, перейдите по ссылке:</p>
            <p><a href="{escape(cancel_url, quote=True)}">Отменить резервацию</a></p>
            <p style="color: #888; font-size: 12px;">Vishlist — социальный вишлист</p>
        """,
    }

    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Confirmation email sent to %s", to_email)
        return True
    except resend.exceptions.ResendError:
        logger.exception("Resend API error sending email to %s", to_email)
        return False


async def send_recovery_email(
    to_email: str,
    wishlist_title: str,
    recovery_url: str,
) -> bool:
    if not _is_configured():
        logger.warning("Resend not configured, skipping recovery email to %s", to_email)
        return False

    resend.api_key = settings.RESEND_API_KEY

    params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": to_email,
        "subject": f"Восстановление доступа к «{escape(wishlist_title)}»",
        "html": f"""
            <h2>Восстановление доступа</h2>
            <p>Вы запросили восстановление доступа к вишлисту <strong>{escape(wishlist_title)}</strong>.</p>
            <p>Перейдите по ссылке для восстановления (действительна 1 час):</p>
            <p><a href="{escape(recovery_url, quote=True)}">Восстановить доступ</a></p>
            <p style="color: #888; font-size: 12px;">Если вы не запрашивали восстановление, проигнорируйте это письмо.</p>
        """,
    }

    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Recovery email sent to %s", to_email)
        return True
    except resend.exceptions.ResendError:
        logger.exception("Resend API error sending recovery email to %s", to_email)
        return False
