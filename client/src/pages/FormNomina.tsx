import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Props {
  onCerrar: () => void;
  onGuardado: () => void;
}

interface Empleado {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

interface Calculo {
  totalPercepciones: number;
  isr: number;
  subsidio: number;
  seguridadSocial: number;
  otrasDeducciones: number;
  totalDeducciones: number;
  neto: number;
}

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const ahora = new Date();

export function FormNomina({ onCerrar, onGuardado }: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [f, setF] = useState({
    userId: "",
    anio: ahora.getFullYear(),
    mes: ahora.getMonth() + 1,
    tipoSeguridad: "IMSS",
    sueldoBase: "",
    otrasPercepciones: "",
    otrasDeducciones: "",
  });
  const [calc, setCalc] = useState<Calculo | null>(null);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get("/usuarios").then((r) => setEmpleados(r.data));
  }, []);

  // Recalcula el desglose en vivo cada vez que cambian los importes.
  useEffect(() => {
    const sueldo = Number(f.sueldoBase) || 0;
    if (sueldo <= 0) {
      setCalc(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .post("/nominas/calcular", {
          sueldoBase: sueldo,
          otrasPercepciones: Number(f.otrasPercepciones) || 0,
          otrasDeducciones: Number(f.otrasDeducciones) || 0,
          tipoSeguridad: f.tipoSeguridad,
        })
        .then((r) => setCalc(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [f.sueldoBase, f.otrasPercepciones, f.otrasDeducciones, f.tipoSeguridad]);

  function set(campo: string, valor: string | number) {
    setF((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setCargando(true);
    try {
      await api.post("/nominas", {
        ...f,
        sueldoBase: Number(f.sueldoBase) || 0,
        otrasPercepciones: Number(f.otrasPercepciones) || 0,
        otrasDeducciones: Number(f.otrasDeducciones) || 0,
      });
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
          <h3 className="text-lg font-bold text-slate-800">Generar nómina</h3>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onCerrar}>✕</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Empleado</label>
            <select className="input" value={f.userId} onChange={(e) => set("userId", e.target.value)}>
              <option value="">Selecciona…</option>
              {empleados.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.apellidoPaterno} {u.apellidoMaterno} {u.nombre}
                </option>
              ))}
            </select>
            <E campo="userId" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Mes</label>
              <select className="input" value={f.mes} onChange={(e) => set("mes", Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Año</label>
              <input className="input" type="number" value={f.anio} onChange={(e) => set("anio", Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Seg. Social</label>
              <select className="input" value={f.tipoSeguridad} onChange={(e) => set("tipoSeguridad", e.target.value)}>
                <option value="IMSS">IMSS</option>
                <option value="ISSSTE">ISSSTE</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Sueldo base (mensual)</label>
            <input className="input" type="number" step="0.01" value={f.sueldoBase} onChange={(e) => set("sueldoBase", e.target.value)} placeholder="0.00" />
            <E campo="sueldoBase" />
          </div>
          <div>
            <label className="label">Otras percepciones</label>
            <input className="input" type="number" step="0.01" value={f.otrasPercepciones} onChange={(e) => set("otrasPercepciones", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Otras deducciones</label>
            <input className="input" type="number" step="0.01" value={f.otrasDeducciones} onChange={(e) => set("otrasDeducciones", e.target.value)} placeholder="0.00" />
          </div>
        </div>

        {/* Desglose del cálculo en vivo */}
        {calc && (
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <h4 className="mb-2 text-sm font-semibold text-slate-600">Desglose calculado</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-500">Total percepciones</span>
              <span className="text-right font-medium">{money(calc.totalPercepciones)}</span>
              <span className="text-slate-500">ISR {calc.subsidio > 0 && `(subsidio ${money(calc.subsidio)})`}</span>
              <span className="text-right text-red-600">- {money(calc.isr)}</span>
              <span className="text-slate-500">Seguridad social ({f.tipoSeguridad})</span>
              <span className="text-right text-red-600">- {money(calc.seguridadSocial)}</span>
              <span className="text-slate-500">Otras deducciones</span>
              <span className="text-right text-red-600">- {money(calc.otrasDeducciones)}</span>
              <span className="col-span-2 my-1 border-t border-slate-200" />
              <span className="font-bold text-slate-700">NETO A PAGAR</span>
              <span className="text-right text-lg font-bold text-green-600">{money(calc.neto)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={cargando}>Cancelar</button>
          <button className="btn-primary" disabled={cargando}>{cargando ? "Guardando…" : "Generar nómina"}</button>
        </div>
      </form>
    </div>
  );
}
