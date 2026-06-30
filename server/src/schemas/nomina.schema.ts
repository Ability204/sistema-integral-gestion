import { z } from "zod";

export const crearNominaSchema = z.object({
  userId: z.string().min(1, "Selecciona un empleado"),
  anio: z.coerce.number().int().min(2000).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
  tipoSeguridad: z.enum(["IMSS", "ISSSTE"]),
  sueldoBase: z.coerce.number().nonnegative("Debe ser mayor o igual a 0"),
  otrasPercepciones: z.coerce.number().nonnegative().default(0),
  otrasDeducciones: z.coerce.number().nonnegative().default(0),
});

export type CrearNominaInput = z.infer<typeof crearNominaSchema>;
