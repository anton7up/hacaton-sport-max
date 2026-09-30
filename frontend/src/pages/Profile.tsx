import { useEffect, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { api } from "../api/client";
import type { User } from "../types";
import {
  customSportName,
  getSport,
  isCustomSport,
  sports,
  toCustomSport,
} from "../utils/sports";
import { Loader } from "../components/States";
import { useCurrentUser } from "../context/CurrentUser";
export function Profile() {
  const [user, setUser] = useState<User | null>(null),
    [editing, setEditing] = useState(false),
    [name, setName] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [customSport, setCustomSport] = useState(""),
    [saved, setSaved] = useState(false);
  const { reload } = useCurrentUser();
  useEffect(() => {
    api.user().then((u) => {
      setUser(u);
      setName(u.name);
      setSelected(u.sports);
      setCustomSport(
        customSportName(u.sports.find(isCustomSport) || ""),
      );
    });
  }, []);
  if (!user) return <Loader />;
  const save = async () => {
    const selectedSports = selected.map((sport) =>
      sport === "other" || isCustomSport(sport)
        ? toCustomSport(customSport)
        : sport,
    );
    const u = await api.updateUser({ name, sports: selectedSports } as any);
    setUser(u);
    setSelected(u.sports);
    setCustomSport(customSport.trim());
    setEditing(false);
    setSaved(true);
    reload();
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="page simple-page profile-page">
      <div className="profile-top">
        <div className="profile-avatar">{user.name[0]}</div>
        <div>
          <span className="eyebrow">ПРОФИЛЬ</span>
          <h1>{user.name}</h1>
          <p>
            <MapPin size={15} /> Москва
          </p>
        </div>
        <button onClick={() => setEditing(!editing)}>
          {editing ? "Отмена" : "Изменить"}
        </button>
      </div>
      <div className="stats">
        <div>
          <b>{user.activities_count}</b>
          <small>активностей</small>
        </div>
        <div>
          <b>{user.organized_count}</b>
          <small>организовал</small>
        </div>
        <div>
          <b>{user.visited_count}</b>
          <small>посетил</small>
        </div>
      </div>
      {editing ? (
        <section className="profile-edit">
          <label>
            Имя
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>Любимые виды спорта</label>
          <div className="profile-sports">
            {sports.map((s) => (
              <button
                key={s.id}
                className={
                  selected.includes(s.id) ||
                  (s.id === "other" && selected.some(isCustomSport))
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelected((v) =>
                    s.id === "other"
                      ? v.includes("other") || v.some(isCustomSport)
                        ? v.filter(
                            (x) => x !== "other" && !isCustomSport(x),
                          )
                        : [...v, "other"]
                      : v.includes(s.id)
                        ? v.filter((x) => x !== s.id)
                      : [...v, s.id],
                  )
                }
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
          {(selected.includes("other") || selected.some(isCustomSport)) && (
            <label className="custom-sport-field">
              Свой вид спорта
              <input
                minLength={2}
                maxLength={40}
                placeholder="Например, плавание"
                value={customSport}
                onChange={(e) => setCustomSport(e.target.value)}
              />
            </label>
          )}
          <button
            className="btn primary wide"
            disabled={
              (selected.includes("other") || selected.some(isCustomSport)) &&
              customSport.trim().length < 2
            }
            onClick={save}
          >
            Сохранить
          </button>
        </section>
      ) : (
        <section>
          <span className="eyebrow">ЛЮБИМЫЕ ВИДЫ СПОРТА</span>
          <div className="favorite-sports">
            {user.sports.map((id) => {
              const s = getSport(id);
              return (
                <span key={id}>
                  {s.emoji} {s.name}
                </span>
              );
            })}
          </div>
        </section>
      )}
      {saved && (
        <div className="toast">
          <Check size={17} /> Профиль обновлён
        </div>
      )}
      <section className="about-card">
        <b>В движении</b>
        <p>
          Находи компанию для спорта. Сегодня — web app, завтра — Mini App в
          MAX.
        </p>
        <small>Версия MVP 1.0</small>
      </section>
    </div>
  );
}
