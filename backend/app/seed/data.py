from datetime import datetime, timedelta, time
from sqlalchemy.orm import Session
from app.models import Activity, ActivityParticipant, City, SportEvent, User, UserSport

SPORTS = ["football","running","tennis","basketball","volleyball","hockey","cycling","badminton"]
LOCATIONS = [
    ("Лужники","ул. Лужники, 24",55.7158,37.5537),("Парк Горького","ул. Крымский Вал, 9",55.7298,37.6011),
    ("ВДНХ","просп. Мира, 119",55.8298,37.6338),("Сокольники","ул. Сокольнический Вал, 1",55.7942,37.6763),
    ("Парк Победы","пл. Победы, 3",55.7362,37.5035),("Ходынское поле","Ходынский бул., 1",55.7903,37.5308),
    ("Измайловский парк","аллея Большого Круга, 7",55.7812,37.7738),("Красная Пресня","Мантулинская ул., 5",55.7568,37.5492),
]
TITLES = {
    "football":["Нужны игроки на матч","Футбол после работы","Дворовый футбол"],
    "running":["Утренняя пробежка 5 км","Лёгкий бег в парке","Темповая десятка"],
    "tennis":["Ищу партнёра на корт","Теннисный спарринг","Парная игра"],
    "basketball":["Баскетбол 3×3","Играем полный корт","Вечерний баскет"],
    "volleyball":["Волейбол для своих","Ищем связующего","Игра в зале"],
    "hockey":["Любительская тренировка","Нужен вратарь","Хоккейный вечер"],
    "cycling":["Велозаезд по набережной","Городская велопрогулка","Бодрые 30 км"],
    "badminton":["Бадминтон для новичков","Ищу партнёра","Парный бадминтон"],
}

def seed_database(db: Session):
    if db.query(City).count(): return
    db.add_all([City(name="Москва",slug="moscow",is_active=True),City(name="Санкт-Петербург",slug="saint-petersburg",is_active=False),City(name="Казань",slug="kazan",is_active=False),City(name="Нижний Новгород",slug="nizhny-novgorod",is_active=False)]); db.flush()
    demo_names = ["Антон", "Маша", "Илья", "Лена", "Денис", "Оля"]
    users = [User(first_name=name, _legacy_name=name, city_id=1) for name in demo_names]
    db.add_all(users); db.flush()
    for sport in ["football","running","tennis"]: db.add(UserSport(user_id=1,sport_type=sport))
    today = datetime.now().date(); activities=[]
    for i in range(20):
        sport=SPORTS[i%len(SPORTS)]; loc=LOCATIONS[i%len(LOCATIONS)]
        day=today+timedelta(days=i%9); start=datetime.combine(day,time(8+(i*3)%13,0 if i%2 else 30))
        activities.append(Activity(city_id=1,organizer_id=2+(i%5),sport_type=sport,title=TITLES[sport][i%3],description="Собираемся хорошей компанией, играем в комфортном темпе. Всё необходимое обсудим на месте.",start_datetime=start,location_name=loc[0],address=loc[1],latitude=loc[2]+(i%3)*.001,longitude=loc[3]+(i%2)*.001,level=["Новичок","Любитель","Средний","Любой"][i%4],price=[0,0,300,500,700][i%5],max_participants=[2,6,8,10,12][i%5]))
    db.add_all(activities); db.flush()
    for a in activities:
        for user_id in range(2,min(7,3+a.id%5)): db.add(ActivityParticipant(activity_id=a.id,user_id=user_id))
    event_titles=[("running","Московский забег 10 км"),("cycling","Фестиваль велоспорта"),("football","Кубок дворовых команд"),("hockey","Ночная хоккейная лига"),("running","Полумарафон столицы"),("basketball","Турнир 3×3"),("volleyball","Кубок парков"),("badminton","Открытый турнир по бадминтону"),("tennis","Любительский теннисный кубок")]
    for i,(sport,title) in enumerate(event_titles):
        loc=LOCATIONS[i%len(LOCATIONS)]
        db.add(SportEvent(city_id=1,sport_type=sport,title=title,description="Большое спортивное событие для участников и болельщиков. Данные демонстрационные.",start_datetime=datetime.combine(today+timedelta(days=12+i*5),time(10)),location_name=loc[0],address=loc[1],latitude=loc[2],longitude=loc[3],price=[0,900,1500,2000][i%4],registration_url="https://example.com/registration",organizer="Спорт Москва",image_url=None))
    db.commit()

