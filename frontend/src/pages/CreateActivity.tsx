import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { api } from "../api/client";
import { sports, toCustomSport } from "../utils/sports";
export function CreateActivity() {
  const nav = useNavigate(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [customSport, setCustomSport] = useState(""),
    [created, setCreated] = useState<number | null>(null);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({
    sport_type: "running",
    title: "",
    description: "",
    date: tomorrow,
    time: "08:00",
    location_name: "Парк Горького",
    address: "ул. Крымский Вал, 9",
    latitude: 55.7298,
    longitude: 37.6011,
    level: "Любой",
    max_participants: 8,
    price: 0,
  });
  const set = (key: string, value: any) =>
    setForm((v) => ({ ...v, [key]: value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { date, time, ...activity } = form;
      const a = await api.create({
        city_id: 1,
        ...activity,
        sport_type:
          form.sport_type === "other"
            ? toCustomSport(customSport)
            : form.sport_type,
        start_datetime: `${date}T${time}:00`,
      });
      setCreated(a.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (created)
    return (
      <div className="page success-page">
        <CheckCircle2 />
        <span className="eyebrow">ВСЁ ГОТОВО</span>
        <h1>Движуха создана 🎉</h1>
        <p>Она уже появилась в общей ленте, на карте и в разделе «Мои».</p>
        <button
          className="btn primary wide"
          onClick={() => nav(`/activity/${created}`)}
        >
          Открыть активность
        </button>
        <button className="btn secondary wide" onClick={() => nav("/")}>
          На главную
        </button>
      </div>
    );
  return (
    <div className="page form-page">
      <header className="page-header">
        <button onClick={() => nav(-1)}>
          <ChevronLeft />
        </button>
        <div>
          <span className="eyebrow">НОВАЯ АКТИВНОСТЬ</span>
          <h1>Создать движуху</h1>
        </div>
      </header>
      <form onSubmit={submit}>
        <label>
          Вид спорта
          <select
            value={form.sport_type}
            onChange={(e) => set("sport_type", e.target.value)}
          >
            {sports.map((s) => (
              <option value={s.id} key={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </label>
        {form.sport_type === "other" && (
          <label className="custom-sport-field">
            Свой вид спорта
            <input
              required
              autoFocus
              minLength={2}
              maxLength={40}
              placeholder="Например, плавание"
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
            />
          </label>
        )}
        <label>
          Название
          <input
            required
            minLength={3}
            placeholder="Например, пробежка 5 км"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        <label>
          Описание
          <textarea
            required
            minLength={3}
            rows={4}
            placeholder="Расскажи, как всё пройдёт"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Дата
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </label>
          <label>
            Время
            <input
              type="time"
              required
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </label>
        </div>
        <label>
          Место
          <input
            required
            value={form.location_name}
            onChange={(e) => set("location_name", e.target.value)}
          />
        </label>
        <label>
          Адрес
          <input
            required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Широта
            <input
              type="number"
              step="any"
              required
              value={form.latitude}
              onChange={(e) => set("latitude", Number(e.target.value))}
            />
          </label>
          <label>
            Долгота
            <input
              type="number"
              step="any"
              required
              value={form.longitude}
              onChange={(e) => set("longitude", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Уровень
            <select
              value={form.level}
              onChange={(e) => set("level", e.target.value)}
            >
              {["Любой", "Новичок", "Любитель", "Средний", "Продвинутый"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Участников
            <input
              type="number"
              min="2"
              max="1000"
              value={form.max_participants}
              onChange={(e) => set("max_participants", Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Стоимость, ₽
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
          />
          <small>0 — бесплатно</small>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary wide" disabled={busy}>
          {busy ? "Создаём…" : "Создать активность"}
        </button>
      </form>
    </div>
  );
}
