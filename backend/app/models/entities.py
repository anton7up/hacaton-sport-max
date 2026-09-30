from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class City(Base):
    __tablename__ = "cities"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    max_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    _legacy_name: Mapped[str | None] = mapped_column("name", String(100), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sports: Mapped[list["UserSport"]] = relationship(cascade="all, delete-orphan")

    @property
    def name(self) -> str:
        return " ".join(part for part in (self.first_name, self.last_name) if part)


class AppSession(Base):
    __tablename__ = "app_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    user: Mapped[User] = relationship()

class UserSport(Base):
    __tablename__ = "user_sports"
    __table_args__ = (UniqueConstraint("user_id", "sport_type"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    sport_type: Mapped[str] = mapped_column(String(50))

class ActivityParticipant(Base):
    __tablename__ = "activity_participants"
    __table_args__ = (UniqueConstraint("activity_id", "user_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    activity_id: Mapped[int] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped[User] = relationship()

class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(primary_key=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    sport_type: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    start_datetime: Mapped[datetime] = mapped_column(DateTime, index=True)
    location_name: Mapped[str] = mapped_column(String(160))
    address: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    level: Mapped[str] = mapped_column(String(50))
    price: Mapped[int] = mapped_column(Integer, default=0)
    max_participants: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    organizer: Mapped[User] = relationship(foreign_keys=[organizer_id])
    participants: Mapped[list[ActivityParticipant]] = relationship(cascade="all, delete-orphan")

class SportEvent(Base):
    __tablename__ = "sport_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    sport_type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    start_datetime: Mapped[datetime] = mapped_column(DateTime)
    location_name: Mapped[str] = mapped_column(String(160))
    address: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    price: Mapped[int] = mapped_column(Integer, default=0)
    registration_url: Mapped[str] = mapped_column(String(500))
    organizer: Mapped[str] = mapped_column(String(160))
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

