import { jsPDF } from "jspdf";

const SKIP_KEY =
  /^_|url|photo|image|document|signature|password|token|base64|__v/i;
const MAX_PDF_COLUMNS = 9;

const humanize = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-IN");
  }
  return String(value);
};

// Keep only flat, human-readable fields; union of keys across all rows.
const normalizeRows = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const keys = [];
  list.forEach((row) =>
    Object.entries(row || {}).forEach(([key, value]) => {
      const flat = value === null || typeof value !== "object";
      const short = typeof value !== "string" || value.length <= 200;
      if (flat && short && !SKIP_KEY.test(key) && !keys.includes(key)) {
        keys.push(key);
      }
    }),
  );
  return {
    headers: keys.map(humanize),
    rows: list.map((row) => keys.map((key) => formatValue(row?.[key]))),
  };
};

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportRowsToExcel = (rows, filename = "export") => {
  const { headers, rows: body } = normalizeRows(rows);
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...body]
    .map((line) => line.map(escape).join(","))
    .join("\r\n");
  download(
    new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" }),
    `${filename}.csv`,
  );
};

export const exportRowsToPdf = (rows, title, filename = "export") => {
  const { headers: allHeaders, rows: allBody } = normalizeRows(rows);
  const headers = allHeaders.slice(0, MAX_PDF_COLUMNS);
  const body = allBody.map((line) => line.slice(0, MAX_PDF_COLUMNS));
  const doc = new jsPDF({ orientation: "landscape" });
  const left = 10;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const colW = (pageW - left * 2) / Math.max(headers.length, 1);
  const rowH = 7;
  const fit = (text, width) => {
    let t = String(text);
    while (t.length > 1 && doc.getTextWidth(t) > width - 2) t = t.slice(0, -2);
    return t === String(text) ? t : `${t}…`;
  };

  const drawHeader = (y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(238, 243, 248);
    doc.rect(left, y - 5, pageW - left * 2, rowH, "F");
    headers.forEach((h, i) => doc.text(fit(h, colW), left + i * colW + 1, y));
    doc.setFont("helvetica", "normal");
  };

  doc.setFontSize(14);
  doc.text(title, left, 12);
  doc.setFontSize(8);
  doc.text(`${body.length} records`, pageW - left, 12, { align: "right" });
  let y = 24;
  drawHeader(y);
  y += rowH;
  doc.setFontSize(8);
  body.forEach((line) => {
    if (y > pageH - 12) {
      doc.addPage();
      y = 14;
      drawHeader(y);
      y += rowH;
      doc.setFontSize(8);
    }
    line.forEach((cell, i) =>
      doc.text(fit(cell, colW), left + i * colW + 1, y),
    );
    y += rowH;
  });
  doc.save(`${filename}.pdf`);
};
