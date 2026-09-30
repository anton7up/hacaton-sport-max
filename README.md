# В движении

Mobile-first MVP сервиса, который помогает найти спортивную активность, компанию и событие рядом. Проект подготовлен как самостоятельное web-приложение и архитектурно готов к будущему подключению как Mini App в мессенджере MAX.

## Проблема и аудитория

Люди хотят заниматься спортом, но не всегда знают, где найти подходящую активность или партнёров сопоставимого уровня. «В движении» рассчитан на жителей города, любителей спорта, новичков и организаторов локальных тренировок.

Основной сценарий: выбрать город и любимые виды спорта → найти активность в ленте или на карте → посмотреть детали → присоединиться → увидеть встречу в «Моих». Пользователь также может создать собственную активность.

## Возможности MVP

- onboarding с выбором города и нескольких видов спорта;
- лента из 20 демонстрационных активностей и фильтры;
- интерактивная карта Leaflet + OpenStreetMap;
- детали, участники, свободные места, join/leave API;
- создание активности с автоматическим добавлением организатора;
- раздел «Мои»: участвую и организую;
- 9 демонстрационных спортивных событий;
- профиль с изменением имени и интересов;
- открытие точки во внешних Яндекс Картах;
- loading, empty, error, success и disabled состояния;
- адаптивный mobile-first интерфейс.

## Архитектура

Frontend (`React + TypeScript + Vite`) обращается к REST API. Backend (`FastAPI + SQLAlchemy + Pydantic`) хранит данные в SQLite. ORM и конфигурация через `DATABASE_URL` позволяют позднее заменить SQLite на PostgreSQL.

```text
frontend/src/
  api/ components/ context/ pages/ services/ types/ utils/
backend/app/
  models/ routers/ schemas/ seed/ services/
```

Платформенная логика изолирована в `PlatformService`: standalone-запуск использует `WebPlatformService`, а среда с `window.WebApp.initData` — подготовленный `MaxPlatformService`. Текущий пользователь скрыт за `CurrentUserProvider` с реализациями `DemoUserProvider` и `MaxUserProvider`, поэтому бизнес-компоненты не зависят от MAX SDK.

## Быстрый запуск через Docker

Нужен Docker Desktop.

```bash
docker compose up --build
```

После запуска:

- приложение: http://localhost:3000
- API: http://localhost:8000/api
- Swagger: http://localhost:8000/docs

SQLite сохраняется в Docker volume `sport_data`.

## Локальная разработка

Backend (Python 3.11+):

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend (Node.js 20+):

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173. Vite перенаправляет `/api` на backend на порту 8000.

## Переменные окружения

Скопируйте `.env.example` в `.env` при необходимости.

- `DATABASE_URL` — SQLAlchemy URL базы данных;
- `AUTH_MODE=demo|max` — строгий режим авторизации; автоматического fallback из `max` в `demo` нет;
- `BOT_TOKEN` — токен бота, используется только backend для проверки MAX initData;
- `SESSION_SECRET` — секрет серверных сессий;
- `FRONTEND_URL` — доверенный CORS origin;
- `SESSION_COOKIE_SECURE` — Secure-флаг cookie (в MAX production должен быть `true`);
- `SESSION_MAX_AGE_SECONDS` — срок жизни собственной сессии;
- `MAX_AUTH_MAX_AGE_SECONDS` — допустимый возраст MAX initData;
- `VITE_API_URL` — публичный адрес API; для локального запуска и Docker можно оставить пустым.

## REST API

- `GET /api/cities`, `GET /api/sports`
- `GET /api/activities` с `city_id`, `sport_type`, `date`, `level`, `free`
- `GET /api/activities/{id}`, `POST /api/activities` (организатор определяется сессией)
- `POST /api/activities/{id}/join`, `DELETE /api/activities/{id}/join`
- `GET /api/users/me/activities`
- `GET/PATCH /api/users/me`
- `POST /api/auth/max`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/events`, `GET /api/events/{id}`
- `GET /health` — публичный healthcheck для Railway;

## Authentication

Для локальной разработки используется `AUTH_MODE=demo`. Backend всегда выбирает demo user сам; frontend не передаёт доверенный `user_id` или `organizer_id`.

Будущий production flow:

```text
MAX Mini App
→ MAX initData
→ POST /api/auth/max
→ server-side HMAC validation with BOT_TOKEN
→ find/create User by max_user_id
→ opaque application session in HttpOnly cookie
→ protected API
```

В `AUTH_MODE=max` неавторизованные защищённые запросы получают `401`; fallback в demo запрещён. Cookie имеет `HttpOnly`, `Secure` в production и `SameSite=None` при Secure-запуске внутри Mini App. Сырой session token не хранится в БД — сохраняется только HMAC-хеш. `BOT_TOKEN`, полный initData и `SESSION_SECRET` не логируются и не передаются frontend.

Проверка MAX WebAppData реализована в изолированном `MaxAuthService` по официальному алгоритму MAX. Сама привязка Mini App/бота и получение настоящих `initData`/`BOT_TOKEN` пока не включены.

## Демо-данные

При первом старте создаются Москва и три будущих города, demo user, 20 вымышленных активностей в общеизвестных локациях Москвы и 9 событий. Все активности, события, организаторы и ссылки регистрации являются исключительно демонстрационными и не описывают реальные мероприятия.

## Тесты и сборка

```bash
cd backend
pytest

cd ../frontend
npm run build
```

Backend-тесты проверяют получение и создание активности, join, повторный join, отсутствие мест, leave и «Мои активности».

## Railway deployment

Репозиторий рассчитан на два Railway services из одного GitHub-репозитория. Для каждого сервиса выберите один и тот же репозиторий, но укажите отдельный **Root Directory**:

- backend service: `/backend`;
- frontend service: `/frontend`.

Оба каталога содержат собственный production `Dockerfile`. Backend запускает Uvicorn на `0.0.0.0` и использует выданный Railway порт из переменной `PORT`. Frontend собирает Vite-приложение и отдаёт его через Nginx; fallback на `index.html` позволяет напрямую открывать React Router URL, например `/activity/1`.

### Backend service

Добавьте переменные:

```env
AUTH_MODE=demo
DATABASE_URL=sqlite:////data/app.db
FRONTEND_URL=https://<frontend-domain>
```

`BOT_TOKEN` и `SESSION_SECRET` в demo mode не требуются. Публичный healthcheck доступен по `GET /health`; файл `backend/railway.json` уже указывает Railway этот путь.

Создайте Railway Volume и подключите его к backend service с mount path:

```text
/data
```

После этого SQLite-файл `/data/app.db` переживает redeploy и restart контейнера. Схема и демонстрационные данные создаются идемпотентно при запуске приложения.

### Frontend service

Добавьте build-time переменную:

```env
VITE_API_URL=https://<backend-domain>
```

Удобный вариант через Railway reference variable, если backend service называется `Backend`:

```env
VITE_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

`VITE_API_URL` является публичным адресом, который Vite встраивает в браузерный bundle; секреты в переменных с префиксом `VITE_` хранить нельзя. После изменения значения требуется redeploy frontend.

Когда оба домена созданы, укажите HTTPS-домен frontend в `FRONTEND_URL` backend service и выполните redeploy backend. CORS разрешает только этот origin и не использует wildcard.

### Переключение на MAX

После подключения бота и Mini App измените backend variables:

```env
AUTH_MODE=max
BOT_TOKEN=<MAX bot token>
SESSION_SECRET=<случайный длинный секрет>
FRONTEND_URL=https://<frontend-domain>
SESSION_COOKIE_SECURE=true
```

Реальные секреты задаются только в Railway Variables и не добавляются в Git. MAX-auth остаётся серверным: backend проверяет `initData`, после чего создаёт собственную HttpOnly session.

## Известные ограничения

- один демонстрационный пользователь без production-аутентификации;
- нет платежей, чата, маршрутов, геолокации и push-уведомлений;
- координаты вводятся вручную;
- внешние ссылки событий демонстрационные;
- данные рассчитаны на пилот в Москве.

## План интеграции с MAX

1. Создать и привязать MAX-бота и Mini App, задать production URL.
2. Передать backend реальные `BOT_TOKEN` и `SESSION_SECRET`, включить `AUTH_MODE=max` и HTTPS.
3. Проверить production cookie/CORS внутри клиента MAX.
4. Провести интеграционные тесты на реальных MAX initData.

## Масштабирование по городам

`City` — отдельная сущность, а Activity и SportEvent используют `city_id`. Для запуска нового города достаточно активировать его, добавить seed/import данных и настроить координаты центра карты. При росте нагрузки SQLite заменяется на PostgreSQL через `DATABASE_URL`, а миграции добавляются через Alembic.

