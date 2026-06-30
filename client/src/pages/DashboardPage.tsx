import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { usuario } = useAuth();
  const [totUsuarios, setTotUsuarios] = useState<number | null>(null);
  const [totClientes, setTotClientes] = useState<number | null>(null);
  const [totNominas, setTotNominas] = useState<number | null>(null);
  const [totProyectos, setTotProyectos] = useState<number | null>(null);

  useEffect(() => {
    api.get("/usuarios").then((r) => setTotUsuarios(r.data.length)).catch(() => setTotUsuarios(0));
    api.get("/clientes").then((r) => setTotClientes(r.data.length)).catch(() => setTotClientes(0));
    api.get("/nominas").then((r) => setTotNominas(r.data.length)).catch(() => setTotNominas(0));
    api.get("/proyectos").then((r) => setTotProyectos(r.data.length)).catch(() => setTotProyectos(0));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Hola, {usuario?.nombre} 👋
        </h1>
        <p className="text-slate-500">Bienvenido al Sistema Integral de Gestión.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/usuarios" className="card transition hover:ring-marca-300">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Usuarios</div>
          <div className="mt-2 text-3xl font-bold text-marca-700">{totUsuarios ?? "…"}</div>
          <div className="mt-1 text-sm text-slate-500">empleados registrados</div>
        </Link>
        <Link to="/clientes" className="card transition hover:ring-marca-300">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Clientes</div>
          <div className="mt-2 text-3xl font-bold text-marca-700">{totClientes ?? "…"}</div>
          <div className="mt-1 text-sm text-slate-500">clientes y proveedores</div>
        </Link>
        <Link to="/nominas" className="card transition hover:ring-marca-300">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Nóminas</div>
          <div className="mt-2 text-3xl font-bold text-marca-700">{totNominas ?? "…"}</div>
          <div className="mt-1 text-sm text-slate-500">recibos generados</div>
        </Link>
        <Link to="/proyectos" className="card transition hover:ring-marca-300">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Proyectos</div>
          <div className="mt-2 text-3xl font-bold text-marca-700">{totProyectos ?? "…"}</div>
          <div className="mt-1 text-sm text-slate-500">proyectos registrados</div>
        </Link>
        <Link to="/chat" className="card transition hover:ring-marca-300">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Chat</div>
          <div className="mt-2 text-3xl font-bold text-marca-700">💬</div>
          <div className="mt-1 text-sm text-slate-500">comunicación de equipos</div>
        </Link>
      </div>
    </div>
  );
}
