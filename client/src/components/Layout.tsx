import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const enlaces = [
  { to: "/", label: "Inicio", end: true },
  { to: "/usuarios", label: "Usuarios" },
  { to: "/clientes", label: "Clientes" },
  { to: "/nominas", label: "Nóminas" },
  { to: "/proyectos", label: "Proyectos" },
  { to: "/chat", label: "Chat" },
];

export function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
          <span className="text-lg font-bold text-marca-700">Sistema Integral</span>
          <nav className="flex gap-1">
            {enlaces.map((e) => (
              <NavLink
                key={e.to}
                to={e.to}
                end={e.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? "bg-marca-50 text-marca-700" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {e.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium text-slate-700">
                {usuario?.nombre} {usuario?.apellidoPaterno}
              </div>
              <div className="text-xs text-slate-400">{usuario?.rol}</div>
            </div>
            <button className="btn-ghost" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
