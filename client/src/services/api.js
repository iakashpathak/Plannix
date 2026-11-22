import axios from "axios";

// One configured Axios instance for the whole app.
//  - baseURL "/api": same-origin. Vite proxies it to Express in dev; Vercel rewrites it to the serverless function in prod.
//  - withCredentials: lets the browser send/receive the HTTP-only auth cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// AuthContext registers a callback so an expired session anywhere logs the user out cleanly.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !AUTH_PATHS.some((p) => url.startsWith(p))) onUnauthorized?.();
    return Promise.reject(error);
  }
);

export default api;
