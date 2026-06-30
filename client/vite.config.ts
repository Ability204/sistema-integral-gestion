import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redirige las llamadas /api al backend en el puerto 4000.
      "/api": "http://localhost:4000",
      // Redirige el tráfico de WebSocket del chat (socket.io) al backend.
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
      },
    },
  },
});
