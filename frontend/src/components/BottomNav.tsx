import { CalendarDays, Heart, Home, Plus, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
const links = [
  ["/", "Главная", Home],
  ["/events", "События", CalendarDays],
  ["/create", "Создать", Plus],
  ["/my", "Мои", Heart],
  ["/profile", "Профиль", UserRound],
] as const;
export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          className={to === "/create" ? "create-nav" : ""}
        >
          <span>
            <Icon size={22} />
          </span>
          <small>{label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
