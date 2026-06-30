import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Props {
  id?: string | null; // si viene, es edición
  onCerrar: () => void;
  onGuardado: () => void;
}

type Errores = Record<string, string[]>;

const AREAS = ["Ventas", "Bodega", "Oficina", "Sistemas", "Recursos Humanos", "Contabilidad", "Dirección"];
const ROLES = ["USUARIO", "SUPERVISOR", "ADMIN"];

const vacio = {
  username: "", password: "", confirmarPassword: "", rol: "USUARIO",
  nombre: "", apellidoPaterno: "", apellidoMaterno: "", curp: "", correo: "",
  telefono1: "", telefono2: "", fechaContratacion: "", areaContratacion: "Ventas",
  numeroSeguroSocial: "", fechaAltaSalud: "", direccion: "", colonia: "",
  codigoPostal: "", ciudad: "", estado: "",
};

export function FormUsuario({ id, onCerrar, onGuardado }: Props) {
  const [f, setF] = useState({ ...vacio });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const edicion = Boolean(id);

  useEffect(() => {
    if (!id) return;
    api.get(`/usuarios/${id}`).then((r) => {
      const u = r.data;
      setF({
        ...vacio,
        ...u,
        password: "", confirmarPassword: "",
        telefono2: u.telefono2 ?? "",
        fechaContratacion: u.fechaContratacion?.slice(0, 10) ?? "",
        fechaAltaSalud: u.fechaAltaSalud?.slice(0, 10) ?? "",
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
      if (edicion) {
        const payload: any = { ...f };
        if (!payload.password) {
          delete payload.password;
          delete payload.confirmarPassword;
        }
        await api.put(`/usuarios/${id}`, payload);
      } else {
        await api.post("/usuarios", f);
      }
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
          <h3 className="text-lg font-bold text-slate-800">
            {edicion ? "Editar usuario" : "Nuevo usuario"}
          </h3>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onCerrar}>
            ✕
          </button>
        </div>

        {/* Acceso */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Datos de acceso</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Nombre de usuario</label>
              <input className="input" value={f.username} onChange={(e) => set("username", e.target.value)} />
              <E campo="username" />
            </div>
            <div>
              <label className="label">Contraseña {edicion && "(dejar en blanco para no cambiar)"}</label>
              <input className="input" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} />
              <E campo="password" />
            </div>
            <div>
              <label className="label">Confirmar contraseña</label>
              <input className="input" type="password" value={f.confirmarPassword} onChange={(e) => set("confirmarPassword", e.target.value)} />
              <E campo="confirmarPassword" />
            </div>
          </div>
          <div className="sm:w-1/3">
            <label className="label">Rol</label>
            <select className="input" value={f.rol} onChange={(e) => set("rol", e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </fieldset>

        {/* Datos personales */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Datos personales</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Nombre(s)</label>
              <input className="input" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} />
              <E campo="nombre" />
            </div>
            <div>
              <label className="label">Apellido paterno</label>
              <input className="input" value={f.apellidoPaterno} onChange={(e) => set("apellidoPaterno", e.target.value)} />
              <E campo="apellidoPaterno" />
            </div>
            <div>
              <label className="label">Apellido materno</label>
              <input className="input" value={f.apellidoMaterno} onChange={(e) => set("apellidoMaterno", e.target.value)} />
              <E campo="apellidoMaterno" />
            </div>
            <div>
              <label className="label">CURP</label>
              <input className="input uppercase" value={f.curp} onChange={(e) => set("curp", e.target.value.toUpperCase())} maxLength={18} />
              <E campo="curp" />
            </div>
            <div>
              <label className="label">Correo electrónico</label>
              <input className="input" value={f.correo} onChange={(e) => set("correo", e.target.value)} />
              <E campo="correo" />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
          </div>
        </fieldset>

        {/* Datos laborales y salud */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Datos laborales y de salud</legend>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Fecha de contratación</label>
              <input className="input" type="date" value={f.fechaContratacion} onChange={(e) => set("fechaContratacion", e.target.value)} />
              <E campo="fechaContratacion" />
            </div>
            <div>
              <label className="label">Área de contratación</label>
              <select className="input" value={f.areaContratacion} onChange={(e) => set("areaContratacion", e.target.value)}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <E campo="areaContratacion" />
            </div>
            <div>
              <label className="label">Núm. seguro social</label>
              <input className="input" value={f.numeroSeguroSocial} onChange={(e) => set("numeroSeguroSocial", e.target.value)} maxLength={11} />
              <E campo="numeroSeguroSocial" />
            </div>
            <div>
              <label className="label">Fecha alta a salud</label>
              <input className="input" type="date" value={f.fechaAltaSalud} onChange={(e) => set("fechaAltaSalud", e.target.value)} />
              <E campo="fechaAltaSalud" />
            </div>
          </div>
        </fieldset>

        {/* Domicilio */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-marca-700">Domicilio</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Dirección (calle y número)</label>
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
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </button>
          <button className="btn-primary" disabled={cargando}>
            {cargando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
