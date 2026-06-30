import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { prisma } from "./prisma.js";
import { verificarToken, type TokenPayload } from "./auth.js";

// Configura el servidor de WebSockets para el chat en tiempo real.
export function configurarChat(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" },
  });

  // Autenticación: cada socket debe traer un token JWT válido.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("No autenticado"));
    try {
      socket.data.usuario = verificarToken(token);
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    const usuario = socket.data.usuario as TokenPayload;

    // Unirse a un canal (sala de socket.io).
    socket.on("unirse", (channelId: string) => {
      // Sale de cualquier canal anterior para no recibir mensajes cruzados.
      for (const sala of socket.rooms) {
        if (sala !== socket.id) socket.leave(sala);
      }
      socket.join(channelId);
    });

    // Enviar un mensaje: se guarda en la BD y se difunde a todos en el canal.
    socket.on("mensaje", async (payload: { channelId: string; contenido: string }) => {
      const contenido = (payload?.contenido ?? "").trim();
      if (!contenido || !payload.channelId) return;

      const mensaje = await prisma.message.create({
        data: {
          contenido,
          channelId: payload.channelId,
          autorId: usuario.sub,
        },
        include: {
          autor: { select: { id: true, nombre: true, apellidoPaterno: true, rol: true } },
        },
      });

      // Lo reciben todos los conectados a ese canal, incluido quien lo envió.
      io.to(payload.channelId).emit("mensaje", mensaje);
    });
  });

  return io;
}
