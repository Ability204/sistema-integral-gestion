import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/autenticar.js";
import { guardarProyectoSchema } from "../schemas/proyecto.schema.js";
import { generarReportePDF } from "../lib/pdf.js";

export const proyectosRouter = Router();
proyectosRouter.use(autenticar);

const incluirMiembros = {
  miembros: {
    include: {
      user: { select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true } },
    },
  },
} satisfies Prisma.ProjectInclude;

function construirFiltro(q: Record<string, unknown>): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {};
  const and: Prisma.ProjectWhereInput[] = [];
  if (typeof q.buscar === "string" && q.buscar.trim()) {
    and.push({
      OR: [
        { nombre: { contains: q.buscar.trim() } },
        { objetivos: { contains: q.buscar.trim() } },
      ],
    });
  }
  if (typeof q.estado === "string" && q.estado) and.push({ estado: q.estado });
  if (and.length) where.AND = and;
  return where;
}

// GET /api/proyectos — listado con filtros.
proyectosRouter.get("/", async (req, res) => {
  const proyectos = await prisma.project.findMany({
    where: construirFiltro(req.query),
    include: incluirMiembros,
    orderBy: { createdAt: "desc" },
  });
  res.json(proyectos);
});

// GET /api/proyectos/reporte.pdf — exporta el listado a PDF.
proyectosRouter.get("/reporte.pdf", async (req, res) => {
  const proyectos = await prisma.project.findMany({
    where: construirFiltro(req.query),
    include: incluirMiembros,
    orderBy: { createdAt: "desc" },
  });

  const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  generarReportePDF({
    titulo: "Reporte de Proyectos",
    subtitulo: "Planeación y equipos de trabajo",
    res,
    nombreArchivo: "reporte-proyectos.pdf",
    columnas: [
      { encabezado: "Proyecto", ancho: 2.6 },
      { encabezado: "Estado", ancho: 1.6 },
      { encabezado: "Objetivos", ancho: 3 },
      { encabezado: "Integrantes", ancho: 1.3 },
      { encabezado: "Costo nómina", ancho: 1.8 },
      { encabezado: "Presupuesto", ancho: 1.8 },
    ],
    filas: proyectos.map((p) => {
      const costo = p.miembros.reduce((s, m) => s + m.salario, 0);
      return [
        p.nombre,
        p.estado,
        p.objetivos ?? "",
        String(p.miembros.length),
        money(costo),
        money(p.presupuesto),
      ];
    }),
  });
});

// GET /api/proyectos/:id — detalle.
proyectosRouter.get("/:id", async (req, res) => {
  const proyecto = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: incluirMiembros,
  });
  if (!proyecto) return res.status(404).json({ error: "Proyecto no encontrado" });
  res.json(proyecto);
});

// Reemplaza los miembros del proyecto dentro de una transacción.
async function sincronizarMiembros(projectId: string, miembros: { userId: string; rolProyecto: string; salario: number }[]) {
  await prisma.projectMember.deleteMany({ where: { projectId } });
  if (miembros.length) {
    await prisma.projectMember.createMany({
      data: miembros.map((m) => ({ projectId, userId: m.userId, rolProyecto: m.rolProyecto, salario: m.salario })),
    });
  }
}

// POST /api/proyectos — crear.
proyectosRouter.post("/", async (req, res) => {
  const parsed = guardarProyectoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  const { miembros, ...d } = parsed.data;

  const proyecto = await prisma.project.create({
    data: {
      nombre: d.nombre,
      proyeccion: d.proyeccion || null,
      objetivos: d.objetivos || null,
      metas: d.metas || null,
      estado: d.estado,
      presupuesto: d.presupuesto,
      fechaInicio: d.fechaInicio ?? null,
      fechaFin: d.fechaFin ?? null,
    },
  });
  await sincronizarMiembros(proyecto.id, miembros);

  const completo = await prisma.project.findUnique({ where: { id: proyecto.id }, include: incluirMiembros });
  res.status(201).json(completo);
});

// PUT /api/proyectos/:id — editar.
proyectosRouter.put("/:id", async (req, res) => {
  const parsed = guardarProyectoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  const { miembros, ...d } = parsed.data;

  try {
    await prisma.project.update({
      where: { id: req.params.id },
      data: {
        nombre: d.nombre,
        proyeccion: d.proyeccion || null,
        objetivos: d.objetivos || null,
        metas: d.metas || null,
        estado: d.estado,
        presupuesto: d.presupuesto,
        fechaInicio: d.fechaInicio ?? null,
        fechaFin: d.fechaFin ?? null,
      },
    });
    await sincronizarMiembros(req.params.id, miembros);
    const completo = await prisma.project.findUnique({ where: { id: req.params.id }, include: incluirMiembros });
    res.json(completo);
  } catch {
    res.status(404).json({ error: "Proyecto no encontrado" });
  }
});

// DELETE /api/proyectos/:id — eliminar.
proyectosRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Proyecto no encontrado" });
  }
});
