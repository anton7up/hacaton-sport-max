import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { Activity } from "../types";
import { formatDate, getSport } from "../utils/sports";
import "leaflet/dist/leaflet.css";
const icon = (emoji: string) =>
  L.divIcon({
    className: "sport-marker",
    html: `<span>${emoji}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
export function ActivityMap({
  activities,
  compact = false,
}: {
  activities: Activity[];
  compact?: boolean;
}) {
  return (
    <div className={`map-wrap ${compact ? "compact" : ""}`}>
      <MapContainer
        center={[55.751244, 37.618423]}
        zoom={11}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {activities.map((a) => {
          const s = getSport(a.sport_type);
          return (
            <Marker
              key={a.id}
              position={[a.latitude, a.longitude]}
              icon={icon(s.emoji)}
            >
              <Popup>
                <div className="map-popup">
                  <span>
                    {s.emoji} {s.name}
                  </span>
                  <b>{a.title}</b>
                  <small>
                    {formatDate(a.start_datetime)}
                    <br />
                    {a.location_name} · {a.participant_count}/
                    {a.max_participants}
                  </small>
                  <Link to={`/activity/${a.id}`}>Подробнее</Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="map-attribution" aria-label="Источник картографических данных">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
      </div>
    </div>
  );
}
