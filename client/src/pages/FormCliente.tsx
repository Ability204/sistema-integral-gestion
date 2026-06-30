import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Props {
  id?: string | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

type Errores = Record<string, string[]>;

const vacio = {
  tipoPersona: "MORAL", tipoRelacion: "CLIENTE", rfc: "", razonSocial: "",
  nombre: "", apellidoPaterno: "", apellidoMaterno: "", correo: "",
  telefono1: "", telefono2: "", direccion: "", colonia: "",
  codigoPostal: "", ciudad: "", estado: "",
};

export function FormCliente({ id, onCerrar, onGuardado }: Props) {
  const [f, setF] = useState({ ...vacio });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const edicion = Boolean(id);
  const esFisica = f.tipoPersona === "FISICA";

  useEffect(() => {
    if (!id) return;
    api.get(`/clientes/${id}`).then((r) => {
      const c = r.data;
      setF({
        ...vacio, ...c,
        nombre: c.nombre ?? "", apellidoPaterno: c.apellidoPaterno ?? "",
        apellidoMaterno: c.apellidoMaterno ?? "", telefono2: c.telefono2 ?? "",
      });
    });
  }, [id]);

  function set(campo: string, valor: string) {
    setF((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setErrorGeneral("");
    setCargando(true);
    try {
      if (edicion) await api.put(`/clientes/${id}`, f);
      else await api.post("/clientes", f);
      onGuardado();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errores) setErrores(data.errores);
      else setErrorGeneral(data?.error ?? "No se pudo guardar");
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
          <h3 className="text-lg font-bold text-slate-800">{edicion ? "Editar cliente" : "Nuevo cliente"}</h3>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onCerrar}>✕</button>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Identificación</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Tipo de persona</label>
              <select className="input" value={f.tipoPersona} onChange={(e) => set("tipoPersona", e.target.value)}>
                <option value="MORAL">Persona moral</option>
                <option value="FISICA">Persona física</option>
              </select>
            </div>
            <div>
              <label className="label">Relación</label>
              <select className="input" value={f.tipoRelacion} onChange={(e) => set("tipoRelacion", e.target.value)}>
                <option value="CLIENTE">Cliente</option>
                <option value="PROVEEDOR">Proveedor</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </div>
            <div>
              <label className="label">RFC ({esFisica ? "13" : "12"} caracteres)</label>
              <input className="input uppercase" value={f.rfc} onChange={(e) => set("rfc", e.target.value.toUpperCase())} maxLength={13} />
              <E campo="rfc" />
            </div>
          </div>
          <div>
            <label className="label">{esFisica ? "Nombre comercial / Razón social" : "Razón social"}</label>
            <input className="input" value={f.razonSocial} onChange={(e) => set("razonSocial", e.target.value)} />
            <E campo="razonSocial" />
          </div>
          {esFisica && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Nombre(s)</label>
                <input className="input" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} />
              </div>
              <div>
                <label className="label">Apellido paterno</label>
                <input className="input" value={f.apellidoPaterno} onChange={(e) => set("apellidoPaterno", e.target.value)} />
              </div>
              <div>
                <label className="label">Apellido materno</label>
                <input className="input" value={f.apellidoMaterno} onChange={(e) => set("apellidoMaterno", e.target.value)} />
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Contacto</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Correo electrónico</label>
              <input className="input" value={f.correo} onChange={(e) => set("correo", e.target.value)} />
              <E campo="correo" />
            </div>
            <div>
              <label className="label">Teléfono 1</label>
              <input className="input" value={f.telefono1} onChange={(e) => set("telefono1", e.target.value)} maxLength={10} />
              <E campo="telefono1" />
            </div>
            <div>
              <label className="label">Teléfono 2</label>
              <input className="input" value={f.telefono2} onChange={(e) => set("telefono2", e.target.value)} maxLength={10} />
              <E campo="telefono2" />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Domicilio fiscal</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input className="input" value={f.direccion} onChange={(e) => set("direccion", e.target.value)} />
              <E campo="direccion" />
            </div>
            <div>
              <label className="label">Colonia</label>
              <input className="input" value={f.colonia} onChange={(e) => set("colonia", e.target.value)} />
              <E campo="colonia" />
            </div>
            <div>
              <label className="label">Código postal</label>
              <input className="input" value={f.codigoPostal} onChange={(e) => set("codigoPostal", e.target.value)} maxLength={5} />
              <E campo="codigoPostal" />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input className="input" value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
              <E campo="ciudad" />
            </div>
            <div>
              <label className="label">Estado</label>
              <input className="input" value={f.estado} onChange={(e) => set("estado", e.target.value)} />
              <E campo="estado" />
            </div>
          </div>
        </fieldset>

        {errorGeneral && <p className="error-text">{errorGeneral}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={cargando}>Cancelar</button>
          <button className="btn-primary" disabled={cargando}>{cargando ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}
