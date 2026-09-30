import { useCallback, useEffect, useState } from "react";
import { Map as MapIcon, List, ChevronDown } from "lucide-react";
import { api } from "../api/client";
import type { Activity } from "../types";
import { sports } from "../utils/sports";
import { useCurrentUser } from "../context/CurrentUser";
import { ActivityCard } from "../components/ActivityCard";
import { EmptyState, ErrorState, Loader } from "../components/States";
import { ActivityMap } from "../components/ActivityMap";
import { SportScroller } from "../components/SportScroller";
export function Home() {
  const [items, setItems] = useState<Activity[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [sport, setSport] = useState(""),
    [filter, setFilter] = useState(""),
    [view, setView] = useState<"feed" | "map">("feed");
  const { user } = useCurrentUser();
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams({ city_id: "1" });
      if (sport) p.set("sport_type", sport);
      if (["today", "tomorrow", "weekend"].includes(filter))
        p.set("date", filter);
      if (filter === "free") p.set("free", "true");
      if (filter === "newbie") p.set("level", "Новичок");
      setItems(await api.activities(p));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sport, filter]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="page home-page">
      <header className="topbar">
        <button className="city-picker">
          <small>Твой город</small>
          <b>
            Москва <ChevronDown size={17} />
          </b>
        </button>
        <div className="avatar">{user?.name?.[0] || "А"}</div>
      </header>
      <section className="hero-strip">
        <span className="eyebrow">СПОРТ РЯДОМ</span>
        <h1>Чем займёмся?</h1>
        <p>Найди людей, место и повод выйти из дома.</p>
      </section>
      <SportScroller selectedSport={sport} onSelect={setSport} />
      <div className="filter-row">
        {[
          ["today", "Сегодня"],
          ["tomorrow", "Завтра"],
          ["weekend", "Выходные"],
          ["free", "Бесплатно"],
          ["newbie", "Новичкам"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={filter === id ? "active" : ""}
            onClick={() => setFilter(filter === id ? "" : id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{items.length} АКТИВНОСТЕЙ</span>
          <h2>
            {sport ? sports.find((s) => s.id === sport)?.name : "Рядом с тобой"}
          </h2>
        </div>
        <div className="view-toggle">
          <button
            className={view === "feed" ? "active" : ""}
            onClick={() => setView("feed")}
          >
            <List size={18} />
          </button>
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
          >
            <MapIcon size={18} />
          </button>
        </div>
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} retry={load} />
      ) : !items.length ? (
        <EmptyState />
      ) : view === "feed" ? (
        <div className="card-list">
          {items.map((x) => (
            <ActivityCard key={x.id} activity={x} />
          ))}
        </div>
      ) : (
        <ActivityMap activities={items} />
      )}
    </div>
  );
}
