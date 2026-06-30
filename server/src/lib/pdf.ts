import PDFDocument from "pdfkit";
import type { Response } from "express";

export interface ColumnaPDF {
  encabezado: string;
  ancho: number; // ancho relativo de la columna
}

interface ReportePDFOpts {
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaPDF[];
  filas: string[][];
  res: Response;
  nombreArchivo: string;
}

// Genera un PDF de listado/reporte en formato tabla y lo envía al cliente.
export function generarReportePDF({
  titulo,
  subtitulo,
  columnas,
  filas,
  res,
  nombreArchivo,
}: ReportePDFOpts) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);
  doc.pipe(res);

  // --- Encabezado del documento ---
  doc.fontSize(18).fillColor("#1e293b").text("Sistema Integral de Gestión", { align: "left" });
  doc.moveDown(0.2);
  doc.fontSize(14).fillColor("#334155").text(titulo);
  if (subtitulo) {
    doc.fontSize(9).fillColor("#64748b").text(subtitulo);
  }
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(`Generado: ${new Date().toLocaleString("es-MX")}  ·  Registros: ${filas.length}`);
  doc.moveDown(0.5);

  // --- Geometría de la tabla ---
  const margenIzq = doc.page.margins.left;
  const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalPeso = columnas.reduce((s, c) => s + c.ancho, 0);
  const anchos = columnas.map((c) => (c.ancho / totalPeso) * anchoUtil);

  const alturaFila = 18;
  let y = doc.y;

  const dibujarEncabezados = () => {
    doc.rect(margenIzq, y, anchoUtil, alturaFila).fill("#1e293b");
    doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
    let x = margenIzq;
    columnas.forEach((col, i) => {
      doc.text(col.encabezado, x + 3, y + 5, { width: anchos[i] - 6, ellipsis: true });
      x += anchos[i];
    });
    y += alturaFila;
    doc.font("Helvetica");
  };

  dibujarEncabezados();

  // --- Filas ---
  filas.forEach((fila, idx) => {
    if (y + alturaFila > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      dibujarEncabezados();
    }
    if (idx % 2 === 0) {
      doc.rect(margenIzq, y, anchoUtil, alturaFila).fill("#f1f5f9");
    }
    doc.fillColor("#0f172a").fontSize(8);
    let x = margenIzq;
    fila.forEach((celda, i) => {
      doc.text(celda ?? "", x + 3, y + 5, { width: anchos[i] - 6, ellipsis: true });
      x += anchos[i];
    });
    y += alturaFila;
  });

  if (filas.length === 0) {
    doc.fillColor("#64748b").fontSize(10).text("Sin registros para los criterios seleccionados.", margenIzq, y + 10);
  }

  doc.end();
}
