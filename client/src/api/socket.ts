import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

// Conexión única de socket.io, autenticada con el token JWT guardado.
export function obtenerSocket(): Socket {
  if (!socket) {
    socket = io({
      auth: { token: localStorage.getItem("token") },
      autoConnect: true,
    });
  }
  return socket;
}

export function cerrarSocket() {
  socket?.disconnect();
  socket = null;
}
