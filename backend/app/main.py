from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, SessionLocal, engine, migrate_sqlite_user_schema
from app.routers import activities, auth, cities, events, sports, users
from app.seed.data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    runtime_settings = get_settings()
    if runtime_settings.auth_mode == "max" and (not runtime_settings.bot_token or not runtime_settings.session_secret):
        raise RuntimeError("BOT_TOKEN and SESSION_SECRET are required when AUTH_MODE=max")
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_user_schema()
    with SessionLocal() as db: seed_database(db)
    yield

app = FastAPI(title="В движении API", version="1.0.0", lifespan=lifespan)
settings = get_settings()
frontend_origin = settings.frontend_url.rstrip("/")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
for router in [auth.router,cities.router,sports.router,activities.router,users.router,events.router]: app.include_router(router)

@app.get("/health", include_in_schema=False)
@app.get("/api/health")
def health(): return {"status":"ok"}

