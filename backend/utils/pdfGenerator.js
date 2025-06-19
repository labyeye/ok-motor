// utils/pdfGenerator.js
const { PDFDocument, rgb, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
function formatTime12Hour(date) {
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
exports.generateServiceBillPDF = async (serviceBill, returnBuffer = false) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size

    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    // Load logo
    const logoPath = path.join(
      __dirname,
      "../../frontend/src/images/okmotorback.png"
    );
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
      x: 280,
      y: 200,
      width: 400,
      height: 360,
      opacity: 0.3,
      rotate: degrees(45),
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
    const invoiceNumber =
      serviceBill.billNumber ||
      `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;

    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const currentDate = new Date();
    page.drawText(
      `Date: ${currentDate.toLocaleDateString(
        "en-IN"
      )} Time: ${currentDate.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`,
      {
        x: 400,
        y: 720,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

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
      const maxCharsPerLine = 30;
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
    for (let i = 0; i < customerAddress.length; i += 30) {
      customerAddressLines.push(customerAddress.substring(i, i + 30));
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

    const columnY = customerY - 80;
    const leftColumnX = 50;
    const rightColumnX = 300;
    const columnWidth = 240;

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

    page.drawText(
      "Condition: " + (serviceBill.vehicleCondition || "Excellent"),
      {
        x: leftColumnX + 10,
        y: columnY - 23,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );
    const vehicleDetails = [
      {
        label: "Type:",
        value: serviceBill.vehicleType
          ? serviceBill.vehicleType.toUpperCase()
          : "N/A",
      },
      { label: "Brand:", value: serviceBill.vehicleBrand || "N/A" },
      { label: "Model:", value: serviceBill.vehicleModel || "N/A" },
      { label: "Reg No:", value: serviceBill.registrationNumber || "N/A" },
      {
        label: "KM:",
        value: serviceBill.kmReading ? `${serviceBill.kmReading} km` : "N/A",
      },
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
    // Right Column - Service Information
    page.drawText("SERVICE DETAILS", {
      x: rightColumnX,
      y: columnY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const serviceDetails = [
      {
  label: "Service Date:",
  value: new Date(
    serviceBill.serviceDate || Date.now()
  ).toLocaleDateString("en-GB"),
},
{
  label: "Delivery Date:",
  value: new Date(
    serviceBill.deliveryDate || Date.now() + 86400000
  ).toLocaleDateString("en-GB"),
},

      {
        label: "Service Type:",
        value: serviceBill.serviceType
          ? serviceBill.serviceType.toUpperCase()
          : "N/A",
      },
    ];

    // Draw the first three service details
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

    // Immediately after service type, add custom description if applicable
    const isCustomService =
      serviceBill.serviceType &&
      serviceBill.serviceType.toLowerCase() === "custom";
    const hasCustomDesc =
      serviceBill.customServiceDescription &&
      serviceBill.customServiceDescription.trim() !== "";

    if (isCustomService && hasCustomDesc) {
      const customDescY = columnY - 25 - serviceDetails.length * 15;

      page.drawText("Custom Service Description:", {
        x: rightColumnX + 10,
        y: customDescY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      // Handle multi-line description
      const description = serviceBill.customServiceDescription;
      const maxCharsPerLine = 30;
      const descLines = [];
      for (let i = 0; i < description.length; i += maxCharsPerLine) {
        descLines.push(description.substring(i, i + maxCharsPerLine));
      }

      descLines.forEach((line, index) => {
        page.drawText(line, {
          x: rightColumnX + 10,
          y: customDescY - 15 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    }
    // Service Items Table with pagination
    const itemsStartY = columnY - 140;
    const maxItemsPerPage = 15; // Adjust this number based on your item height
    let currentPage = page;
    let currentY = itemsStartY;
    let currentPageItems = 0;

    // Draw title only on first page
    if (serviceBill.serviceItems.length > 0) {
      currentPage.drawText("SERVICE ITEMS", {
        x: 50,
        y: currentY,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
      currentY -= 20;
    }

    // Function to draw table headers
    const drawServiceItemHeaders = (page, y) => {
      const serviceHeaders = [
        "#",
        "Description",
        "Qty",
        "Rate Rs.",
        "Amount Rs.",
      ];
      const serviceHeaderPositions = [60, 100, 300, 350, 450];

      serviceHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: serviceHeaderPositions[index],
          y: y,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: fontBold,
        });
      });
    };

    // Draw headers on first page
    drawServiceItemHeaders(currentPage, currentY);
    currentY -= 20;

    // Draw all service items with pagination
    serviceBill.serviceItems.forEach((item, index) => {
      // Check if we need a new page (leave 300pt space for totals/footer)
      if (currentY < 300 && currentPageItems >= maxItemsPerPage) {
        // Create new page
        currentPage = pdfDoc.addPage([595, 842]);
        currentY = 780; // Start near top of new page
        currentPageItems = 0;

        // Draw headers on new page
        drawServiceItemHeaders(currentPage, currentY);
        currentY -= 20;
      }

      // Draw item number
      currentPage.drawText((index + 1).toString(), {
        x: 60,
        y: currentY,
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

      // Draw description lines
      lines.forEach((line, lineIndex) => {
        currentPage.drawText(line, {
          x: 100,
          y: currentY - lineIndex * 12,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });

      const descHeight = Math.max(lines.length * 12, 12);

      // Draw quantity, rate, and amount
      currentPage.drawText(item.quantity.toString(), {
        x: 300,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      currentPage.drawText(item.rate.toFixed(2), {
        x: 350,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      currentPage.drawText((item.quantity * item.rate).toFixed(2), {
        x: 450,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      currentY -= descHeight;
      currentPageItems++;
    });

    // Ensure we have enough space for totals and footer (about 300pt)
    if (currentY < 300) {
      currentPage = pdfDoc.addPage([595, 842]);
      currentY = 700; // Start lower on new page to leave room
    }

    // Now draw all the remaining sections on the last page
    // Totals Section
    currentPage.drawText("Subtotal:", {
      x: 350,
      y: currentY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.totalAmount.toFixed(2), {
      x: 450,
      y: currentY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    if (serviceBill.taxEnabled) {
      currentPage.drawText(`Tax (${serviceBill.taxRate}%):`, {
        x: 350,
        y: currentY - 20,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });
      currentPage.drawText(serviceBill.taxAmount.toFixed(2), {
        x: 450,
        y: currentY - 20,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    }

    currentPage.drawText("Discount:", {
      x: 350,
      y: currentY - 40,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.discount.toFixed(2), {
      x: 450,
      y: currentY - 40,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    currentPage.drawText("Grand Total:", {
      x: 350,
      y: currentY - 60,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.grandTotal.toFixed(2), {
      x: 450,
      y: currentY - 60,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });

    currentPage.drawText("Advance Paid:", {
      x: 350,
      y: currentY - 80,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.advancePaid.toFixed(2), {
      x: 450,
      y: currentY - 80,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    currentPage.drawText("Balance Due:", {
      x: 350,
      y: currentY - 100,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.balanceDue.toFixed(2), {
      x: 450,
      y: currentY - 100,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });

    // Payment Information
    currentPage.drawText("Payment Method:", {
      x: 50,
      y: currentY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.paymentMethod.toUpperCase(), {
      x: 150,
      y: currentY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    currentPage.drawText("Payment Status:", {
      x: 50,
      y: currentY - 20,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(serviceBill.paymentStatus.toUpperCase(), {
      x: 150,
      y: currentY - 20,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Issues Reported
    currentPage.drawText("ISSUES REPORTED", {
      x: 50,
      y: currentY - 40,
      size: 10,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const issues = serviceBill.issuesReported || "N/A";
    const maxCharsPerLine = 30;
    const lineHeight = 12;
    const startY = currentY - 40;

    // Function to split text into lines with max characters, respecting word boundaries
    function splitTextIntoLines(text, maxLength) {
      const lines = [];
      let currentLine = "";

      // Split the text into words first
      const words = text.split(/\s+/);

      for (const word of words) {
        if (currentLine.length + word.length <= maxLength) {
          // Add the word to current line
          currentLine += (currentLine.length > 0 ? " " : "") + word;
        } else {
          // Current line is full, push it and start a new line
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }

          // If the word itself is longer than maxLength, split it
          if (word.length > maxLength) {
            // Split the long word into chunks
            let i = 0;
            while (i < word.length) {
              lines.push(word.substr(i, maxLength));
              i += maxLength;
            }
            currentLine = "";
          } else {
            currentLine = word;
          }
        }
      }

      // Push the last line if it's not empty
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      return lines;
    }

    const issuesLines = splitTextIntoLines(issues, maxCharsPerLine);

    // Draw each line
    issuesLines.forEach((line, index) => {
      currentPage.drawText(line, {
        x: 150,
        y: startY - index * lineHeight,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    // Footer with Signatures
    const footerY = 80;

    // Customer Signature
    currentPage.drawText("Customer Signature", {
      x: 100,
      y: footerY,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    currentPage.drawLine({
      start: { x: 50, y: footerY + 15 },
      end: { x: 250, y: footerY + 15 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Authorized Signatory
    currentPage.drawText("Authorized Signatory", {
      x: 350,
      y: footerY,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    currentPage.drawLine({
      start: { x: 300, y: footerY + 15 },
      end: { x: 500, y: footerY + 15 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Thank you message
    currentPage.drawText("Thank you for your business!", {
      x: 220,
      y: footerY - 30,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Company info
    currentPage.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
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
