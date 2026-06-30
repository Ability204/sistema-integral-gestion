import axios from "axios";

// Cliente HTTP centralizado. La baseURL /api se redirige al backend (ver vite.config).
export const api = axios.create({ baseURL: "/api" });

// Inyecta el token JWT guardado en cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira (401), limpia la sesión y vuelve al login.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !location.pathname.includes("/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      location.href = "/login";
    }
    return Promise.reject(error);
  },
);
