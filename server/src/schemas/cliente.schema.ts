import { z } from "zod";
import {
  RFC_FISICA_REGEX,
  RFC_MORAL_REGEX,
  CP_REGEX,
  TEL_REGEX,
} from "../lib/validaciones.js";

export const tipoPersonaEnum = z.enum(["FISICA", "MORAL"]);
export const tipoRelacionEnum = z.enum(["CLIENTE", "PROVEEDOR", "AMBOS"]);

const base = {
  tipoRelacion: tipoRelacionEnum.default("CLIENTE"),
  razonSocial: z.string().min(1, "Requerido"),
  correo: z.string().email("Correo inválido"),
  telefono1: z.string().regex(TEL_REGEX, "Debe tener 10 dígitos"),
  telefono2: z.string().regex(TEL_REGEX, "Debe tener 10 dígitos").optional().or(z.literal("")),
  direccion: z.string().min(1, "Requerido"),
  colonia: z.string().min(1, "Requerido"),
  codigoPostal: z.string().regex(CP_REGEX, "El CP debe tener 5 dígitos"),
  ciudad: z.string().min(1, "Requerido"),
  estado: z.string().min(1, "Requerido"),
  nombre: z.string().optional(),
  apellidoPaterno: z.string().optional(),
  apellidoMaterno: z.string().optional(),
};

// El RFC se valida según el tipo de persona (12 = moral, 13 = física).
function validarRfc(d: { tipoPersona: string; rfc: string }, ctx: z.RefinementCtx) {
  const rfc = d.rfc.toUpperCase().trim();
  const ok =
    d.tipoPersona === "MORAL" ? RFC_MORAL_REGEX.test(rfc) : RFC_FISICA_REGEX.test(rfc);
  if (!ok) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rfc"],
      message:
        d.tipoPersona === "MORAL"
          ? "RFC de persona moral inválido (12 caracteres)"
          : "RFC de persona física inválido (13 caracteres)",
    });
  }
}

export const crearClienteSchema = z
  .object({
    tipoPersona: tipoPersonaEnum,
    rfc: z.string().transform((s) => s.toUpperCase().trim()),
    ...base,
  })
  .superRefine(validarRfc);

export const actualizarClienteSchema = z
  .object({
    tipoPersona: tipoPersonaEnum,
    rfc: z.string().transform((s) => s.toUpperCase().trim()),
    ...base,
  })
  .superRefine(validarRfc);

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
