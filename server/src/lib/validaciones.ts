import { z } from "zod";

// --- Expresiones regulares oficiales mexicanas ---

// CURP: 18 caracteres. 4 letras + 6 dígitos (fecha) + H/M + 5 letras + alfanumérico + dígito.
export const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;

// RFC persona física: 4 letras + 6 dígitos (fecha) + 3 alfanuméricos (homoclave).
export const RFC_FISICA_REGEX =
  /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/;

// RFC persona moral: 3 letras + 6 dígitos (fecha) + 3 alfanuméricos.
export const RFC_MORAL_REGEX =
  /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/;

// Código postal mexicano: 5 dígitos.
export const CP_REGEX = /^\d{5}$/;

// Teléfono: 10 dígitos.
export const TEL_REGEX = /^\d{10}$/;

// NSS (IMSS): 11 dígitos.
export const NSS_REGEX = /^\d{11}$/;

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/\d/, "Debe incluir al menos un número");
