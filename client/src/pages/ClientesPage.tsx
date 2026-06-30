import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { FormCliente } from "./FormCliente";
import { ModalEliminar } from "../components/ModalEliminar";
import { Toast } from "../components/Toast";
import { descargarPDF } from "../api/descargas";

interface Cliente {
  id: string; tipoPersona: string; tipoRelacion: string; rfc: string;
  razonSocial: string; correo: string; telefono1: string; ciudad: string; estado: string;
}

export function ClientesPage() {
  const { usuario, esSupervisor } = useAuth();
  const [datos, setDatos] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");

  const [buscar, setBuscar] = useState("");
  const [tipoPersona, setTipoPersona] = useState("");
  const [tipoRelacion, setTipoRelacion] = useState("");

  const [formId, setFormId] = useState<string | null | undefined>(undefined);
  const [eliminar, setEliminar] = useState<Cliente | null>(null);

  function params() {
    const p = new URLSearchParams();
    if (buscar.trim()) p.set("buscar", buscar.trim());
    if (tipoPersona) p.set("tipoPersona", tipoPersona);
    if (tipoRelacion) p.set("tipoRelacion", tipoRelacion);
    return p;
  }

  async function cargar() {
    setCargando(true);
    const { data } = await api.get(`/clientes?${params().toString()}`);
    setDatos(data);
    setCargando(false);
  }

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, tipoPersona, tipoRelacion]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Clientes y proveedores (persona física o moral)</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => descargarPDF(`/clientes/reporte.pdf?${params()}`, "reporte-clientes.pdf")}>
            ⬇ Exportar PDF
          </button>
          <button className="btn-primary" onClick={() => setFormId(null)}>+ Nuevo cliente</button>
        </div>
      </div>

      <div className="card grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Búsqueda (razón social, RFC, nombre, correo)</label>
          <input className="input" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escribe para buscar…" />
        </div>
        <div>
          <label className="label">Tipo de persona</label>
          <select className="input" value={tipoPersona} onChange={(e) => setTipoPersona(e.target.value)}>
            <option value="">Todas</option>
            <option value="FISICA">Física</option>
            <option value="MORAL">Moral</option>
          </select>
        </div>
        <div>
          <label className="label">Relación</label>
          <select className="input" value={tipoRelacion} onChange={(e) => setTipoRelacion(e.target.value)}>
            <option value="">Todas</option>
            <option value="CLIENTE">Cliente</option>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="AMBOS">Ambos</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">RFC</th>
              <th className="px-4 py-3">Razón social / Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Relación</th>
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
              datos.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.rfc}</td>
                  <td className="px-4 py-3">{c.razonSocial}</td>
                  <td className="px-4 py-3">{c.tipoPersona === "FISICA" ? "Física" : "Moral"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-medium text-marca-700">{c.tipoRelacion}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.correo}</td>
                  <td className="px-4 py-3 text-slate-500">{c.ciudad}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-marca-600 hover:underline" onClick={() => setFormId(c.id)}>Editar</button>
                    {esSupervisor && (
                      <button className="ml-3 text-red-600 hover:underline" onClick={() => setEliminar(c)}>Eliminar</button>
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
        <FormCliente
          id={formId}
          onCerrar={() => setFormId(undefined)}
          onGuardado={() => {
            const editando = formId !== null;
            setFormId(undefined);
            cargar();
            setAviso(editando ? "Cliente actualizado con éxito" : "Cliente guardado con éxito");
          }}
        />
      )}
      {eliminar && (
        <ModalEliminar
          recurso="clientes"
          id={eliminar.id}
          descripcion={`${eliminar.razonSocial} (${eliminar.rfc})`}
          onCerrar={() => setEliminar(null)}
          onEliminado={() => {
            const nombre = eliminar.razonSocial;
            setEliminar(null);
            cargar();
            setAviso(`${usuario?.nombre}: cliente "${nombre}" eliminado con éxito`);
          }}
        />
      )}

      {aviso && <Toast mensaje={aviso} onCerrar={() => setAviso("")} />}
    </div>
  );
}
