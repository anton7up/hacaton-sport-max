import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sport_max.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_sqlite_user_schema():
    """Small idempotent bridge for databases created by the pre-auth MVP."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    additions = {
        "max_user_id": "VARCHAR(255)",
        "first_name": "VARCHAR(100)",
        "last_name": "VARCHAR(100)",
        "username": "VARCHAR(100)",
        "updated_at": "DATETIME",
    }
    with engine.begin() as connection:
        for name, sql_type in additions.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {name} {sql_type}"))
        if "name" in columns:
            connection.execute(text("UPDATE users SET first_name = name WHERE first_name IS NULL"))
        connection.execute(text("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_max_user_id ON users (max_user_id)"))

