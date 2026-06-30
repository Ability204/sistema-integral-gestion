import { useEffect, useState } from "react";
import { api } from "../api/client";
import { FormNomina } from "./FormNomina";
import { Toast } from "../components/Toast";
import { descargarPDF } from "../api/descargas";

interface Nomina {
  id: string;
  anio: number;
  mes: number;
  tipoSeguridad: string;
  totalPercepciones: number;
  isr: number;
  seguridadSocial: number;
  totalDeducciones: number;
  neto: number;
  user: { nombre: string; apellidoPaterno: string; apellidoMaterno: string };
}

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export function NominasPage() {
  const [datos, setDatos] = useState<Nomina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(false);
  const [aviso, setAviso] = useState("");

  async function cargar() {
    setCargando(true);
    const { data } = await api.get("/nominas");
    setDatos(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta nómina?")) return;
    await api.delete(`/nominas/${id}`);
    cargar();
    setAviso("Nómina eliminada");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nóminas</h1>
          <p className="text-sm text-slate-500">Recibos con cálculo de ISR e IMSS/ISSSTE</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => descargarPDF("/nominas/reporte.pdf", "reporte-nominas.pdf")}>
            ⬇ Exportar PDF
          </button>
          <button className="btn-primary" onClick={() => setForm(true)}>+ Generar nómina</button>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3">Seg. Social</th>
              <th className="px-4 py-3 text-right">Percepciones</th>
              <th className="px-4 py-3 text-right">ISR</th>
              <th className="px-4 py-3 text-right">Deducciones</th>
              <th className="px-4 py-3 text-right">Neto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>
            ) : datos.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Aún no hay nóminas generadas</td></tr>
            ) : (
              datos.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{n.user.apellidoPaterno} {n.user.apellidoMaterno} {n.user.nombre}</td>
                  <td className="px-4 py-3">{MESES[n.mes]} {n.anio}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-medium text-marca-700">{n.tipoSeguridad}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{money(n.totalPercepciones)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{money(n.isr)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{money(n.totalDeducciones)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{money(n.neto)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-marca-600 hover:underline" onClick={() => descargarPDF(`/nominas/${n.id}/recibo.pdf`, "recibo.pdf")}>Recibo</button>
                    <button className="ml-3 text-red-600 hover:underline" onClick={() => eliminar(n.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <FormNomina
          onCerrar={() => setForm(false)}
          onGuardado={() => { setForm(false); cargar(); setAviso("Nómina generada con éxito"); }}
        />
      )}
      {aviso && <Toast mensaje={aviso} onCerrar={() => setAviso("")} />}
    </div>
  );
}
