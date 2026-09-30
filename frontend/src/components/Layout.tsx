import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
export function Layout() {
  const loc = useLocation();
  const hide = loc.pathname === "/onboarding";
  return (
    <div className="app-shell">
      <main className={hide ? "onboarding-main" : ""}>
        <Outlet />
      </main>
      {!hide && <BottomNav />}
    </div>
  );
}
