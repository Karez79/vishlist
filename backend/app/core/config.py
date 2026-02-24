from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://localhost:5432/vishlist"
    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DEBUG: bool = False

    FRONTEND_URL: str = "http://localhost:3000"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@vishlist.app"

    VERCEL_BLOB_READ_WRITE_TOKEN: str = ""

    # Local file uploads (Railway Volume or local dir)
    UPLOAD_DIR: str = "/data/uploads"
    BASE_URL: str = "http://localhost:8000"

    @field_validator("DATABASE_URL")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
