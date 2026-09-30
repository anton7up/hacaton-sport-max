import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    auth_mode: str
    bot_token: str
    session_secret: str
    frontend_url: str
    session_cookie_secure: bool
    session_max_age_seconds: int
    max_auth_max_age_seconds: int


def get_settings() -> Settings:
    auth_mode = os.getenv("AUTH_MODE", "demo").lower().strip()
    if auth_mode not in {"demo", "max"}:
        raise RuntimeError("AUTH_MODE must be either 'demo' or 'max'")
    secure_default = auth_mode == "max"
    secure = os.getenv("SESSION_COOKIE_SECURE", str(secure_default)).lower() == "true"
    return Settings(
        auth_mode=auth_mode,
        bot_token=os.getenv("BOT_TOKEN", ""),
        session_secret=os.getenv("SESSION_SECRET", ""),
        frontend_url=os.getenv("FRONTEND_URL", "http://localhost:5173"),
        session_cookie_secure=secure,
        session_max_age_seconds=int(os.getenv("SESSION_MAX_AGE_SECONDS", "604800")),
        max_auth_max_age_seconds=int(os.getenv("MAX_AUTH_MAX_AGE_SECONDS", "300")),
    )

