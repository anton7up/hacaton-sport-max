export const sports = [
  { id: "football", emoji: "⚽", name: "Футбол" },
  { id: "running", emoji: "🏃", name: "Бег" },
  { id: "tennis", emoji: "🎾", name: "Теннис" },
  { id: "basketball", emoji: "🏀", name: "Баскетбол" },
  { id: "volleyball", emoji: "🏐", name: "Волейбол" },
  { id: "hockey", emoji: "🏒", name: "Хоккей" },
  { id: "table_tennis", emoji: "🏓", name: "Настольный теннис" },
  { id: "cycling", emoji: "🚴", name: "Велосипед" },
  { id: "gym", emoji: "🏋️", name: "Тренировки" },
  { id: "boxing", emoji: "🥊", name: "Единоборства" },
  { id: "badminton", emoji: "🏸", name: "Бадминтон" },
  { id: "yoga", emoji: "🧘", name: "Йога" },
  { id: "other", emoji: "➕", name: "Другое" },
];

export const CUSTOM_SPORT_PREFIX = "custom:";

export const isCustomSport = (id: string) =>
  id.startsWith(CUSTOM_SPORT_PREFIX);

export const toCustomSport = (name: string) =>
  `${CUSTOM_SPORT_PREFIX}${name.trim()}`;

export const customSportName = (id: string) =>
  isCustomSport(id) ? id.slice(CUSTOM_SPORT_PREFIX.length) : "";

export const getSport = (id: string) =>
  sports.find((s) => s.id === id) || {
    id,
    emoji: isCustomSport(id) ? "➕" : "●",
    name: customSportName(id) || id,
  };
export const formatDate = (value: string) => {
  const d = new Date(value),
    today = new Date(),
    tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  let day = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  if (d.toDateString() === today.toDateString()) day = "Сегодня";
  if (d.toDateString() === tomorrow.toDateString()) day = "Завтра";
  return `${day} • ${time}`;
};
export const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
