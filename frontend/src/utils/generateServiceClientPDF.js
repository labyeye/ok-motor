import { PDFDocument, rgb, degrees } from 'pdf-lib';

export async function generateServiceClientPDF(serviceBill) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const font = await pdfDoc.embedFont('Helvetica');
  const fontBold = await pdfDoc.embedFont('Helvetica-Bold');

  // Try to load logo from public folder
  let logoImage = null;
  try {
    const res = await fetch('/images/okmotorback.png');
    if (res.ok) {
      const bytes = await res.arrayBuffer();
      logoImage = await pdfDoc.embedPng(bytes);
    }
  } catch (e) {}

  if (logoImage) {
    page.drawImage(logoImage, { x: 50, y: 744, width: 160, height: 130 });
    page.drawImage(logoImage, { x: 300, y: 100, width: 500, height: 470, opacity: 0.25, rotate: degrees(45) });
  }

  page.drawText('VEHICLE SERVICE INVOICE', { x: 180, y: 758, size: 18, color: rgb(0.047, 0.098, 0.196), font: fontBold });

  page.drawText(`Customer: ${serviceBill.customerName || 'N/A'}`, { x: 60, y: 690, size: 10, color: rgb(0.2,0.2,0.2), font });
  page.drawText(`Phone: ${serviceBill.customerPhone || 'N/A'}`, { x: 350, y: 690, size: 10, color: rgb(0.2,0.2,0.2), font });

  // Items table (simple)
  let y = 620;
  page.drawText('Description', { x: 60, y, size: 10, font: fontBold });
  page.drawText('Qty', { x: 320, y, size: 10, font: fontBold });
  page.drawText('Rate', { x: 360, y, size: 10, font: fontBold });
  page.drawText('Amount', { x: 440, y, size: 10, font: fontBold });

  (serviceBill.serviceItems || []).forEach((it) => {
    y -= 18;
    page.drawText(it.description || '-', { x: 60, y, size: 10, font });
    page.drawText(String(it.quantity || 1), { x: 320, y, size: 10, font });
    page.drawText(String(it.rate || 0), { x: 360, y, size: 10, font });
    page.drawText(String(it.amount || 0), { x: 440, y, size: 10, font });
  });

  const total = Number(serviceBill.grandTotal || 0);
  page.drawText(`Total: Rs.${total.toFixed(2)}`, { x: 60, y: y - 30, size: 12, font: fontBold });

  const bytes = await pdfDoc.save();
  return bytes;
}
