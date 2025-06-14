// utils/pdfGenerator.js
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

exports.generateServiceBillPDF = async (serviceBill, returnBuffer = false) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size

    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    // Load logo
    const logoPath = path.join(__dirname, "../../frontend/src/images/okmotorback.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    // Header Section
    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 80,
      color: rgb(0.047, 0.098, 0.196),
    });

    page.drawImage(logoImage, {
      x: 50,
      y: 744,
      width: 160,
      height: 130,
    });

    // Watermark
    page.drawImage(logoImage, {
      x: 180,
      y: 430,
      width: 260,
      height: 220,
      opacity: 0.1,
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 400,
      y: 815,
      size: 14,
      color: rgb(0.8, 0.8, 0.8),
      font: fontBold,
    });

    // Title Section
    page.drawRectangle({
      x: 0,
      y: 750,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("VEHICLE SERVICE INVOICE", {
      x: 180,
      y: 758,
      size: 18,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Invoice Info
    const invoiceNumber = serviceBill.billNumber || `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    
    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Date: ${new Date(serviceBill.serviceDate || Date.now()).toLocaleDateString()}`, {
      x: 400,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Divider
    page.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Business Information (if enabled)
    if (serviceBill.taxEnabled) {
      page.drawText("BUSINESS INFORMATION", {
        x: 50,
        y: 690,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      page.drawText(`Name: ${serviceBill.businessName || "N/A"}`, {
        x: 60,
        y: 670,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      page.drawText(`GSTIN: ${serviceBill.businessGSTIN || "N/A"}`, {
        x: 380,
        y: 670,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      const address = serviceBill.businessAddress || "N/A";
      const maxCharsPerLine = 60;
      const addressLines = [];
      for (let i = 0; i < address.length; i += maxCharsPerLine) {
        addressLines.push(address.substring(i, i + maxCharsPerLine));
      }

      addressLines.forEach((line, index) => {
        page.drawText(index === 0 ? `Address: ${line}` : line, {
          x: index === 0 ? 60 : 100,
          y: 655 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });

      // Adjust Y positions for other sections
      var customerY = 600;
    } else {
      var customerY = 690;
    }

    // Customer Information
    page.drawText("CUSTOMER DETAILS", {
      x: 50,
      y: customerY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    page.drawText(`Name: ${serviceBill.customerName || "N/A"}`, {
      x: 60,
      y: customerY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const customerAddress = serviceBill.customerAddress || "N/A";
    const customerAddressLines = [];
    for (let i = 0; i < customerAddress.length; i += 60) {
      customerAddressLines.push(customerAddress.substring(i, i + 60));
    }

    customerAddressLines.forEach((line, index) => {
      page.drawText(index === 0 ? `Address: ${line}` : line, {
        x: index === 0 ? 60 : 100,
        y: customerY - 40 - index * 12,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    page.drawText(`Phone: ${serviceBill.customerPhone || "N/A"}`, {
      x: 350,
      y: customerY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Email: ${serviceBill.customerEmail || "N/A"}`, {
      x: 350,
      y: customerY - 40,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Create two columns for Vehicle and Service Information
    const columnY = customerY - 80;
    const leftColumnX = 50;
    const rightColumnX = 300;
    const columnWidth = 240;

    // Left Column - Vehicle Information
    page.drawText("VEHICLE DETAILS", {
      x: leftColumnX,
      y: columnY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Vehicle condition
    page.drawRectangle({
      x: leftColumnX,
      y: columnY - 30,
      width: columnWidth,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("Condition: " + (serviceBill.vehicleCondition || "Good"), {
      x: leftColumnX + 10,
      y: columnY - 23,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Vehicle details
    const vehicleDetails = [
      { label: "Type:", value: serviceBill.vehicleType ? serviceBill.vehicleType.toUpperCase() : "N/A" },
      { label: "Brand:", value: serviceBill.vehicleBrand || "N/A" },
      { label: "Model:", value: serviceBill.vehicleModel || "N/A" },
      { label: "Reg No:", value: serviceBill.registrationNumber || "N/A" },
      { label: "KM:", value: serviceBill.kmReading ? `${serviceBill.kmReading} km` : "N/A" }
    ];

    let vehicleY = columnY - 50;
    vehicleDetails.forEach((detail, index) => {
      page.drawText(detail.label, {
        x: leftColumnX + 10,
        y: vehicleY - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(detail.value, {
        x: leftColumnX + 60,
        y: vehicleY - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    // Right Column - Service Information
    page.drawText("SERVICE DETAILS", {
      x: rightColumnX,
      y: columnY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const serviceDetails = [
      { label: "Service Date:", value: new Date(serviceBill.serviceDate || Date.now()).toLocaleDateString() },
      { label: "Delivery Date:", value: new Date(serviceBill.deliveryDate || Date.now() + 86400000).toLocaleDateString() },
      { label: "Service Type:", value: serviceBill.serviceType ? serviceBill.serviceType.toUpperCase() : "N/A" }
    ];

    serviceDetails.forEach((detail, index) => {
      page.drawText(detail.label, {
        x: rightColumnX + 10,
        y: columnY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(detail.value, {
        x: rightColumnX + 90,
        y: columnY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    // Service Items Table (full width)
    const itemsStartY = columnY - 140;
    page.drawText("SERVICE ITEMS", {
      x: 50,
      y: itemsStartY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Table headers
    const serviceHeaders = ["#", "Description", "Qty", "Rate Rs.", "Amount Rs."];
    const serviceHeaderPositions = [60, 100, 300, 350, 450];

    serviceHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: serviceHeaderPositions[index],
        y: itemsStartY - 20,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });
    });

    // Table rows
    let yPos = itemsStartY - 40;
    serviceBill.serviceItems.forEach((item, index) => {
      page.drawText((index + 1).toString(), {
        x: 60,
        y: yPos,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      // Handle description wrapping
      const description = item.description || "N/A";
      const maxWidth = 180;
      const lines = [];
      let currentLine = "";

      for (const word of description.split(" ")) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 9);
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: 100,
          y: yPos - lineIndex * 12,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });

      const descHeight = Math.max(lines.length * 12, 12);

      page.drawText(item.quantity.toString(), {
        x: 300,
        y: yPos,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      page.drawText(item.rate.toFixed(2), {
        x: 350,
        y: yPos,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      page.drawText(item.amount.toFixed(2), {
        x: 450,
        y: yPos,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      yPos -= descHeight;
    });

    // Totals Section
    const totalsY = yPos - 30;
    page.drawText("Subtotal:", {
      x: 350,
      y: totalsY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.totalAmount.toFixed(2), {
      x: 450,
      y: totalsY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    if (serviceBill.taxEnabled) {
      page.drawText(`Tax (${serviceBill.taxRate}%):`, {
        x: 350,
        y: totalsY - 20,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });
      page.drawText(serviceBill.taxAmount.toFixed(2), {
        x: 450,
        y: totalsY - 20,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    }

    page.drawText("Discount:", {
      x: 350,
      y: totalsY - 40,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.discount.toFixed(2), {
      x: 450,
      y: totalsY - 40,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText("Grand Total:", {
      x: 350,
      y: totalsY - 60,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.grandTotal.toFixed(2), {
      x: 450,
      y: totalsY - 60,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });

    page.drawText("Advance Paid:", {
      x: 350,
      y: totalsY - 80,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.advancePaid.toFixed(2), {
      x: 450,
      y: totalsY - 80,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText("Balance Due:", {
      x: 350,
      y: totalsY - 100,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.balanceDue.toFixed(2), {
      x: 450,
      y: totalsY - 100,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });

    // Payment Information
    page.drawText("Payment Method:", {
      x: 50,
      y: totalsY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.paymentMethod.toUpperCase(), {
      x: 150,
      y: totalsY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText("Payment Status:", {
      x: 50,
      y: totalsY-20,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    page.drawText(serviceBill.paymentStatus.toUpperCase(), {
      x: 150,
      y: totalsY-20,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Issues Reported
    page.drawText("ISSUES REPORTED", {
      x: 50,
      y: totalsY - 40,
      size: 10,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const issues = serviceBill.issuesReported || "N/A";
    const issuesLines = [];
    for (let i = 0; i < issues.length; i += 60) {
      issuesLines.push(issues.substring(i, i + 60));
    }

    issuesLines.forEach((line, index) => {
      page.drawText(line, {
        x: 150,
        y: totalsY - 40 - index * 12,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    // Footer with Signatures (now with more space)
    const footerY = 80;
    
    // Customer Signature
    page.drawText("Customer Signature", {
      x: 100,
      y: footerY,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 50, y: footerY + 15 },
      end: { x: 250, y: footerY + 15 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Authorized Signatory
    page.drawText("Authorized Signatory", {
      x: 350,
      y: footerY,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 300, y: footerY + 15 },
      end: { x: 500, y: footerY + 15 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Thank you message
    page.drawText("Thank you for your business!", {
      x: 220,
      y: footerY - 30,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Company info
    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd, Samanpura, Raja Bazar, Indrapuri, Patna, Bihar 800014",
      {
        x: 130,
        y: footerY - 50,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );

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