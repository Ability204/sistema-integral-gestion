import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { cerrarSocket } from "../api/socket";

export interface Usuario {
  id: string;
  username: string;
  rol: "ADMIN" | "SUPERVISOR" | "USUARIO";
  nombre: string;
  apellidoPaterno: string;
}

interface AuthCtx {
  usuario: Usuario | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  esSupervisor: boolean;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem("usuario");
    return raw ? (JSON.parse(raw) as Usuario) : null;
  });

  async function login(username: string, password: string) {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  function logout() {
    cerrarSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  const esSupervisor = usuario?.rol === "ADMIN" || usuario?.rol === "SUPERVISOR";

  return <Ctx.Provider value={{ usuario, login, logout, esSupervisor }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
