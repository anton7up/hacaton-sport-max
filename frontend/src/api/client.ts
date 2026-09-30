import type { Activity, City, Event, Sport, User } from "../types";
const BASE = import.meta.env.VITE_API_URL || "";
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!r.ok) {
    let msg = "Что-то пошло не так";
    try {
      const e = await r.json();
      msg = Array.isArray(e.detail)
        ? e.detail
            .map((item: { msg?: string }) => item.msg || "Ошибка в данных")
            .join("; ")
        : e.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}
export const api = {
  cities: () => request<City[]>("/api/cities"),
  sports: () => request<Sport[]>("/api/sports"),
  activities: (params = new URLSearchParams()) =>
    request<Activity[]>(`/api/activities?${params}`),
  activity: (id: number) => request<Activity>(`/api/activities/${id}`),
  join: (id: number) =>
    request<Activity>(`/api/activities/${id}/join`, { method: "POST" }),
  leave: (id: number) =>
    request<void>(`/api/activities/${id}/join`, { method: "DELETE" }),
  create: (body: unknown) =>
    request<Activity>("/api/activities", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  myActivities: () =>
    request<{ joined: Activity[]; organized: Activity[] }>(
      "/api/users/me/activities",
    ),
  events: () => request<Event[]>("/api/events"),
  user: () => request<User>("/api/auth/me"),
  maxAuth: (initData: string) =>
    request<User>("/api/auth/max", {
      method: "POST",
      body: JSON.stringify({ init_data: initData }),
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  updateUser: (body: Partial<User>) =>
    request<User>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
