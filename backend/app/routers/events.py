from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SportEvent
from app.schemas import EventOut

router = APIRouter(prefix="/api/events", tags=["events"])
@router.get("", response_model=list[EventOut])
def get_events(city_id: int = 1, db: Session = Depends(get_db)):
    return db.query(SportEvent).filter(SportEvent.city_id == city_id).order_by(SportEvent.start_datetime).all()
@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    e = db.query(SportEvent).filter(SportEvent.id == event_id).first()
    if not e: raise HTTPException(404, "Событие не найдено")
    return e

