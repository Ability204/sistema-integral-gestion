import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Props {
  id?: string | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

interface Empleado {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

interface Miembro {
  userId: string;
  rolProyecto: string;
  salario: number;
}

const ESTADOS = [
  { v: "PLANEACION", t: "Planeación" },
  { v: "EN_PROGRESO", t: "En progreso" },
  { v: "COMPLETADO", t: "Completado" },
  { v: "CANCELADO", t: "Cancelado" },
];

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export function FormProyecto({ id, onCerrar, onGuardado }: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [f, setF] = useState({
    nombre: "", proyeccion: "", objetivos: "", metas: "",
    estado: "PLANEACION", presupuesto: "", fechaInicio: "", fechaFin: "",
  });
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [cargando, setCargando] = useState(false);
  const edicion = Boolean(id);

  useEffect(() => {
    api.get("/usuarios").then((r) => setEmpleados(r.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get(`/proyectos/${id}`).then((r) => {
      const p = r.data;
      setF({
        nombre: p.nombre, proyeccion: p.proyeccion ?? "", objetivos: p.objetivos ?? "",
        metas: p.metas ?? "", estado: p.estado, presupuesto: String(p.presupuesto ?? ""),
        fechaInicio: p.fechaInicio?.slice(0, 10) ?? "", fechaFin: p.fechaFin?.slice(0, 10) ?? "",
      });
      setMiembros(p.miembros.map((m: any) => ({ userId: m.userId, rolProyecto: m.rolProyecto, salario: m.salario })));
    });
  }, [id]);

  function set(campo: string, valor: string) {
    setF((prev) => ({ ...prev, [campo]: valor }));
  }

  function agregarMiembro() {
    const disponible = empleados.find((e) => !miembros.some((m) => m.userId === e.id));
    if (!disponible) return;
    setMiembros((prev) => [...prev, { userId: disponible.id, rolProyecto: "", salario: 0 }]);
  }
  function cambiarMiembro(i: number, campo: keyof Miembro, valor: string | number) {
    setMiembros((prev) => prev.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)));
  }
  function quitarMiembro(i: number) {
    setMiembros((prev) => prev.filter((_, idx) => idx !== i));
  }

  const costoNomina = miembros.reduce((s, m) => s + (Number(m.salario) || 0), 0);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setCargando(true);
    const payload = {
      ...f,
      presupuesto: Number(f.presupuesto) || 0,
      fechaInicio: f.fechaInicio || null,
      fechaFin: f.fechaFin || null,
      miembros: miembros.map((m) => ({ ...m, salario: Number(m.salario) || 0 })),
    };
    try {
      if (edicion) await api.put(`/proyectos/${id}`, payload);
      else await api.post("/proyectos", payload);
      onGuardado();
    } catch (err: any) {
      setErrores(err.response?.data?.errores ?? {});
    } finally {
      setCargando(false);
    }
  }

  const E = ({ campo }: { campo: string }) =>
    errores[campo] ? <p className="error-text">{errores[campo][0]}</p> : null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={guardar} className="my-4 w-full max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{edicion ? "Editar proyecto" : "Nuevo proyecto"}</h3>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onCerrar}>✕</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Nombre del proyecto</label>
            <input className="input" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} />
            <E campo="nombre" />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={f.estado} onChange={(e) => set("estado", e.target.value)}>
              {ESTADOS.map((s) => <option key={s.v} value={s.v}>{s.t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Proyección (descripción)</label>
          <textarea className="input" rows={2} value={f.proyeccion} onChange={(e) => set("proyeccion", e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Objetivos</label>
            <textarea className="input" rows={2} value={f.objetivos} onChange={(e) => set("objetivos", e.target.value)} />
          </div>
          <div>
            <label className="label">Metas</label>
            <textarea className="input" rows={2} value={f.metas} onChange={(e) => set("metas", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Fecha inicio</label>
            <input className="input" type="date" value={f.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha fin</label>
            <input className="input" type="date" value={f.fechaFin} onChange={(e) => set("fechaFin", e.target.value)} />
          </div>
          <div>
            <label className="label">Presupuesto</label>
            <input className="input" type="number" step="0.01" value={f.presupuesto} onChange={(e) => set("presupuesto", e.target.value)} placeholder="0.00" />
          </div>
        </div>

        {/* Empleados involucrados */}
        <fieldset className="space-y-2">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold text-marca-700">Empleados involucrados</legend>
            <button type="button" className="text-sm text-marca-600 hover:underline" onClick={agregarMiembro}>+ Agregar empleado</button>
          </div>
          {miembros.length === 0 && <p className="text-sm text-slate-400">Sin empleados asignados todavía.</p>}
          {miembros.map((m, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <select className="input col-span-5" value={m.userId} onChange={(e) => cambiarMiembro(i, "userId", e.target.value)}>
                {empleados.map((u) => (
                  <option key={u.id} value={u.id}>{u.apellidoPaterno} {u.apellidoMaterno} {u.nombre}</option>
                ))}
              </select>
              <input className="input col-span-4" placeholder="Rol en el proyecto" value={m.rolProyecto} onChange={(e) => cambiarMiembro(i, "rolProyecto", e.target.value)} />
              <input className="input col-span-2" type="number" step="0.01" placeholder="Salario" value={m.salario} onChange={(e) => cambiarMiembro(i, "salario", e.target.value)} />
              <button type="button" className="col-span-1 text-red-500 hover:text-red-700" onClick={() => quitarMiembro(i)}>✕</button>
            </div>
          ))}
          {miembros.length > 0 && (
            <p className="text-right text-sm text-slate-500">
              Costo de nómina del proyecto: <b className="text-slate-700">{money(costoNomina)}</b>
            </p>
          )}
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={cargando}>Cancelar</button>
          <button className="btn-primary" disabled={cargando}>{cargando ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}
