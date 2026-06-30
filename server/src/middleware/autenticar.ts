import type { Request, Response, NextFunction } from "express";
import { verificarToken, type TokenPayload, type Rol } from "../lib/auth.js";

// Extiende Request para llevar el usuario autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

// Verifica el token JWT del header Authorization: Bearer <token>.
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autenticado" });
  }
  try {
    req.usuario = verificarToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Restringe una ruta a ciertos roles.
export function requiereRol(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tienes permiso para esta acción" });
    }
    next();
  };
}
