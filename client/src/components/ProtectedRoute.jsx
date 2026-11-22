import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Spinner from "./Spinner";

// Wraps private pages. While the session check is running show a spinner; if nobody is logged in redirect to /login
// (remembering where they wanted to go); otherwise render the nested route.
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking your session" className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Login/Register are pointless for someone already signed in.
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading" className="min-h-screen" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
