from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload
from app.models import Activity, ActivityParticipant

def activity_query(db: Session):
    return db.query(Activity).options(selectinload(Activity.participants).selectinload(ActivityParticipant.user), selectinload(Activity.organizer))

def serialize_activity(activity: Activity, current_user_id: int | None = None):
    return {
        "id": activity.id, "city_id": activity.city_id, "organizer_id": activity.organizer_id,
        "sport_type": activity.sport_type, "title": activity.title, "description": activity.description,
        "start_datetime": activity.start_datetime, "location_name": activity.location_name, "address": activity.address,
        "latitude": activity.latitude, "longitude": activity.longitude, "level": activity.level,
        "price": activity.price, "max_participants": activity.max_participants, "created_at": activity.created_at,
        "participant_count": len(activity.participants),
        "is_joined": any(p.user_id == current_user_id for p in activity.participants),
        "organizer_name": activity.organizer.name,
        "participants": [{"id": p.user.id, "name": p.user.name, "avatar_url": p.user.avatar_url} for p in activity.participants],
    }

def join_activity(db: Session, activity_id: int, user_id: int):
    activity = activity_query(db).filter(Activity.id == activity_id).first()
    if not activity: raise HTTPException(404, "Активность не найдена")
    if any(p.user_id == user_id for p in activity.participants): raise HTTPException(409, "Вы уже участвуете")
    if len(activity.participants) >= activity.max_participants: raise HTTPException(409, "Свободных мест нет")
    db.add(ActivityParticipant(activity_id=activity_id, user_id=user_id)); db.commit()
    return activity_query(db).filter(Activity.id == activity_id).first()

