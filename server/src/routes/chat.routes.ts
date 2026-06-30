import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/autenticar.js";

export const chatRouter = Router();
chatRouter.use(autenticar);

// GET /api/chat/canales — lista de canales disponibles.
chatRouter.get("/canales", async (_req, res) => {
  const canales = await prisma.channel.findMany({ orderBy: { nombre: "asc" } });
  res.json(canales);
});

// GET /api/chat/canales/:id/mensajes — historial de un canal (últimos 100).
chatRouter.get("/canales/:id/mensajes", async (req, res) => {
  const mensajes = await prisma.message.findMany({
    where: { channelId: req.params.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      autor: { select: { id: true, nombre: true, apellidoPaterno: true, rol: true } },
    },
  });
  res.json(mensajes);
});
