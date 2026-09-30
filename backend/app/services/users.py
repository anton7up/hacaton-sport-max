from sqlalchemy.orm import Session

from app.models import Activity, ActivityParticipant, User


def serialize_user(db: Session, user: User):
    organized = db.query(Activity).filter(Activity.organizer_id == user.id).count()
    joined = db.query(ActivityParticipant).filter(ActivityParticipant.user_id == user.id).count()
    return {
        "id": user.id,
        "max_user_id": user.max_user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "city_id": user.city_id,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "sports": [sport.sport_type for sport in user.sports],
        "activities_count": joined,
        "organized_count": organized,
        "visited_count": max(0, joined - organized),
    }

