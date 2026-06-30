// ---------------------------------------------------------------------------
// Cálculo de nómina mensual conforme a la legislación mexicana (simplificado).
//
// IMPORTANTE (para la defensa del proyecto): los valores de las tablas
// (ISR, subsidio, UMA, porcentajes IMSS/ISSSTE) son los vigentes de referencia
// y están centralizados aquí para poder actualizarlos cada año fácilmente.
// ---------------------------------------------------------------------------

// Valor de la UMA (Unidad de Medida y Actualización) diaria de referencia.
export const UMA_DIARIA = 108.57;

// --- Tarifa mensual del ISR (Art. 96 LISR) ---
// [límite inferior, cuota fija, % sobre excedente del límite inferior]
const TARIFA_ISR: { li: number; cuota: number; pct: number }[] = [
  { li: 0.01, cuota: 0.0, pct: 1.92 },
  { li: 746.05, cuota: 14.32, pct: 6.4 },
  { li: 6332.06, cuota: 371.83, pct: 10.88 },
  { li: 11128.02, cuota: 893.63, pct: 16.0 },
  { li: 12935.83, cuota: 1182.88, pct: 17.92 },
  { li: 15487.72, cuota: 1640.18, pct: 21.36 },
  { li: 31236.5, cuota: 5004.12, pct: 23.52 },
  { li: 49233.01, cuota: 9236.89, pct: 30.0 },
  { li: 93993.91, cuota: 22665.17, pct: 32.0 },
  { li: 125325.21, cuota: 32691.18, pct: 34.0 },
  { li: 375975.62, cuota: 117912.32, pct: 35.0 },
];

// --- Tabla del subsidio para el empleo (mensual) ---
// [límite superior de ingreso, subsidio correspondiente]
const TABLA_SUBSIDIO: { hasta: number; subsidio: number }[] = [
  { hasta: 1768.96, subsidio: 407.02 },
  { hasta: 2653.38, subsidio: 406.83 },
  { hasta: 3472.84, subsidio: 406.62 },
  { hasta: 3537.87, subsidio: 392.77 },
  { hasta: 4446.15, subsidio: 382.46 },
  { hasta: 4717.18, subsidio: 354.23 },
  { hasta: 5335.42, subsidio: 324.87 },
  { hasta: 6224.67, subsidio: 294.63 },
  { hasta: 7113.9, subsidio: 253.54 },
  { hasta: 7382.33, subsidio: 217.61 },
];

// Porcentajes de cuota OBRERA (lo que paga el trabajador) sobre el sueldo.
// IMSS: suma aproximada de las ramas a cargo del trabajador (~2.375%).
const PORC_IMSS_TRABAJADOR = 0.02375;
// ISSSTE: cuota del trabajador (~11.3% del sueldo básico).
const PORC_ISSSTE_TRABAJADOR = 0.113;

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

// Calcula el ISR mensual a partir del ingreso gravable.
export function calcularISR(ingresoMensual: number): number {
  let fila = TARIFA_ISR[0];
  for (const f of TARIFA_ISR) {
    if (ingresoMensual >= f.li) fila = f;
    else break;
  }
  const excedente = ingresoMensual - fila.li;
  const impuesto = fila.cuota + excedente * (fila.pct / 100);
  return Math.max(0, impuesto);
}

// Devuelve el subsidio para el empleo según el ingreso mensual.
export function calcularSubsidio(ingresoMensual: number): number {
  for (const f of TABLA_SUBSIDIO) {
    if (ingresoMensual <= f.hasta) return f.subsidio;
  }
  return 0; // ingresos altos no tienen subsidio
}

export interface ResultadoNomina {
  totalPercepciones: number;
  isr: number;
  subsidio: number;
  seguridadSocial: number;
  otrasDeducciones: number;
  totalDeducciones: number;
  neto: number;
}

interface EntradaNomina {
  sueldoBase: number;
  otrasPercepciones?: number;
  otrasDeducciones?: number;
  tipoSeguridad: "IMSS" | "ISSSTE";
}

// Calcula la nómina mensual completa de un empleado.
export function calcularNomina(e: EntradaNomina): ResultadoNomina {
  const otrasPercepciones = e.otrasPercepciones ?? 0;
  const otrasDeducciones = e.otrasDeducciones ?? 0;

  const totalPercepciones = e.sueldoBase + otrasPercepciones;

  // ISR neto = ISR causado - subsidio al empleo (no puede ser negativo).
  const isrCausado = calcularISR(totalPercepciones);
  const subsidio = calcularSubsidio(totalPercepciones);
  const isr = Math.max(0, isrCausado - subsidio);

  // Cuota de seguridad social a cargo del trabajador.
  const porcentaje =
    e.tipoSeguridad === "ISSSTE" ? PORC_ISSSTE_TRABAJADOR : PORC_IMSS_TRABAJADOR;
  const seguridadSocial = totalPercepciones * porcentaje;

  const totalDeducciones = isr + seguridadSocial + otrasDeducciones;
  const neto = totalPercepciones - totalDeducciones;

  return {
    totalPercepciones: redondear(totalPercepciones),
    isr: redondear(isr),
    subsidio: redondear(subsidio),
    seguridadSocial: redondear(seguridadSocial),
    otrasDeducciones: redondear(otrasDeducciones),
    totalDeducciones: redondear(totalDeducciones),
    neto: redondear(neto),
  };
}
