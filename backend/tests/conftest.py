import os
os.environ["DATABASE_URL"] = "sqlite:///./test_sport_max.db"
os.environ["AUTH_MODE"] = "demo"
os.environ["SESSION_SECRET"] = "test-session-secret"
os.environ["SESSION_COOKIE_SECURE"] = "false"
os.environ["BOT_TOKEN"] = "test-bot-token"
import pytest
from fastapi.testclient import TestClient
from app.database import Base, SessionLocal, engine
from app.main import app
from app.seed.data import seed_database

@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)
    with SessionLocal() as db: seed_database(db)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as c: yield c

