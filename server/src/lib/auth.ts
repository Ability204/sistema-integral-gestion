import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "clave-de-desarrollo";
const TOKEN_EXPIRA = "8h";

// Roles posibles del sistema.
export type Rol = "ADMIN" | "SUPERVISOR" | "USUARIO";

export interface TokenPayload {
  sub: string; // id del usuario
  username: string;
  rol: Rol;
}

export function hashPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, 10);
}

export function verificarPassword(plano: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}

export function firmarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRA });
}

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
