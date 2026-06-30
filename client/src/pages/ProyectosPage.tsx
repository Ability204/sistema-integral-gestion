import { useEffect, useState } from "react";
import { api } from "../api/client";
import { FormProyecto } from "./FormProyecto";
import { Toast } from "../components/Toast";
import { descargarPDF } from "../api/descargas";

interface Miembro {
  salario: number;
  rolProyecto: string;
  user: { nombre: string; apellidoPaterno: string };
}
interface Proyecto {
  id: string;
  nombre: string;
  objetivos?: string;
  estado: string;
  presupuesto: number;
  miembros: Miembro[];
}

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const ESTADO_COLOR: Record<string, string> = {
  PLANEACION: "bg-amber-100 text-amber-700",
  EN_PROGRESO: "bg-blue-100 text-blue-700",
  COMPLETADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-slate-200 text-slate-600",
};
const ESTADO_TXT: Record<string, string> = {
  PLANEACION: "Planeación", EN_PROGRESO: "En progreso", COMPLETADO: "Completado", CANCELADO: "Cancelado",
};

export function ProyectosPage() {
  const [datos, setDatos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [formId, setFormId] = useState<string | null | undefined>(undefined);
  const [aviso, setAviso] = useState("");

  function params() {
    const p = new URLSearchParams();
    if (buscar.trim()) p.set("buscar", buscar.trim());
    if (estado) p.set("estado", estado);
    return p;
  }

  async function cargar() {
    setCargando(true);
    const { data } = await api.get(`/proyectos?${params().toString()}`);
    setDatos(data);
    setCargando(false);
  }

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, estado]);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await api.delete(`/proyectos/${id}`);
    cargar();
    setAviso("Proyecto eliminado");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proyectos</h1>
          <p className="text-sm text-slate-500">Proyección, objetivos, metas y equipos de trabajo</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => descargarPDF(`/proyectos/reporte.pdf?${params()}`, "reporte-proyectos.pdf")}>
            ⬇ Exportar PDF
          </button>
          <button className="btn-primary" onClick={() => setFormId(null)}>+ Nuevo proyecto</button>
        </div>
      </div>

      <div className="card grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label">Búsqueda (nombre, objetivos)</label>
          <input className="input" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escribe para buscar…" />
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="PLANEACION">Planeación</option>
            <option value="EN_PROGRESO">En progreso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <p className="text-center text-slate-400">Cargando…</p>
      ) : datos.length === 0 ? (
        <div className="card text-center text-slate-400">No hay proyectos. Crea el primero con “+ Nuevo proyecto”.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {datos.map((p) => {
            const costo = p.miembros.reduce((s, m) => s + m.salario, 0);
            return (
              <div key={p.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-slate-800">{p.nombre}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[p.estado]}`}>
                    {ESTADO_TXT[p.estado]}
                  </span>
                </div>
                {p.objetivos && <p className="text-sm text-slate-500"><b>Objetivos:</b> {p.objetivos}</p>}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                  <span>👥 {p.miembros.length} integrante(s)</span>
                  <span>💰 Nómina: {money(costo)}</span>
                  <span>📊 Presupuesto: {money(p.presupuesto)}</span>
                </div>
                {p.miembros.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.miembros.map((m, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {m.user.nombre} {m.user.apellidoPaterno}{m.rolProyecto && ` · ${m.rolProyecto}`}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-2 text-sm">
                  <button className="text-marca-600 hover:underline" onClick={() => setFormId(p.id)}>Editar</button>
                  <button className="text-red-600 hover:underline" onClick={() => eliminar(p.id)}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formId !== undefined && (
        <FormProyecto
          id={formId}
          onCerrar={() => setFormId(undefined)}
          onGuardado={() => { setFormId(undefined); cargar(); setAviso("Proyecto guardado con éxito"); }}
        />
      )}
      {aviso && <Toast mensaje={aviso} onCerrar={() => setAviso("")} />}
    </div>
  );
}
