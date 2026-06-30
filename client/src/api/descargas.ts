import { api } from "./client";

// Descarga un PDF (u otro binario) que requiere el token de autenticación.
export async function descargarPDF(ruta: string, nombreArchivo: string) {
  const { data } = await api.get(ruta, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
