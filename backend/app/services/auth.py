import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from urllib.parse import parse_qsl

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import AppSession, User

SESSION_COOKIE_NAME = "sport_session"


@dataclass(frozen=True)
class MaxUserData:
    max_user_id: str
    first_name: str
    last_name: str | None
    username: str | None
    avatar_url: str | None


class MaxAuthService:
    """Validates MAX WebAppData exactly as documented by dev.max.ru."""

    def __init__(self, bot_token: str, max_age_seconds: int = 300):
        self.bot_token = bot_token
        self.max_age_seconds = max_age_seconds

    def validate(self, init_data: str) -> MaxUserData:
        if not self.bot_token:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "MAX authentication is not configured")
        if not init_data or len(init_data) > 16_384:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid MAX initData")
        try:
            pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
        except ValueError:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid MAX initData") from None
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)) or keys.count("hash") != 1:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid MAX initData")
        values = dict(pairs)
        original_hash = values.pop("hash", "")
        launch_params = "\n".join(f"{key}={values[key]}" for key in sorted(values))
        secret_key = hmac.new(b"WebAppData", self.bot_token.encode(), hashlib.sha256).digest()
        expected_hash = hmac.new(secret_key, launch_params.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_hash, original_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid MAX initData signature")
        try:
            auth_date = int(values["auth_date"])
            now = int(datetime.utcnow().timestamp())
            if auth_date > now + 30 or now - auth_date > self.max_age_seconds:
                raise ValueError
            raw_user = json.loads(values["user"])
            max_user_id = str(raw_user["id"])
            first_name = str(raw_user.get("first_name") or raw_user.get("username") or "Пользователь")
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired MAX initData") from None
        return MaxUserData(
            max_user_id=max_user_id,
            first_name=first_name,
            last_name=raw_user.get("last_name"),
            username=raw_user.get("username"),
            avatar_url=raw_user.get("photo_url"),
        )


def _token_hash(raw_token: str, secret: str) -> str:
    return hmac.new(secret.encode(), raw_token.encode(), hashlib.sha256).hexdigest()


def create_session(db: Session, user: User) -> tuple[str, datetime]:
    settings = get_settings()
    if not settings.session_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Session authentication is not configured")
    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(seconds=settings.session_max_age_seconds)
    db.add(AppSession(token_hash=_token_hash(raw_token, settings.session_secret), user_id=user.id, expires_at=expires_at))
    db.commit()
    return raw_token, expires_at


def _session_user(request: Request, db: Session) -> User | None:
    settings = get_settings()
    raw_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw_token or not settings.session_secret:
        return None
    session = db.query(AppSession).filter(AppSession.token_hash == _token_hash(raw_token, settings.session_secret)).first()
    if not session:
        return None
    if session.expires_at <= datetime.utcnow():
        db.delete(session)
        db.commit()
        return None
    return session.user


def validate_request_origin(request: Request) -> None:
    settings = get_settings()
    if settings.auth_mode != "max" or request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    if request.headers.get("origin") != settings.frontend_url.rstrip("/"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Untrusted request origin")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    settings = get_settings()
    if settings.auth_mode == "demo":
        user = db.query(User).filter(User.id == 1).first()
    else:
        user = _session_user(request, db)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    validate_request_origin(request)
    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    settings = get_settings()
    if settings.auth_mode == "demo":
        return db.query(User).filter(User.id == 1).first()
    return _session_user(request, db)

