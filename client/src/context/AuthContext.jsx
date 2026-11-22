import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler } from "../services/api";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

// Holds "who is logged in" for the whole app (React Context API) so any component can read it via useAuth().
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know whether a valid session cookie exists

  // On first load (and page refresh) ask the server "am I logged in?". The browser sends the cookie automatically.
  useEffect(() => {
    let active = true;
    authService
      .getMe()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // If any API call later returns 401 (expired/invalid cookie) drop the user so protected routes redirect to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const u = await authService.register(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Network/server failure: still sign the user out locally so the UI never gets stuck "logged in".
      // (If the cookie could not be cleared server-side, it simply expires on its own.)
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
