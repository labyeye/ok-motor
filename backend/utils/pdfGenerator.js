// utils/pdfGenerator.js
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

exports.generateServiceBillPDF = async (serviceBill, returnBuffer = false) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    page.drawText("OK MOTORS", {
      x: 50,
      y: 750,
      size: 24,
      font: fontBold,
      color: rgb(0, 0, 0.8),
    });
    page.drawText("UDAYAM-BR-26-0028550", {
      x: 52,
      y: 730, 
      size: 14,
      font: fontBold,
    });
    if (serviceBill.taxEnabled) {
      page.drawText("Business Information:", {
        x: 350,
        y: 670, 
        size: 14,
        font: fontBold,
      });
      page.drawText(`Name: ${serviceBill.businessName || "N/A"}`, {
        x: 350,
        y: 650,
        size: 12,
        font,
      });
      page.drawText(`GSTIN: ${serviceBill.businessGSTIN || "N/A"}`, {
        x: 350,
        y: 630,
        size: 12,
        font,
      });
      page.drawText(`Address: ${serviceBill.businessAddress || "N/A"}`, {
        x: 350,
        y: 610,
        size: 12,
        font,
      });
    }
    page.drawText(`Bill No: ${serviceBill.billNumber}`, {
      x: 52,
      y: 710,
      size: 12,
      font,
    });
    page.drawText(
      `Date: ${new Date(serviceBill.createdAt).toLocaleDateString()}`,
      {
        x: 400,
        y: 720,
        size: 12,
        font,
      }
    );

    page.drawText("Customer Information:", {
      x: 50,
      y: 670,
      size: 14,
      font: fontBold,
    });
    page.drawText(`Name: ${serviceBill.customerName}`, {
      x: 50,
      y: 650,
      size: 12,
      font,
    });
    page.drawText(`Phone: ${serviceBill.customerPhone}`, {
      x: 50,
      y: 630,
      size: 12,
      font,
    });
    page.drawText(`Address: ${serviceBill.customerAddress}`, {
      x: 50,
      y: 610,
      size: 12,
      font,
    });

    page.drawText("Vehicle Information:", {
      x: 50,
      y: 580,
      size: 14,
      font: fontBold,
    });
    page.drawText(`Type: ${serviceBill.vehicleType.toUpperCase()}`, {
      x: 50,
      y: 560,
      size: 12,
      font,
    });
    page.drawText(`Brand: ${serviceBill.vehicleBrand}`, {
      x: 200,
      y: 560,
      size: 12,
      font,
    });
    page.drawText(`Model: ${serviceBill.vehicleModel}`, {
      x: 350,
      y: 560,
      size: 12,
      font,
    });
    page.drawText(`Reg No: ${serviceBill.registrationNumber}`, {
      x: 50,
      y: 540,
      size: 12,
      font,
    });
    page.drawText(`KM Reading: ${serviceBill.kmReading}`, {
      x: 200,
      y: 540,
      size: 12,
      font,
    });

    page.drawText("Service Items:", {
      x: 50,
      y: 470,
      size: 14,
      font: fontBold,
    });

    page.drawText("SN", { x: 50, y: 450, size: 12, font: fontBold });
    page.drawText("Description", { x: 80, y: 450, size: 12, font: fontBold });
    page.drawText("Qty", { x: 300, y: 450, size: 12, font: fontBold });
    page.drawText("Rate (Rs.)", { x: 350, y: 450, size: 12, font: fontBold });
    page.drawText("Amount (Rs.)", { x: 450, y: 450, size: 12, font: fontBold });

    let yPos = 430;
    serviceBill.serviceItems.forEach((item, index) => {
      page.drawText((index + 1).toString(), { x: 50, y: yPos, size: 10, font });
      page.drawText(item.description, { x: 80, y: yPos, size: 10, font });
      page.drawText(item.quantity.toString(), {
        x: 300,
        y: yPos,
        size: 10,
        font,
      });
      page.drawText(item.rate.toFixed(2), { x: 350, y: yPos, size: 10, font });
      page.drawText(item.amount.toFixed(2), {
        x: 450,
        y: yPos,
        size: 10,
        font,
      });
      yPos -= 20;
    });

    page.drawText("Subtotal:", {
      x: 350,
      y: yPos - 30,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.totalAmount.toFixed(2), {
      x: 450,
      y: yPos - 30,
      size: 12,
      font,
    });

    page.drawText(`Tax (${serviceBill.taxRate}%):`, {
      x: 350,
      y: yPos - 50,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.taxAmount.toFixed(2), {
      x: 450,
      y: yPos - 50,
      size: 12,
      font,
    });

    page.drawText("Discount:", {
      x: 350,
      y: yPos - 70,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.discount.toFixed(2), {
      x: 450,
      y: yPos - 70,
      size: 12,
      font,
    });

    page.drawText("Grand Total:", {
      x: 350,
      y: yPos - 90,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.grandTotal.toFixed(2), {
      x: 450,
      y: yPos - 90,
      size: 12,
      font: fontBold,
    });

    page.drawText("Advance Paid:", {
      x: 350,
      y: yPos - 110,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.advancePaid.toFixed(2), {
      x: 450,
      y: yPos - 110,
      size: 12,
      font,
    });

    page.drawText("Balance Due:", {
      x: 350,
      y: yPos - 130,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.balanceDue.toFixed(2), {
      x: 450,
      y: yPos - 130,
      size: 12,
      font: fontBold,
    });

    page.drawText("Payment Method:", {
      x: 50,
      y: yPos - 160,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.paymentMethod.toUpperCase(), {
      x: 200,
      y: yPos - 160,
      size: 12,
      font,
    });

    page.drawText("Payment Status:", {
      x: 50,
      y: yPos - 180,
      size: 12,
      font: fontBold,
    });
    page.drawText(serviceBill.paymentStatus.toUpperCase(), {
      x: 200,
      y: yPos - 180,
      size: 12,
      font,
    });

    page.drawText("Thank you for your business!", {
      x: 200,
      y: 50,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0.8),
    });

    const pdfBytes = await pdfDoc.save();

    if (returnBuffer) {
      return pdfBytes;
    } else {
      const uploadDir = path.join(__dirname, "../uploads/service-bills");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `service-bill-${serviceBill._id}.pdf`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, pdfBytes);
      return `/uploads/service-bills/${filename}`;
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
