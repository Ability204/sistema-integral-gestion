import { z } from "zod";
import {
  CURP_REGEX,
  CP_REGEX,
  TEL_REGEX,
  NSS_REGEX,
  passwordSchema,
} from "../lib/validaciones.js";

export const rolEnum = z.enum(["ADMIN", "SUPERVISOR", "USUARIO"]);

// Esquema de alta de usuario (incluye contraseña + confirmación).
export const crearUsuarioSchema = z
  .object({
    username: z.string().min(3, "Mínimo 3 caracteres").max(30),
    password: passwordSchema,
    confirmarPassword: z.string(),
    rol: rolEnum.default("USUARIO"),

    nombre: z.string().min(1, "Requerido"),
    apellidoPaterno: z.string().min(1, "Requerido"),
    apellidoMaterno: z.string().min(1, "Requerido"),
    curp: z
      .string()
      .transform((s) => s.toUpperCase().trim())
      .refine((s) => CURP_REGEX.test(s), "CURP inválida"),
    correo: z.string().email("Correo inválido"),
    telefono1: z.string().regex(TEL_REGEX, "Debe tener 10 dígitos"),
    telefono2: z.string().regex(TEL_REGEX, "Debe tener 10 dígitos").optional().or(z.literal("")),

    fechaContratacion: z.coerce.date(),
    areaContratacion: z.string().min(1, "Requerido"),

    numeroSeguroSocial: z.string().regex(NSS_REGEX, "El NSS debe tener 11 dígitos"),
    fechaAltaSalud: z.coerce.date(),

    direccion: z.string().min(1, "Requerido"),
    colonia: z.string().min(1, "Requerido"),
    codigoPostal: z.string().regex(CP_REGEX, "El CP debe tener 5 dígitos"),
    ciudad: z.string().min(1, "Requerido"),
    estado: z.string().min(1, "Requerido"),
  })
  .refine((d) => d.password === d.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

// En edición la contraseña es opcional.
export const actualizarUsuarioSchema = z
  .object({
    username: z.string().min(3).max(30).optional(),
    password: passwordSchema.optional(),
    confirmarPassword: z.string().optional(),
    rol: rolEnum.optional(),
    nombre: z.string().min(1).optional(),
    apellidoPaterno: z.string().min(1).optional(),
    apellidoMaterno: z.string().min(1).optional(),
    curp: z
      .string()
      .transform((s) => s.toUpperCase().trim())
      .refine((s) => CURP_REGEX.test(s), "CURP inválida")
      .optional(),
    correo: z.string().email().optional(),
    telefono1: z.string().regex(TEL_REGEX).optional(),
    telefono2: z.string().regex(TEL_REGEX).optional().or(z.literal("")),
    fechaContratacion: z.coerce.date().optional(),
    areaContratacion: z.string().min(1).optional(),
    numeroSeguroSocial: z.string().regex(NSS_REGEX).optional(),
    fechaAltaSalud: z.coerce.date().optional(),
    direccion: z.string().min(1).optional(),
    colonia: z.string().min(1).optional(),
    codigoPostal: z.string().regex(CP_REGEX).optional(),
    ciudad: z.string().min(1).optional(),
    estado: z.string().min(1).optional(),
  })
  .refine(
    (d) => !d.password || d.password === d.confirmarPassword,
    { message: "Las contraseñas no coinciden", path: ["confirmarPassword"] },
  );

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
