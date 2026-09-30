import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import {
  isCustomSport,
  sports,
  toCustomSport,
} from "../utils/sports";
import { api } from "../api/client";
const cities = [
  ["Москва", true],
  ["Санкт-Петербург", false],
  ["Казань", false],
  ["Нижний Новгород", false],
] as const;
export function Onboarding() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [customSport, setCustomSport] = useState("");
  const nav = useNavigate();
  const finish = async () => {
    const selectedSports = selected.map((sport) =>
      sport === "other" ? toCustomSport(customSport) : sport,
    );
    await api.updateUser({ city_id: 1, sports: selectedSports } as any);
    localStorage.setItem("onboarded", "1");
    nav("/");
  };
  return (
    <div className={`onboarding step-${step}`}>
      <div className="onboarding-progress">
        <i style={{ width: `${(step + 1) * 33.33}%` }} />
      </div>
      {step === 0 && (
        <section className="intro">
          <div className="brand-mark">⚡</div>
          <span className="eyebrow">В ДВИЖЕНИИ</span>
          <h1>
            Найди свою
            <br />
            <em>спортивную</em>
            <br />
            движуху
          </h1>
          <p>Играй, тренируйся и находи людей рядом.</p>
          <button className="btn primary wide" onClick={() => setStep(1)}>
            Начать
          </button>
        </section>
      )}
      {step === 1 && (
        <section>
          <span className="eyebrow">ШАГ 1 ИЗ 2</span>
          <h2>Выбери город</h2>
          <p className="sub">
            Начнём с Москвы. Остальные города уже на старте.
          </p>
          <div className="city-list">
            {cities.map(([name, active]) => (
              <button
                key={name}
                className={`city-option ${active ? "selected" : ""}`}
                disabled={!active}
              >
                <span>{active ? "М" : "•"}</span>
                <b>{name}</b>
                {active ? <Check /> : <small>Скоро</small>}
              </button>
            ))}
          </div>
          <button className="btn primary wide" onClick={() => setStep(2)}>
            Продолжить
          </button>
        </section>
      )}
      {step === 2 && (
        <section>
          <span className="eyebrow">ШАГ 2 ИЗ 2</span>
          <h2>Что тебе интересно?</h2>
          <p className="sub">
            Выбери хотя бы один вид спорта. Можно изменить позже.
          </p>
          <div className="sport-grid">
            {sports.map((s) => (
              <button
                key={s.id}
                className={
                  selected.includes(s.id) ||
                  (s.id === "other" && selected.some(isCustomSport))
                    ? "selected"
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
                <span>{s.emoji}</span>
                <b>{s.name}</b>
                {(selected.includes(s.id) ||
                  (s.id === "other" && selected.some(isCustomSport))) && (
                  <i>
                    <Check size={14} />
                  </i>
                )}
              </button>
            ))}
            {selected.includes("other") && (
              <label className="custom-sport-field sport-grid-custom">
                Какой вид спорта?
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
          </div>
          <button
            className="btn primary wide sticky-action"
            disabled={
              !selected.length ||
              (selected.includes("other") && customSport.trim().length < 2)
            }
            onClick={finish}
          >
            Вперёд к спорту
          </button>
        </section>
      )}
    </div>
  );
}
