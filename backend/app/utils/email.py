import logging

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
):
    if not _is_configured():
        logger.warning("Resend not configured, skipping email to %s", to_email)
        return

    resend.api_key = settings.RESEND_API_KEY

    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": to_email,
            "subject": f"Вы зарезервировали «{item_title}»",
            "html": f"""
                <h2>Подтверждение резервации</h2>
                <p>Вы зарезервировали <strong>«{item_title}»</strong> в вишлисте <strong>«{wishlist_title}»</strong>.</p>
                <p>Чтобы отменить резервацию, перейдите по ссылке:</p>
                <p><a href="{cancel_url}">Отменить резервацию</a></p>
                <p style="color: #888; font-size: 12px;">Vishlist — социальный вишлист</p>
            """,
        })
        logger.info("Confirmation email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)


async def send_recovery_email(
    to_email: str,
    wishlist_title: str,
    recovery_url: str,
):
    if not _is_configured():
        logger.warning("Resend not configured, skipping recovery email to %s", to_email)
        return

    resend.api_key = settings.RESEND_API_KEY

    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": to_email,
            "subject": f"Восстановление доступа к «{wishlist_title}»",
            "html": f"""
                <h2>Восстановление доступа</h2>
                <p>Вы запросили восстановление доступа к вишлисту <strong>«{wishlist_title}»</strong>.</p>
                <p>Перейдите по ссылке для восстановления (действительна 1 час):</p>
                <p><a href="{recovery_url}">Восстановить доступ</a></p>
                <p style="color: #888; font-size: 12px;">Если вы не запрашивали восстановление, проигнорируйте это письмо.</p>
            """,
        })
        logger.info("Recovery email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send recovery email to %s: %s", to_email, e)
