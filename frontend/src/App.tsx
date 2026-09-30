import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Onboarding } from "./pages/Onboarding";
import { ActivityDetails } from "./pages/ActivityDetails";
import { CreateActivity } from "./pages/CreateActivity";
import { MyActivities } from "./pages/MyActivities";
import { Events } from "./pages/Events";
import { Profile } from "./pages/Profile";
function Start() {
  return localStorage.getItem("onboarded") ? (
    <Home />
  ) : (
    <Navigate to="/onboarding" replace />
  );
}
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Start />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/activity/:id" element={<ActivityDetails />} />
        <Route path="/create" element={<CreateActivity />} />
        <Route path="/my" element={<MyActivities />} />
        <Route path="/events" element={<Events />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
