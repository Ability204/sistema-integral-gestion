import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verificarPassword, firmarToken, type Rol } from "../lib/auth.js";
import { autenticar } from "../middleware/autenticar.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login — inicia sesión y devuelve token + datos del usuario.
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.activo) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const ok = await verificarPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = firmarToken({ sub: user.id, username: user.username, rol: user.rol as Rol });
  res.json({
    token,
    usuario: {
      id: user.id,
      username: user.username,
      rol: user.rol,
      nombre: user.nombre,
      apellidoPaterno: user.apellidoPaterno,
    },
  });
});

// GET /api/auth/me — devuelve el usuario autenticado.
authRouter.get("/me", autenticar, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.usuario!.sub } });
  if (!user) return res.status(404).json({ error: "No encontrado" });
  res.json({
    id: user.id,
    username: user.username,
    rol: user.rol,
    nombre: user.nombre,
    apellidoPaterno: user.apellidoPaterno,
  });
});
