import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { authRouter } from "./routes/auth.routes.js";
import { usuariosRouter } from "./routes/usuarios.routes.js";
import { clientesRouter } from "./routes/clientes.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { nominasRouter } from "./routes/nominas.routes.js";
import { proyectosRouter } from "./routes/proyectos.routes.js";
import { configurarChat } from "./lib/chatSocket.js";

const app = express();

app.use(cors());
app.use(express.json());

// Salud del servicio.
app.get("/api/health", (_req, res) => res.json({ ok: true, servicio: "Sistema Integral API" }));

app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/clientes", clientesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/nominas", nominasRouter);
app.use("/api/proyectos", proyectosRouter);

// Manejo de errores no controlados.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Servidor HTTP compartido por Express y por el chat en tiempo real (socket.io).
const httpServer = createServer(app);
configurarChat(httpServer);

const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, () => {
  console.log(`API del Sistema Integral escuchando en http://localhost:${PORT}`);
});
