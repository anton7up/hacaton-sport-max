from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Activity, ActivityParticipant, User, UserSport
from app.schemas import UserActivities, UserOut, UserUpdate
from app.services.activities import activity_query, serialize_activity
from app.services.auth import get_current_user
from app.services.users import serialize_user

router = APIRouter(prefix="/api/users", tags=["users"])


def _update_user(db: Session, user: User, payload: UserUpdate):
    data = payload.model_dump(exclude_unset=True)
    sports = data.pop("sports", None)
    name = data.pop("name", None)
    if name is not None:
        user.first_name = name
    for key, value in data.items():
        setattr(user, key, value)
    if sports is not None:
        db.query(UserSport).filter(UserSport.user_id == user.id).delete()
        for sport in dict.fromkeys(sports):
            db.add(UserSport(user_id=user.id, sport_type=sport))
    db.commit()
    db.refresh(user)
    return serialize_user(db, user)


def _user_activities(db: Session, user: User):
    joined_ids = [row.activity_id for row in db.query(ActivityParticipant).filter(ActivityParticipant.user_id == user.id)]
    joined = activity_query(db).filter(Activity.id.in_(joined_ids)).order_by(Activity.start_datetime).all() if joined_ids else []
    organized = activity_query(db).filter(Activity.organizer_id == user.id).order_by(Activity.start_datetime).all()
    return {
        "joined": [serialize_activity(activity, user.id) for activity in joined],
        "organized": [serialize_activity(activity, user.id) for activity in organized],
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_user(db, current_user)


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _update_user(db, current_user, payload)


@router.get("/me/activities", response_model=UserActivities)
def get_my_activities(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_activities(db, current_user)


def _require_demo_compatibility(current_user: User, requested_user_id: int):
    if get_settings().auth_mode != "demo":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if current_user.id != requested_user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot access another user's profile")


@router.get("/{user_id}", response_model=UserOut, deprecated=True)
def get_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_demo_compatibility(current_user, user_id)
    return serialize_user(db, current_user)


@router.patch("/{user_id}", response_model=UserOut, deprecated=True)
def update_user(user_id: int, payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_demo_compatibility(current_user, user_id)
    return _update_user(db, current_user, payload)


@router.get("/{user_id}/activities", response_model=UserActivities, deprecated=True)
def get_user_activities(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_demo_compatibility(current_user, user_id)
    return _user_activities(db, current_user)
