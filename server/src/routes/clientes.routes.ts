import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { verificarPassword } from "../lib/auth.js";
import { autenticar } from "../middleware/autenticar.js";
import {
  crearClienteSchema,
  actualizarClienteSchema,
} from "../schemas/cliente.schema.js";
import { generarReportePDF } from "../lib/pdf.js";

export const clientesRouter = Router();
clientesRouter.use(autenticar);

// Construye el filtro de búsqueda de clientes.
function construirFiltro(q: Record<string, unknown>): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = { activo: true };
  const and: Prisma.ClientWhereInput[] = [];

  if (typeof q.buscar === "string" && q.buscar.trim()) {
    const t = q.buscar.trim();
    and.push({
      OR: [
        { razonSocial: { contains: t } },
        { rfc: { contains: t } },
        { nombre: { contains: t } },
        { apellidoPaterno: { contains: t } },
        { correo: { contains: t } },
      ],
    });
  }
  if (typeof q.tipoPersona === "string" && q.tipoPersona) and.push({ tipoPersona: q.tipoPersona });
  if (typeof q.tipoRelacion === "string" && q.tipoRelacion) and.push({ tipoRelacion: q.tipoRelacion });
  if (typeof q.estado === "string" && q.estado) and.push({ estado: q.estado });
  if (typeof q.ciudad === "string" && q.ciudad) and.push({ ciudad: { contains: q.ciudad } });

  if (and.length) where.AND = and;
  return where;
}

// GET /api/clientes — listado con criterios.
clientesRouter.get("/", async (req, res) => {
  const clientes = await prisma.client.findMany({
    where: construirFiltro(req.query),
    orderBy: { razonSocial: "asc" },
  });
  res.json(clientes);
});

// GET /api/clientes/reporte.pdf — exporta el listado filtrado a PDF.
clientesRouter.get("/reporte.pdf", async (req, res) => {
  const clientes = await prisma.client.findMany({
    where: construirFiltro(req.query),
    orderBy: { razonSocial: "asc" },
  });

  const criterios = Object.entries(req.query)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("  ·  ");

  generarReportePDF({
    titulo: "Reporte de Clientes / Proveedores",
    subtitulo: criterios ? `Criterios — ${criterios}` : "Todos los clientes activos",
    res,
    nombreArchivo: "reporte-clientes.pdf",
    columnas: [
      { encabezado: "RFC", ancho: 2 },
      { encabezado: "Razón social / Nombre", ancho: 3.2 },
      { encabezado: "Tipo", ancho: 1.3 },
      { encabezado: "Relación", ancho: 1.4 },
      { encabezado: "Correo", ancho: 2.6 },
      { encabezado: "Teléfono", ancho: 1.4 },
      { encabezado: "Ciudad", ancho: 1.6 },
      { encabezado: "Estado", ancho: 1.4 },
    ],
    filas: clientes.map((c) => [
      c.rfc,
      c.razonSocial,
      c.tipoPersona,
      c.tipoRelacion,
      c.correo,
      c.telefono1,
      c.ciudad,
      c.estado,
    ]),
  });
});

// GET /api/clientes/:id — detalle.
clientesRouter.get("/:id", async (req, res) => {
  const cliente = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json(cliente);
});

// POST /api/clientes — alta.
clientesRouter.post("/", async (req, res) => {
  const parsed = crearClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  const dup = await prisma.client.findUnique({ where: { rfc: d.rfc } });
  if (dup) {
    return res.status(409).json({ errores: { rfc: ["Ya existe un cliente con este RFC"] } });
  }

  const cliente = await prisma.client.create({
    data: {
      tipoPersona: d.tipoPersona,
      tipoRelacion: d.tipoRelacion,
      rfc: d.rfc,
      razonSocial: d.razonSocial,
      nombre: d.nombre || null,
      apellidoPaterno: d.apellidoPaterno || null,
      apellidoMaterno: d.apellidoMaterno || null,
      correo: d.correo,
      telefono1: d.telefono1,
      telefono2: d.telefono2 || null,
      direccion: d.direccion,
      colonia: d.colonia,
      codigoPostal: d.codigoPostal,
      ciudad: d.ciudad,
      estado: d.estado,
    },
  });
  res.status(201).json(cliente);
});

// PUT /api/clientes/:id — edición.
clientesRouter.put("/:id", async (req, res) => {
  const parsed = actualizarClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;
  try {
    const cliente = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        tipoPersona: d.tipoPersona,
        tipoRelacion: d.tipoRelacion,
        rfc: d.rfc,
        razonSocial: d.razonSocial,
        nombre: d.nombre || null,
        apellidoPaterno: d.apellidoPaterno || null,
        apellidoMaterno: d.apellidoMaterno || null,
        correo: d.correo,
        telefono1: d.telefono1,
        telefono2: d.telefono2 || null,
        direccion: d.direccion,
        colonia: d.colonia,
        codigoPostal: d.codigoPostal,
        ciudad: d.ciudad,
        estado: d.estado,
      },
    });
    res.json(cliente);
  } catch {
    res.status(404).json({ error: "Cliente no encontrado" });
  }
});

// DELETE /api/clientes/:id — eliminación CON autorización de supervisor.
clientesRouter.delete("/:id", async (req, res) => {
  const { supervisorUsername, supervisorPassword, motivo } = req.body ?? {};
  if (!supervisorUsername || !supervisorPassword) {
    return res.status(400).json({ error: "Se requiere la autorización de un supervisor" });
  }

  const supervisor = await prisma.user.findUnique({ where: { username: supervisorUsername } });
  if (!supervisor || !["SUPERVISOR", "ADMIN"].includes(supervisor.rol)) {
    return res.status(403).json({ error: "El autorizador no es supervisor o administrador" });
  }
  const ok = await verificarPassword(supervisorPassword, supervisor.passwordHash);
  if (!ok) {
    return res.status(403).json({ error: "Credenciales de supervisor incorrectas" });
  }

  const objetivo = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!objetivo) return res.status(404).json({ error: "Cliente no encontrado" });

  await prisma.$transaction([
    prisma.client.update({ where: { id: objetivo.id }, data: { activo: false } }),
    prisma.deletionLog.create({
      data: {
        entidad: "Client",
        entidadId: objetivo.id,
        descripcion: `${objetivo.razonSocial} (${objetivo.rfc})`,
        motivo: motivo || null,
        solicitadoPorId: req.usuario!.sub,
        autorizadoPorId: supervisor.id,
      },
    }),
  ]);

  res.json({ ok: true, mensaje: "Cliente eliminado con autorización del supervisor" });
});
