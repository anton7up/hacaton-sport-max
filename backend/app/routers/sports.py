from fastapi import APIRouter

router = APIRouter(prefix="/api/sports", tags=["sports"])
SPORTS = [
    ("football","⚽","Футбол"),("running","🏃","Бег"),("tennis","🎾","Теннис"),("basketball","🏀","Баскетбол"),
    ("volleyball","🏐","Волейбол"),("hockey","🏒","Хоккей"),("table_tennis","🏓","Настольный теннис"),
    ("cycling","🚴","Велосипед"),("gym","🏋️","Тренировки"),("boxing","🥊","Единоборства"),
    ("badminton","🏸","Бадминтон"),("yoga","🧘","Йога"),("other","➕","Другое")]
@router.get("")
def get_sports(): return [{"id": i, "emoji": e, "name": n} for i,e,n in SPORTS]

