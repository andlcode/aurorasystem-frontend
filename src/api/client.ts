import axios from "axios";

/**
 * Em produção: use VITE_API_URL (ex: https://aurorasystem-backend-production.up.railway.app)
 * Em dev: usa /api que o Vite proxy redireciona para localhost:3000
 */
const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const publicPaths = ["/login", "/forgot-password", "/reset-password"];
      if (!publicPaths.some((p) => window.location.pathname.startsWith(p))) {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(err);
  }
);
