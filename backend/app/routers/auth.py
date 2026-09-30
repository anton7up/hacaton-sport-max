from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import AppSession, User
from app.schemas import MaxAuthRequest, UserOut
from app.services.auth import (
    SESSION_COOKIE_NAME,
    MaxAuthService,
    _token_hash,
    create_session,
    get_current_user,
    validate_request_origin,
)
from app.services.users import serialize_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/max", response_model=UserOut)
def authenticate_max(payload: MaxAuthRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    settings = get_settings()
    if settings.auth_mode != "max":
        raise HTTPException(status.HTTP_409_CONFLICT, "MAX authentication is disabled in demo mode")
    validate_request_origin(request)
    max_user = MaxAuthService(settings.bot_token, settings.max_auth_max_age_seconds).validate(payload.init_data)
    user = db.query(User).filter(User.max_user_id == max_user.max_user_id).first()
    if not user:
        user = User(
            max_user_id=max_user.max_user_id,
            first_name=max_user.first_name,
            last_name=max_user.last_name,
            username=max_user.username,
            avatar_url=max_user.avatar_url,
            _legacy_name=max_user.first_name,
        )
        db.add(user)
    else:
        user.first_name = max_user.first_name
        user.last_name = max_user.last_name
        user.username = max_user.username
        user.avatar_url = max_user.avatar_url
    db.commit()
    db.refresh(user)
    raw_token, _ = create_session(db, user)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        raw_token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="none" if settings.session_cookie_secure else "lax",
        path="/",
    )
    return serialize_user(db, user)


@router.get("/me", response_model=UserOut)
def auth_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_user(db, current_user)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    settings = get_settings()
    validate_request_origin(request)
    raw_token = request.cookies.get(SESSION_COOKIE_NAME)
    if raw_token and settings.session_secret:
        session = db.query(AppSession).filter(AppSession.token_hash == _token_hash(raw_token, settings.session_secret)).first()
        if session:
            db.delete(session)
            db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT

