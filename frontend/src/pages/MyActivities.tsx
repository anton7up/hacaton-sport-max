import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Activity } from "../types";
import { ActivityCard } from "../components/ActivityCard";
import { EmptyState, ErrorState, Loader } from "../components/States";
export function MyActivities() {
  const [data, setData] = useState<{
      joined: Activity[];
      organized: Activity[];
    } | null>(null),
    [tab, setTab] = useState<"joined" | "organized">("joined"),
    [error, setError] = useState("");
  const load = () =>
    api
      .myActivities()
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="page simple-page">
      <span className="eyebrow">ТВОЙ СПОРТ</span>
      <h1>Мои активности</h1>
      <div className="tabs">
        <button
          className={tab === "joined" ? "active" : ""}
          onClick={() => setTab("joined")}
        >
          Участвую <i>{data?.joined.length || 0}</i>
        </button>
        <button
          className={tab === "organized" ? "active" : ""}
          onClick={() => setTab("organized")}
        >
          Организую <i>{data?.organized.length || 0}</i>
        </button>
      </div>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : !data ? (
        <Loader />
      ) : data[tab].length ? (
        <div className="card-list">
          {data[tab].map((x) => (
            <ActivityCard key={x.id} activity={x} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
