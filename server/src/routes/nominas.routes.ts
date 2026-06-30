import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/autenticar.js";
import { crearNominaSchema } from "../schemas/nomina.schema.js";
import { calcularNomina } from "../lib/nomina.js";
import { generarReportePDF } from "../lib/pdf.js";

export const nominasRouter = Router();
nominasRouter.use(autenticar);

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const incluirEmpleado = {
  user: { select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true, curp: true } },
} satisfies Prisma.NominaInclude;

function construirFiltro(q: Record<string, unknown>): Prisma.NominaWhereInput {
  const where: Prisma.NominaWhereInput = {};
  if (typeof q.userId === "string" && q.userId) where.userId = q.userId;
  if (typeof q.anio === "string" && q.anio) where.anio = Number(q.anio);
  if (typeof q.mes === "string" && q.mes) where.mes = Number(q.mes);
  return where;
}

// Vista previa del cálculo (sin guardar) — útil para mostrar el desglose en vivo.
nominasRouter.post("/calcular", (req, res) => {
  const parsed = crearNominaSchema.partial({ anio: true, mes: true, userId: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  const d = parsed.data;
  res.json(
    calcularNomina({
      sueldoBase: d.sueldoBase ?? 0,
      otrasPercepciones: d.otrasPercepciones,
      otrasDeducciones: d.otrasDeducciones,
      tipoSeguridad: d.tipoSeguridad ?? "IMSS",
    }),
  );
});

// GET /api/nominas — listado con filtros.
nominasRouter.get("/", async (req, res) => {
  const nominas = await prisma.nomina.findMany({
    where: construirFiltro(req.query),
    include: incluirEmpleado,
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });
  res.json(nominas);
});

// GET /api/nominas/reporte.pdf — exporta el listado a PDF.
nominasRouter.get("/reporte.pdf", async (req, res) => {
  const nominas = await prisma.nomina.findMany({
    where: construirFiltro(req.query),
    include: incluirEmpleado,
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  generarReportePDF({
    titulo: "Reporte de Nóminas",
    subtitulo: "Recibos de nómina generados",
    res,
    nombreArchivo: "reporte-nominas.pdf",
    columnas: [
      { encabezado: "Empleado", ancho: 3 },
      { encabezado: "Periodo", ancho: 1.8 },
      { encabezado: "Seg. Social", ancho: 1.2 },
      { encabezado: "Percepciones", ancho: 1.8 },
      { encabezado: "ISR", ancho: 1.3 },
      { encabezado: "Seg.Soc.", ancho: 1.3 },
      { encabezado: "Deducciones", ancho: 1.8 },
      { encabezado: "Neto", ancho: 1.8 },
    ],
    filas: nominas.map((n) => [
      `${n.user.apellidoPaterno} ${n.user.apellidoMaterno} ${n.user.nombre}`,
      `${MESES[n.mes]} ${n.anio}`,
      n.tipoSeguridad,
      money(n.totalPercepciones),
      money(n.isr),
      money(n.seguridadSocial),
      money(n.totalDeducciones),
      money(n.neto),
    ]),
  });
});

// GET /api/nominas/:id/recibo.pdf — recibo individual.
nominasRouter.get("/:id/recibo.pdf", async (req, res) => {
  const n = await prisma.nomina.findUnique({ where: { id: req.params.id }, include: incluirEmpleado });
  if (!n) return res.status(404).json({ error: "Nómina no encontrada" });

  const money = (x: number) => `$${x.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  generarReportePDF({
    titulo: `Recibo de Nómina — ${MESES[n.mes]} ${n.anio}`,
    subtitulo: `Empleado: ${n.user.apellidoPaterno} ${n.user.apellidoMaterno} ${n.user.nombre}  ·  CURP: ${n.user.curp}  ·  ${n.tipoSeguridad}`,
    res,
    nombreArchivo: `recibo-${n.user.apellidoPaterno}-${MESES[n.mes]}.pdf`,
    columnas: [
      { encabezado: "Concepto", ancho: 3 },
      { encabezado: "Tipo", ancho: 1.5 },
      { encabezado: "Importe", ancho: 2 },
    ],
    filas: [
      ["Sueldo base", "Percepción", money(n.sueldoBase)],
      ["Otras percepciones", "Percepción", money(n.otrasPercepciones)],
      ["ISR", "Deducción", money(n.isr)],
      [`Seguridad social (${n.tipoSeguridad})`, "Deducción", money(n.seguridadSocial)],
      ["Otras deducciones", "Deducción", money(n.otrasDeducciones)],
      ["TOTAL PERCEPCIONES", "", money(n.totalPercepciones)],
      ["TOTAL DEDUCCIONES", "", money(n.totalDeducciones)],
      ["NETO A PAGAR", "", money(n.neto)],
    ],
  });
});

// POST /api/nominas — genera y guarda una nómina (calcula automáticamente).
nominasRouter.post("/", async (req, res) => {
  const parsed = crearNominaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  const d = parsed.data;

  const empleado = await prisma.user.findUnique({ where: { id: d.userId } });
  if (!empleado) return res.status(404).json({ errores: { userId: ["Empleado no encontrado"] } });

  const calc = calcularNomina({
    sueldoBase: d.sueldoBase,
    otrasPercepciones: d.otrasPercepciones,
    otrasDeducciones: d.otrasDeducciones,
    tipoSeguridad: d.tipoSeguridad,
  });

  const nomina = await prisma.nomina.create({
    data: {
      userId: d.userId,
      anio: d.anio,
      mes: d.mes,
      tipoSeguridad: d.tipoSeguridad,
      sueldoBase: d.sueldoBase,
      otrasPercepciones: d.otrasPercepciones,
      otrasDeducciones: d.otrasDeducciones,
      isr: calc.isr,
      seguridadSocial: calc.seguridadSocial,
      totalPercepciones: calc.totalPercepciones,
      totalDeducciones: calc.totalDeducciones,
      neto: calc.neto,
    },
    include: incluirEmpleado,
  });
  res.status(201).json(nomina);
});

// DELETE /api/nominas/:id — eliminar nómina.
nominasRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.nomina.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Nómina no encontrada" });
  }
});
