from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; name: str; slug: str; is_active: bool

class ParticipantOut(BaseModel):
    id: int; name: str; avatar_url: str | None = None

class ActivityCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    city_id: int = 1
    sport_type: str
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=3)
    start_datetime: datetime
    location_name: str
    address: str
    latitude: float
    longitude: float
    level: str
    price: int = Field(default=0, ge=0)
    max_participants: int = Field(ge=2, le=1000)

class ActivityOut(BaseModel):
    id: int; city_id: int; organizer_id: int; sport_type: str; title: str; description: str
    start_datetime: datetime; location_name: str; address: str; latitude: float; longitude: float
    level: str; price: int; max_participants: int; created_at: datetime
    participant_count: int; is_joined: bool; organizer_name: str; participants: list[ParticipantOut] = []

class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; city_id: int; sport_type: str; title: str; description: str; start_datetime: datetime
    location_name: str; address: str; latitude: float; longitude: float; price: int
    registration_url: str; organizer: str; image_url: str | None

class UserOut(BaseModel):
    id: int
    max_user_id: str | None
    first_name: str
    last_name: str | None
    username: str | None
    name: str
    avatar_url: str | None
    city_id: int | None
    created_at: datetime
    updated_at: datetime
    sports: list[str]
    activities_count: int
    organized_count: int
    visited_count: int

class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=2, max_length=100)
    city_id: int | None = None
    sports: list[str] | None = None

class UserActivities(BaseModel):
    joined: list[ActivityOut]
    organized: list[ActivityOut]


class MaxAuthRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    init_data: str = Field(min_length=1, max_length=16_384)

