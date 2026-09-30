from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Activity, ActivityParticipant
from app.schemas import ActivityCreate, ActivityOut
from app.services.auth import get_current_user, get_optional_user
from app.services.activities import activity_query, join_activity, serialize_activity

router = APIRouter(prefix="/api/activities", tags=["activities"])

@router.get("", response_model=list[ActivityOut])
def get_activities(city_id: int = 1, sport_type: str | None = None, date_filter: str | None = Query(None, alias="date"), level: str | None = None, free: bool | None = None, current_user = Depends(get_optional_user), db: Session = Depends(get_db)):
    q = activity_query(db).filter(Activity.city_id == city_id)
    if sport_type: q = q.filter(Activity.sport_type == sport_type)
    if level: q = q.filter(Activity.level == level)
    if free: q = q.filter(Activity.price == 0)
    today = date.today()
    if date_filter == "today": q = q.filter(Activity.start_datetime >= today, Activity.start_datetime < today + timedelta(days=1))
    elif date_filter == "tomorrow": q = q.filter(Activity.start_datetime >= today + timedelta(days=1), Activity.start_datetime < today + timedelta(days=2))
    elif date_filter == "weekend":
        saturday = today + timedelta(days=(5-today.weekday()) % 7)
        q = q.filter(Activity.start_datetime >= saturday, Activity.start_datetime < saturday + timedelta(days=2))
    return [serialize_activity(a, current_user.id if current_user else None) for a in q.order_by(Activity.start_datetime).all()]

@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, current_user = Depends(get_optional_user), db: Session = Depends(get_db)):
    a = activity_query(db).filter(Activity.id == activity_id).first()
    if not a: raise HTTPException(404, "Активность не найдена")
    return serialize_activity(a, current_user.id if current_user else None)

@router.post("", response_model=ActivityOut, status_code=201)
def create_activity(payload: ActivityCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    a = Activity(**payload.model_dump(), organizer_id=current_user.id); db.add(a); db.flush()
    db.add(ActivityParticipant(activity_id=a.id, user_id=current_user.id)); db.commit()
    return serialize_activity(activity_query(db).filter(Activity.id == a.id).first(), current_user.id)

@router.post("/{activity_id}/join", response_model=ActivityOut)
def join(activity_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_activity(join_activity(db, activity_id, current_user.id), current_user.id)

@router.delete("/{activity_id}/join", status_code=204)
def leave(activity_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(Activity).filter(Activity.id == activity_id).first()
    if not a: raise HTTPException(404, "Активность не найдена")
    if a.organizer_id == current_user.id: raise HTTPException(409, "Организатор не может выйти из своей активности")
    p = db.query(ActivityParticipant).filter_by(activity_id=activity_id, user_id=current_user.id).first()
    if not p: raise HTTPException(404, "Вы не участвуете")
    db.delete(p); db.commit(); return Response(status_code=204)

