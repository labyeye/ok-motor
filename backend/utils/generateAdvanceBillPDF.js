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

const generateAdvanceBillPDF = async (advanceBill, returnBuffer = false) => {
  try {
    console.log("Starting PDF generation for:", advanceBill._id || "new bill");

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    const formatKm = (val) => {
      if (val === undefined || val === null) return "0.00";

      // Convert to number and divide by 100 if stored in cents format
      const num =
        typeof val === "string"
          ? parseFloat(val.replace(/,/g, ""))
          : Number(val);
      const actualKm = num / 100; // Add this division

      return isNaN(actualKm)
        ? "0.00"
        : new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(actualKm);
    };

    const formatRupee = (val) => {
      if (val === undefined || val === null) return "0.00";
      const num =
        typeof val === "string"
          ? parseFloat(val.replace(/,/g, ""))
          : Number(val);
      return isNaN(num)
        ? "0.00"
        : new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(num);
    };

    const formatRupeeWithSymbol = (val) => {
      return `Rs.${formatRupee(val)}`;
    };

    let logoImage = null;
    try {
      const logoPath = path.join(
        __dirname,
        "../../frontend/src/images/okmotorback.png"
      );
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        logoImage = await pdfDoc.embedPng(logoBytes);
      }
    } catch (logoError) {
      console.warn(
        "Logo not found, continuing without logo:",
        logoError.message
      );
    }

    // Header Section
    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 80,
      color: rgb(0.047, 0.098, 0.196),
    });

    // Draw logo if available
    if (logoImage) {
      page.drawImage(logoImage, {
        x: 50,
        y: 744,
        width: 160,
        height: 130,
      });
    }
    if (logoImage) {
      page.drawImage(logoImage, {
        x: 300,
        y: 100,
        width: 500,
        height: 470,
        opacity: 0.3,
        rotate: degrees(45),
      });
    }

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

    page.drawText("ADVANCE PAYMENT INVOICE", {
      x: 180,
      y: 758,
      size: 18,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Invoice Info
    const invoiceNumber =
      advanceBill.billNumber ||
      `ADV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
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
      )} Time: ${formatTime12Hour(currentDate)}`,
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
     page.drawRectangle({
      x: 0,
      y: 685,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });


    // Customer Information
    const customerY = 690;
    page.drawText("CUSTOMER DETAILS", {
      x: 50,
      y: customerY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    page.drawText(`Name: ${advanceBill.customerName || "N/A"}`, {
      x: 60,
      y: customerY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const customerAddress = advanceBill.customerAddress || "N/A";
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

    page.drawText(`Phone: ${advanceBill.customerPhone || "N/A"}`, {
      x: 350,
      y: customerY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Email: ${advanceBill.customerEmail || "N/A"}`, {
      x: 350,
      y: customerY - 40,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawRectangle({
      x: 0,
      y: 605,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });

    // Vehicle Information
    const vehicleY = customerY - 80;
    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: vehicleY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const vehicleDetails = [
      {
        label: "Type:",
        value: advanceBill.vehicleType
          ? advanceBill.vehicleType.toUpperCase()
          : "N/A",
      },
      { label: "Brand:", value: advanceBill.vehicleBrand || "N/A" },
      { label: "Model:", value: advanceBill.vehicleModel || "N/A" },
      { label: "Reg No:", value: advanceBill.registrationNumber || "N/A" },
      { label: "Chassis:", value: advanceBill.chassisNumber || "N/A" },
      { label: "Engine:", value: advanceBill.engineNumber || "N/A" },
      {
        label: "KM:",
        value: advanceBill.kmReading
          ? `${formatKm(advanceBill.kmReading)} km`
          : "N/A",
      },
    ];

    vehicleDetails.forEach((detail, index) => {
      page.drawText(detail.label, {
        x: 60,
        y: vehicleY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(detail.value, {
        x: 120,
        y: vehicleY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });
    page.drawRectangle({
      x: 0,
      y: 465,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });

    // Service Dates
    const serviceY = vehicleY - 140;
    page.drawText("SERVICE DATES", {
      x: 50,
      y: serviceY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const serviceDetails = [
      {
        label: "Service Date:",
        value: new Date(
          advanceBill.serviceDate || Date.now()
        ).toLocaleDateString("en-IN"),
      },
      {
        label: "Delivery Date:",
        value: new Date(
          advanceBill.deliveryDate || Date.now() + 86400000
        ).toLocaleDateString("en-IN"),
      },
    ];

    serviceDetails.forEach((detail, index) => {
      page.drawText(detail.label, {
        x: 60,
        y: serviceY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(detail.value, {
        x: 150,
        y: serviceY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });
    page.drawRectangle({
      x: 0,
      y: 395,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });

    // Payment Information
    const paymentY = serviceY - 70;
    page.drawText("PAYMENT INFORMATION", {
      x: 50,
      y: paymentY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Convert all amounts to numbers first
    const totalAmount = Number(advanceBill.totalAmount) || 0;
    const advancePaid = Number(advanceBill.advancePaid) || 0;
    const grandTotal = Number(advanceBill.grandTotal) || totalAmount * 100;
    const balanceDue = Number(advanceBill.balanceDue);

    const paymentDetails = [
      { label: "Total Amount:", value: formatRupeeWithSymbol(totalAmount) },
      {
        label: "Discount:",
        value: formatRupeeWithSymbol(advanceBill.discount || 0),
      },
      { label: "Advance Paid:", value: formatRupeeWithSymbol(advancePaid) },
      { label: "Grand Total:", value: formatRupeeWithSymbol(grandTotal) },
      { label: "Balance Due:", value: formatRupeeWithSymbol(balanceDue) },
      {
        label: "Payment Method:",
        value: advanceBill.paymentMethod
          ? advanceBill.paymentMethod.toUpperCase()
          : "N/A",
      },
    ];

    paymentDetails.forEach((detail, index) => {
      page.drawText(detail.label, {
        x: 60,
        y: paymentY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(detail.value, {
        x: 180,
        y: paymentY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });
    page.drawRectangle({
      x: 0,
      y: 245,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });
    const termsY = 250; // Position above the footer
    page.drawText("TERMS AND CONDITIONS", {
      x: 50,
      y: termsY,
      size: 15,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const termsAndConditions = [
      "1. If advance bill generated then no refund will be given.",
      "2. Advance payment is non-refundable if the service is cancelled by the customer.",
      "3. Any additional work required will be charged separately.",
      "4. Vehicle must be collected within the delivery date.",
      "5. Original invoice must be presented for vehicle collection.",
      "6. Warranty applies only to parts replaced by us and for the specified period.",
      "7. This is an advance payment invoice only, not the final bill.",
    ];

    termsAndConditions.forEach((term, index) => {
      page.drawText(term, {
        x: 60,
        y: termsY - 20 - index * 12,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    // Footer with Signatures
    const footerY = 80;
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

    page.drawText("Thank you for your business!", {
      x: 220,
      y: footerY - 30,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014",
      {
        x: 160,
        y: footerY - 50,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );

    const pdfBytes = await pdfDoc.save();

    if (returnBuffer) {
      return Buffer.from(pdfBytes);
    } else {
      const uploadDir = path.join(__dirname, "../uploads/advance-bills");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `advance-bill-${advanceBill._id}.pdf`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, pdfBytes);
      return filename; // Return just the filename
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

module.exports = generateAdvanceBillPDF;
