import { Route, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
