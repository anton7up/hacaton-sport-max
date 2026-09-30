import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Share2, Users } from "lucide-react";
import { api } from "../api/client";
import type { Activity } from "../types";
import { formatDate, getSport, initials } from "../utils/sports";
import { Loader, ErrorState } from "../components/States";
import { ActivityMap } from "../components/ActivityMap";
import { platformService } from "../services/platform";
export function ActivityDetails() {
  const { id } = useParams(),
    nav = useNavigate();
  const [item, setItem] = useState<Activity | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false);
  const load = () =>
    api
      .activity(Number(id))
      .then(setItem)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, [id]);
  if (error)
    return (
      <div className="page">
        <ErrorState message={error} />
      </div>
    );
  if (!item) return <Loader />;
  const s = getSport(item.sport_type);
  const join = async () => {
    setBusy(true);
    try {
      setItem(await api.join(item.id));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const maps = `https://yandex.ru/maps/?pt=${item.longitude},${item.latitude}&z=16&l=map`;
  return (
    <div className="page details-page">
      <header className="detail-header">
        <button onClick={() => nav(-1)}>
          <ArrowLeft />
        </button>
        <button
          onClick={() =>
            platformService.shareActivity(item.title, location.href)
          }
        >
          <Share2 />
        </button>
      </header>
      <div className="detail-title">
        <span className="sport-badge">
          <i>{s.emoji}</i>
          {s.name}
        </span>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
      </div>
      <div className="facts">
        <div>
          <Calendar />
          <span>
            <small>Когда</small>
            <b>{formatDate(item.start_datetime)}</b>
          </span>
        </div>
        <div>
          <MapPin />
          <span>
            <small>Где</small>
            <b>{item.location_name}</b>
            <em>{item.address}</em>
          </span>
        </div>
        <div>
          <Users />
          <span>
            <small>Компания</small>
            <b>
              {item.participant_count} из {item.max_participants}
            </b>
          </span>
        </div>
      </div>
      <ActivityMap activities={[item]} compact />
      <button
        className="external-map"
        onClick={() => platformService.openExternalLink(maps)}
      >
        Открыть в Яндекс Картах
      </button>
      <section className="detail-section">
        <span className="eyebrow">ОРГАНИЗАТОР</span>
        <div className="organizer">
          <div className="avatar">{initials(item.organizer_name)}</div>
          <div>
            <b>{item.organizer_name}</b>
            <small>Организатор активности</small>
          </div>
        </div>
      </section>
      <section className="detail-section">
        <span className="eyebrow">ДЕТАЛИ</span>
        <div className="detail-chips">
          <span>◎ {item.level}</span>
          <span>{item.price ? `${item.price} ₽` : "Бесплатно"}</span>
        </div>
      </section>
      <section className="detail-section">
        <span className="eyebrow">УЧАСТНИКИ</span>
        <div className="participant-row">
          {item.participants.slice(0, 6).map((p) => (
            <div className="avatar" key={p.id} title={p.name}>
              {initials(p.name)}
            </div>
          ))}
          {item.participant_count < item.max_participants && (
            <div className="avatar empty-avatar">
              +{item.max_participants - item.participant_count}
            </div>
          )}
        </div>
      </section>
      {success && (
        <div className="toast">Готово! Активность добавлена в «Мои» ✓</div>
      )}
      <div className="sticky-cta">
        <div>
          <small>Стоимость</small>
          <b>{item.price ? `${item.price} ₽` : "Бесплатно"}</b>
        </div>
        {item.is_joined ? (
          <Link className="btn joined" to="/my">
            Вы участвуете ✓
          </Link>
        ) : (
          <button
            className="btn primary"
            disabled={busy || item.participant_count >= item.max_participants}
            onClick={join}
          >
            {item.participant_count >= item.max_participants
              ? "Мест нет"
              : busy
                ? "Присоединяем…"
                : "Присоединиться"}
          </button>
        )}
      </div>
    </div>
  );
}
