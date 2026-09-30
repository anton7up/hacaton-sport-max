import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../api/client";
import type { Event } from "../types";
import { formatDate, getSport } from "../utils/sports";
import { platformService } from "../services/platform";
import { ErrorState, Loader } from "../components/States";
export function Events() {
  const [items, setItems] = useState<Event[]>([]),
    [error, setError] = useState("");
  const load = () =>
    api
      .events()
      .then(setItems)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="page simple-page events-page">
      <span className="eyebrow">БОЛЬШИЕ СТАРТЫ</span>
      <h1>События Москвы</h1>
      <p className="lead">
        Забеги, турниры и соревнования, ради которых стоит сохранить дату.
      </p>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : !items.length ? (
        <Loader />
      ) : (
        <div className="event-list">
          {items.map((e, i) => {
            const s = getSport(e.sport_type);
            return (
              <article className={`event-card event-${i % 4}`} key={e.id}>
                <div className="event-visual">
                  <span>{s.emoji}</span>
                  <small>{s.name}</small>
                </div>
                <div className="event-body">
                  <small>{formatDate(e.start_datetime)}</small>
                  <h2>{e.title}</h2>
                  <p>{e.location_name} · Москва</p>
                  <div>
                    <b>{e.price ? `от ${e.price} ₽` : "Бесплатно"}</b>
                    <button
                      onClick={() =>
                        platformService.openExternalLink(e.registration_url)
                      }
                    >
                      Регистрация <ExternalLink size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="demo-note">
        Все события и ссылки на регистрацию в MVP являются демонстрационными.
      </p>
    </div>
  );
}
