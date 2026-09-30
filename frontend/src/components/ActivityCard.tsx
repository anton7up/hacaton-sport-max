import { Link } from "react-router-dom";
import type { Activity } from "../types";
import { formatDate, getSport } from "../utils/sports";
export function ActivityCard({ activity }: { activity: Activity }) {
  const s = getSport(activity.sport_type);
  return (
    <Link className="activity-card" to={`/activity/${activity.id}`}>
      <div className="card-top">
        <span className="sport-badge">
          <i>{s.emoji}</i>
          {s.name}
        </span>
        <span className="spots">
          {activity.max_participants - activity.participant_count > 0
            ? `${activity.max_participants - activity.participant_count} мест`
            : "Мест нет"}
        </span>
      </div>
      <h3>{activity.title}</h3>
      <p className="date">{formatDate(activity.start_datetime)}</p>
      <p className="location">⌖ {activity.location_name}</p>
      <div className="card-meta">
        <span>
          👥 {activity.participant_count} / {activity.max_participants}
        </span>
        <span>◎ {activity.level}</span>
        <strong>{activity.price ? `${activity.price} ₽` : "Бесплатно"}</strong>
      </div>
    </Link>
  );
}
