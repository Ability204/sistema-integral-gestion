import { z } from "zod";

export const estadoEnum = z.enum(["PLANEACION", "EN_PROGRESO", "COMPLETADO", "CANCELADO"]);

const miembroSchema = z.object({
  userId: z.string().min(1),
  rolProyecto: z.string().min(1, "Indica el rol"),
  salario: z.coerce.number().nonnegative().default(0),
});

export const guardarProyectoSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  proyeccion: z.string().optional().or(z.literal("")),
  objetivos: z.string().optional().or(z.literal("")),
  metas: z.string().optional().or(z.literal("")),
  estado: estadoEnum.default("PLANEACION"),
  presupuesto: z.coerce.number().nonnegative().default(0),
  fechaInicio: z.coerce.date().optional().nullable(),
  fechaFin: z.coerce.date().optional().nullable(),
  miembros: z.array(miembroSchema).default([]),
});

export type GuardarProyectoInput = z.infer<typeof guardarProyectoSchema>;
