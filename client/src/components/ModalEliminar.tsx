import { useState } from "react";
import { api } from "../api/client";

interface Props {
  recurso: "usuarios" | "clientes";
  id: string;
  descripcion: string; // texto que describe el registro a eliminar
  onCerrar: () => void;
  onEliminado: () => void;
}

// Modal que pide las credenciales de un supervisor para autorizar la eliminación.
export function ModalEliminar({ recurso, id, descripcion, onCerrar, onEliminado }: Props) {
  const [supervisorUsername, setSupervisorUsername] = useState("");
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setError("");
    setCargando(true);
    try {
      await api.delete(`/${recurso}/${id}`, {
        data: { supervisorUsername, supervisorPassword, motivo },
      });
      onEliminado();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "No se pudo eliminar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Eliminar registro</h3>
          <p className="mt-1 text-sm text-slate-500">
            Vas a eliminar: <b className="text-slate-700">{descripcion}</b>
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Esta acción requiere la <b>autorización de un supervisor o administrador</b>. Ingresa sus
          credenciales para continuar.
        </div>
        <div>
          <label className="label">Usuario del supervisor</label>
          <input className="input" value={supervisorUsername} onChange={(e) => setSupervisorUsername(e.target.value)} />
        </div>
        <div>
          <label className="label">Contraseña del supervisor</label>
          <input
            className="input"
            type="password"
            value={supervisorPassword}
            onChange={(e) => setSupervisorPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Motivo (opcional)</label>
          <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={confirmar} disabled={cargando}>
            {cargando ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
