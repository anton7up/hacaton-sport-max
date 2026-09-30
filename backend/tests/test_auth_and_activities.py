import hashlib
import hmac
import json
from datetime import datetime, timedelta
from urllib.parse import urlencode

import pytest
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import Activity, ActivityParticipant, User


def payload(max_participants=4):
    return {
        "city_id": 1,
        "sport_type": "running",
        "title": "Тестовая пробежка",
        "description": "Проверяем создание активности",
        "start_datetime": (datetime.now() + timedelta(days=2)).isoformat(),
        "location_name": "Лужники",
        "address": "ул. Лужники, 24",
        "latitude": 55.7158,
        "longitude": 37.5537,
        "level": "Любой",
        "price": 0,
        "max_participants": max_participants,
    }


def signed_init_data(user_id: int, bot_token="test-bot-token"):
    values = {
        "auth_date": str(int(datetime.utcnow().timestamp())),
        "query_id": f"query-{user_id}",
        "user": json.dumps({"id": user_id, "first_name": f"Max{user_id}", "username": f"max{user_id}"}, separators=(",", ":")),
    }
    launch_params = "\n".join(f"{key}={values[key]}" for key in sorted(values))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    values["hash"] = hmac.new(secret_key, launch_params.encode(), hashlib.sha256).hexdigest()
    return urlencode(values)


def max_login(client, monkeypatch, user_id: int):
    monkeypatch.setenv("AUTH_MODE", "max")
    client.headers.update({"Origin": "http://localhost:5173"})
    response = client.post("/api/auth/max", json={"init_data": signed_init_data(user_id)})
    assert response.status_code == 200
    return response


def test_demo_mode_continues_to_work(client):
    assert client.get("/api/auth/me").status_code == 200
    assert len(client.get("/api/activities").json()) >= 20


def test_healthcheck_does_not_require_authentication(client, monkeypatch):
    monkeypatch.setenv("AUTH_MODE", "max")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_only_configured_frontend(client):
    trusted = client.get("/health", headers={"Origin": "http://localhost:5173"})
    untrusted = client.get("/health", headers={"Origin": "https://example.invalid"})
    assert trusted.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "access-control-allow-origin" not in untrusted.headers


def test_unauthenticated_protected_request_is_401_in_max_mode(client, monkeypatch):
    monkeypatch.setenv("AUTH_MODE", "max")
    assert client.post("/api/activities/2/join").status_code == 401
    assert client.get("/api/users/me/activities").status_code == 401


def test_authenticated_user_can_join_and_duplicate_is_rejected(client, monkeypatch):
    max_login(client, monkeypatch, 9001)
    assert client.post("/api/activities/2/join").status_code == 200
    assert client.post("/api/activities/2/join").status_code == 409


def test_capacity_cannot_be_exceeded(client):
    with SessionLocal() as db:
        activity = db.query(Activity).filter(Activity.id == 1).first()
        activity.organizer_id = 2
        db.query(ActivityParticipant).filter(ActivityParticipant.activity_id == 1).delete()
        db.add_all([ActivityParticipant(activity_id=1, user_id=2), ActivityParticipant(activity_id=1, user_id=3)])
        db.commit()
    assert client.post("/api/activities/1/join").status_code == 409


def test_user_can_leave(client, monkeypatch):
    max_login(client, monkeypatch, 9002)
    assert client.post("/api/activities/2/join").status_code == 200
    assert client.delete("/api/activities/2/join").status_code == 204


def test_user_gets_only_own_activities(client, monkeypatch):
    max_login(client, monkeypatch, 9003)
    client.post("/api/activities/2/join")
    result = client.get("/api/users/me/activities")
    assert result.status_code == 200
    assert any(item["id"] == 2 for item in result.json()["joined"])


def test_organizer_is_determined_by_backend(client):
    result = client.post("/api/activities", json=payload())
    assert result.status_code == 201
    assert result.json()["organizer_id"] == 1
    assert result.json()["is_joined"] is True


def test_organizer_id_from_frontend_is_rejected(client):
    malicious = {**payload(), "organizer_id": 2}
    assert client.post("/api/activities", json=malicious).status_code == 422


def test_cannot_change_another_profile(client):
    assert client.patch("/api/users/2", json={"name": "Чужое имя"}).status_code == 403


def test_max_user_id_is_unique():
    with SessionLocal() as db:
        db.add(User(max_user_id="unique-max-id", first_name="One", _legacy_name="One"))
        db.commit()
        db.add(User(max_user_id="unique-max-id", first_name="Two", _legacy_name="Two"))
        with pytest.raises(IntegrityError):
            db.commit()


def test_max_login_reuses_user_and_logout_revokes_session(client, monkeypatch):
    first = max_login(client, monkeypatch, 9010)
    user_id = first.json()["id"]
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    second = max_login(client, monkeypatch, 9010)
    assert second.json()["id"] == user_id


def test_invalid_max_signature_is_rejected(client, monkeypatch):
    monkeypatch.setenv("AUTH_MODE", "max")
    invalid = signed_init_data(9020) + "tampered"
    assert client.post("/api/auth/max", json={"init_data": invalid}, headers={"Origin": "http://localhost:5173"}).status_code == 401
