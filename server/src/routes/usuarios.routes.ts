import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verificarPassword } from "../lib/auth.js";
import { autenticar, requiereRol } from "../middleware/autenticar.js";
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
} from "../schemas/usuario.schema.js";
import { generarReportePDF } from "../lib/pdf.js";

export const usuariosRouter = Router();
usuariosRouter.use(autenticar); // todas las rutas requieren sesión

// No exponer nunca el hash de la contraseña.
const sinPassword = {
  id: true, username: true, rol: true, nombre: true, apellidoPaterno: true,
  apellidoMaterno: true, curp: true, correo: true, telefono1: true, telefono2: true,
  fechaContratacion: true, areaContratacion: true, numeroSeguroSocial: true,
  fechaAltaSalud: true, direccion: true, colonia: true, codigoPostal: true,
  ciudad: true, estado: true, activo: true, createdAt: true, updatedAt: true,
} satisfies Prisma.UserSelect;

// Construye el filtro de búsqueda a partir de los criterios de la query.
function construirFiltro(q: Record<string, unknown>): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { activo: true };
  const and: Prisma.UserWhereInput[] = [];

  // Búsqueda general (nombre, apellidos, curp, usuario, correo).
  if (typeof q.buscar === "string" && q.buscar.trim()) {
    const t = q.buscar.trim();
    and.push({
      OR: [
        { nombre: { contains: t } },
        { apellidoPaterno: { contains: t } },
        { apellidoMaterno: { contains: t } },
        { curp: { contains: t } },
        { username: { contains: t } },
        { correo: { contains: t } },
      ],
    });
  }
  // Criterios específicos.
  if (typeof q.area === "string" && q.area) and.push({ areaContratacion: q.area });
  if (typeof q.rol === "string" && q.rol) and.push({ rol: q.rol });
  if (typeof q.estado === "string" && q.estado) and.push({ estado: q.estado });
  if (typeof q.ciudad === "string" && q.ciudad) and.push({ ciudad: { contains: q.ciudad } });

  if (and.length) where.AND = and;
  return where;
}

// GET /api/usuarios — listado con criterios de consulta.
usuariosRouter.get("/", async (req, res) => {
  const where = construirFiltro(req.query);
  const usuarios = await prisma.user.findMany({
    where,
    select: sinPassword,
    orderBy: [{ apellidoPaterno: "asc" }, { apellidoMaterno: "asc" }],
  });
  res.json(usuarios);
});

// GET /api/usuarios/areas — lista de áreas para los filtros (criterios comunes).
usuariosRouter.get("/areas", async (_req, res) => {
  const filas = await prisma.user.findMany({
    where: { activo: true },
    distinct: ["areaContratacion"],
    select: { areaContratacion: true },
    orderBy: { areaContratacion: "asc" },
  });
  res.json(filas.map((f) => f.areaContratacion));
});

// GET /api/usuarios/reporte.pdf — exporta el listado filtrado a PDF.
usuariosRouter.get("/reporte.pdf", async (req, res) => {
  const where = construirFiltro(req.query);
  const usuarios = await prisma.user.findMany({
    where,
    orderBy: [{ apellidoPaterno: "asc" }],
  });

  const criterios = Object.entries(req.query)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("  ·  ");

  generarReportePDF({
    titulo: "Reporte de Usuarios / Empleados",
    subtitulo: criterios ? `Criterios — ${criterios}` : "Todos los usuarios activos",
    res,
    nombreArchivo: "reporte-usuarios.pdf",
    columnas: [
      { encabezado: "CURP", ancho: 2.2 },
      { encabezado: "Nombre completo", ancho: 3 },
      { encabezado: "Área", ancho: 1.6 },
      { encabezado: "Rol", ancho: 1.2 },
      { encabezado: "Correo", ancho: 2.6 },
      { encabezado: "Teléfono", ancho: 1.4 },
      { encabezado: "Ciudad", ancho: 1.6 },
      { encabezado: "Estado", ancho: 1.4 },
    ],
    filas: usuarios.map((u) => [
      u.curp,
      `${u.apellidoPaterno} ${u.apellidoMaterno} ${u.nombre}`,
      u.areaContratacion,
      u.rol,
      u.correo,
      u.telefono1,
      u.ciudad,
      u.estado,
    ]),
  });
});

// GET /api/usuarios/:id — detalle.
usuariosRouter.get("/:id", async (req, res) => {
  const usuario = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: sinPassword,
  });
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(usuario);
});

// POST /api/usuarios — alta de usuario.
usuariosRouter.post("/", async (req, res) => {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  // Unicidad de username y CURP.
  const dup = await prisma.user.findFirst({
    where: { OR: [{ username: d.username }, { curp: d.curp }] },
  });
  if (dup) {
    const campo = dup.username === d.username ? "username" : "curp";
    return res.status(409).json({ errores: { [campo]: ["Ya existe un usuario con este valor"] } });
  }

  const usuario = await prisma.user.create({
    data: {
      username: d.username,
      passwordHash: await hashPassword(d.password),
      rol: d.rol,
      nombre: d.nombre,
      apellidoPaterno: d.apellidoPaterno,
      apellidoMaterno: d.apellidoMaterno,
      curp: d.curp,
      correo: d.correo,
      telefono1: d.telefono1,
      telefono2: d.telefono2 || null,
      fechaContratacion: d.fechaContratacion,
      areaContratacion: d.areaContratacion,
      numeroSeguroSocial: d.numeroSeguroSocial,
      fechaAltaSalud: d.fechaAltaSalud,
      direccion: d.direccion,
      colonia: d.colonia,
      codigoPostal: d.codigoPostal,
      ciudad: d.ciudad,
      estado: d.estado,
    },
    select: sinPassword,
  });
  res.status(201).json(usuario);
});

// PUT /api/usuarios/:id — edición.
usuariosRouter.put("/:id", async (req, res) => {
  const parsed = actualizarUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errores: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;
  const { password, confirmarPassword, telefono2, ...resto } = d;

  const data: Prisma.UserUpdateInput = { ...resto };
  if (telefono2 !== undefined) data.telefono2 = telefono2 || null;
  if (password) data.passwordHash = await hashPassword(password);

  try {
    const usuario = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: sinPassword,
    });
    res.json(usuario);
  } catch {
    res.status(404).json({ error: "Usuario no encontrado" });
  }
});

// DELETE /api/usuarios/:id — eliminación CON autorización de un supervisor.
// El cuerpo debe incluir las credenciales de un SUPERVISOR o ADMIN.
usuariosRouter.delete("/:id", async (req, res) => {
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

  const objetivo = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!objetivo) return res.status(404).json({ error: "Usuario no encontrado" });

  // Borrado lógico + registro de auditoría.
  await prisma.$transaction([
    prisma.user.update({ where: { id: objetivo.id }, data: { activo: false } }),
    prisma.deletionLog.create({
      data: {
        entidad: "User",
        entidadId: objetivo.id,
        descripcion: `${objetivo.apellidoPaterno} ${objetivo.apellidoMaterno} ${objetivo.nombre} (${objetivo.curp})`,
        motivo: motivo || null,
        solicitadoPorId: req.usuario!.sub,
        autorizadoPorId: supervisor.id,
      },
    }),
  ]);

  res.json({ ok: true, mensaje: "Usuario eliminado con autorización del supervisor" });
});
