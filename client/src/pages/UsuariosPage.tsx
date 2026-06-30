import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { FormUsuario } from "./FormUsuario";
import { ModalEliminar } from "../components/ModalEliminar";
import { Toast } from "../components/Toast";
import { descargarPDF } from "../api/descargas";

interface Usuario {
  id: string; username: string; rol: string; nombre: string;
  apellidoPaterno: string; apellidoMaterno: string; curp: string;
  correo: string; telefono1: string; areaContratacion: string;
  ciudad: string; estado: string;
}

export function UsuariosPage() {
  const { usuario, esSupervisor } = useAuth();
  const [datos, setDatos] = useState<Usuario[]>([]);
  const [aviso, setAviso] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

  // Criterios de consulta
  const [buscar, setBuscar] = useState("");
  const [area, setArea] = useState("");
  const [rol, setRol] = useState("");

  const [formId, setFormId] = useState<string | null | undefined>(undefined); // undefined=cerrado
  const [eliminar, setEliminar] = useState<Usuario | null>(null);

  function params() {
    const p = new URLSearchParams();
    if (buscar.trim()) p.set("buscar", buscar.trim());
    if (area) p.set("area", area);
    if (rol) p.set("rol", rol);
    return p;
  }

  async function cargar() {
    setCargando(true);
    const { data } = await api.get(`/usuarios?${params().toString()}`);
    setDatos(data);
    setCargando(false);
  }

  // Carga la lista de áreas para el filtro (se refresca al dar de alta un usuario).
  async function cargarAreas() {
    const { data } = await api.get("/usuarios/areas");
    setAreas(data);
  }

  useEffect(() => {
    cargarAreas();
  }, []);
  useEffect(() => {
    const t = setTimeout(cargar, 250); // pequeño debounce
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, area, rol]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500">Empleados que operan el sistema</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => descargarPDF(`/usuarios/reporte.pdf?${params()}`, "reporte-usuarios.pdf")}>
            ⬇ Exportar PDF
          </button>
          <button className="btn-primary" onClick={() => setFormId(null)}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      {/* Criterios de consulta */}
      <div className="card grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Búsqueda (nombre, CURP, usuario, correo)</label>
          <input className="input" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escribe para buscar…" />
        </div>
        <div>
          <label className="label">Área</label>
          <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Todas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Rol</label>
          <select className="input" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="">Todos</option>
            <option value="USUARIO">USUARIO</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">CURP</th>
              <th className="px-4 py-3">Nombre completo</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>
            ) : datos.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
            ) : (
              datos.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{u.curp}</td>
                  <td className="px-4 py-3">{u.apellidoPaterno} {u.apellidoMaterno} {u.nombre}</td>
                  <td className="px-4 py-3">{u.areaContratacion}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-medium text-marca-700">{u.rol}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.correo}</td>
                  <td className="px-4 py-3 text-slate-500">{u.ciudad}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-marca-600 hover:underline" onClick={() => setFormId(u.id)}>Editar</button>
                    {esSupervisor && (
                      <button className="ml-3 text-red-600 hover:underline" onClick={() => setEliminar(u)}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{datos.length} registro(s). La eliminación requiere autorización de un supervisor.</p>

      {formId !== undefined && (
        <FormUsuario
          id={formId}
          onCerrar={() => setFormId(undefined)}
          onGuardado={() => {
            const editando = formId !== null;
            setFormId(undefined);
            cargar();
            cargarAreas();
            setAviso(editando ? "Usuario actualizado con éxito" : "Usuario guardado con éxito");
          }}
        />
      )}
      {eliminar && (
        <ModalEliminar
          recurso="usuarios"
          id={eliminar.id}
          descripcion={`${eliminar.apellidoPaterno} ${eliminar.apellidoMaterno} ${eliminar.nombre}`}
          onCerrar={() => setEliminar(null)}
          onEliminado={() => {
            const nombre = `${eliminar.nombre} ${eliminar.apellidoPaterno}`;
            setEliminar(null);
            cargar();
            setAviso(`${usuario?.nombre}: usuario "${nombre}" eliminado con éxito`);
          }}
        />
      )}

      {aviso && <Toast mensaje={aviso} onCerrar={() => setAviso("")} />}
    </div>
  );
}
