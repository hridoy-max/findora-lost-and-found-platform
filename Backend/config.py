from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESET_TOKEN_EXPIRE_MINUTES: int = 15

    # Infrastructure
    CORS_ORIGINS: str # Comma-separated string
    FRONTEND_URL: str

    # Image constraints
    IMAGE_ALLOWED_HOSTS: str = ""

    # Email
    EMAIL_MODE: str = "console" # console, resend, brevo
    EMAIL_FROM: str = "Findora <no-reply@example.com>"
    RESEND_API_KEY: str = ""

    # Seed Defaults
    ADMIN_EMAIL: str = "admin@findora.test"
    ADMIN_PASSWORD: str = "change_me_Admin123"
    ADMIN_FULL_NAME: str = "Findora Admin"
    DEMO_USER_EMAIL: str = "user@findora.test"
    DEMO_USER_PASSWORD: str = "change_me_User123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
