const { PDFDocument, rgb, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
// Logo path will be resolved from several candidate locations (env override allowed)
const locateLogoPath = () => {
  const candidates = [];
  if (process.env.LOGO_PATH) candidates.push(process.env.LOGO_PATH);
  candidates.push(path.join(__dirname, "../../frontend/src/images/okmotorback.png"));
  candidates.push(path.join(__dirname, "../../frontend/public/images/okmotorback.png"));
  candidates.push(path.join(__dirname, "../../frontend/public/okmotorback.png"));
  candidates.push(path.join(__dirname, "../images/okmotorback.png"));
  candidates.push(path.join(__dirname, "../assets/okmotorback.png"));

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (e) {
      // ignore and continue
    }
  }
  return null;
};


const formatTime12Hour = (timeString) => {
  try {
    if (!timeString) return "";
    
    // Handle Date objects
    if (timeString instanceof Date) {
      const hours = timeString.getHours();
      const minutes = timeString.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
    
    // Handle string inputs
    if (typeof timeString === 'string') {
      // Check if it's already in 12-hour format
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      }
      
      const [hour, minute] = timeString.split(':').map(Number);
      if (!isNaN(hour)) {
        const hours12 = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${String(hours12).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')} ${ampm}`;
      }
    }
    
    return "";
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
};

const generateAdvanceBillPDF = async (advanceBill, returnBuffer = false) => {
  try {
    console.log("Starting PDF generation for:", advanceBill._id || "new bill");
    // Defensive: convert Mongoose document to plain object if necessary
    if (advanceBill && typeof advanceBill.toObject === 'function') {
      advanceBill = advanceBill.toObject();
    }

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
      const actualKm = num; // Add this division

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

    // Optimize logo loading - attempt to locate from candidates and embed
    let logoImage = null;
    try {
      const logoPath = locateLogoPath();
      if (logoPath && fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        logoImage = await pdfDoc.embedPng(logoBytes);
        console.log("Logo loaded successfully from:", logoPath);
      } else {
        console.warn("Logo file not found in candidate locations");
      }
    } catch (logoError) {
      console.warn("Logo not found, continuing without logo:", logoError.message);
      logoImage = null;
    }

    // Pre-calculate common values for better performance
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;

    // Header Section
    page.drawRectangle({
      x: 0,
      y: 780,
      width: pageWidth,
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
      
      // Add single watermark logo (optimized)
      page.drawImage(logoImage, {
        x: 200,
        y: 250,
        width: 300,
        height: 280,
        opacity: 0.15,
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
      width: pageWidth,
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

    // Use India Standard Time (Asia/Kolkata) for printed date/time
    const now = new Date();
    const istDateStr = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const istTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(now);

    page.drawText(`Date: ${istDateStr} Time: ${istTimeStr}`, {
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
    // Break address into readable lines (wrap at ~45 chars)
    for (let i = 0; i < customerAddress.length; i += 45) {
      customerAddressLines.push(customerAddress.substring(i, i + 45));
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
    page.drawText("ADVANCE PAYMENT DATES", {
      x: 50,
      y: serviceY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Service Date
    page.drawText("Advance Payment Date:", {
      x: 60,
      y: serviceY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });

    page.drawText(new Date(
      advanceBill.serviceDate || Date.now()
    ).toLocaleDateString("en-IN"), {
      x: 180,
      y: serviceY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Delivery Date on the same row
    page.drawText("Delivery Date:", {
      x: 350,
      y: serviceY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });

    page.drawText(new Date(
      advanceBill.deliveryDate || Date.now() + 86400000
    ).toLocaleDateString("en-IN"), {
      x: 420,
      y: serviceY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawRectangle({
      x: 0,
      y: 415,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });

    // Payment Information
    const paymentY = serviceY - 50;
    page.drawText("PAYMENT INFORMATION", {
      x: 50,
      y: paymentY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    // Convert all amounts to numbers first
    // Parse numeric fields safely and provide sensible defaults
    const totalAmount = parseFloat(advanceBill.totalAmount) || 0;
    const advancePaid = parseFloat(advanceBill.advancePaid) || 0;
    const grandTotal = (advanceBill.grandTotal !== undefined && advanceBill.grandTotal !== null)
      ? parseFloat(advanceBill.grandTotal) || totalAmount
      : totalAmount;
    const balanceDue = (advanceBill.balanceDue !== undefined && advanceBill.balanceDue !== null)
      ? parseFloat(advanceBill.balanceDue) || (grandTotal - advancePaid)
      : (grandTotal - advancePaid);

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
        y: paymentY - 20 - index * 15,
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
      y: 285,
      width: 595,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity:0.6,
    });

    // Note Section (if note exists)
    let termsY = 250; // Default position
    
    if (advanceBill.note && advanceBill.note.trim()) {
      const noteY = 290;
      page.drawText("NOTE", {
        x: 50,
        y: noteY,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      // Split note into lines if it's too long
      const noteText = advanceBill.note.trim();
      const maxLineLength = 160;
      const noteLines = [];
      
      for (let i = 0; i < noteText.length; i += maxLineLength) {
        noteLines.push(noteText.substring(i, i + maxLineLength));
      }

      noteLines.forEach((line, index) => {
        page.drawText(line, {
          x: 60,
          y: noteY - 20 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });

      // Adjust terms position based on note length
      termsY = noteY - 20 - (noteLines.length * 12) - 20;
      
      page.drawRectangle({
        x: 0,
        y: termsY - 5,
        width: 595,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
        opacity:0.6,
      });
      
      page.drawText("TERMS AND CONDITIONS", {
        x: 50,
        y: termsY,
        size: 15,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
    } else {
      // If no note, keep original terms position
      page.drawRectangle({
        x: 0,
        y: termsY + 20,
        width: 595,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
        opacity:0.6,
      });
      
      page.drawText("TERMS AND CONDITIONS", {
        x: 50,
        y: termsY,
        size: 15,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
    }

    const termsAndConditions = [
      "1. If advance bill generated then no refund will be given.",
      "2. Advance payment is non-refundable if the service is cancelled by the customer.",
      "3. Any additional work required will be charged separately.",
      "4. Vehicle must be collected within the delivery date.",
      "5. Original invoice must be presented for vehicle collection.",
      "6. Warranty applies only to parts replaced by us and for the specified period.",
      "7. This is an advance payment invoice only, not the final bill.",
      "8. Paper Work (Insaurance, Pollution etc.) will be charged separately."
    ];

    termsAndConditions.forEach((term, index) => {
      page.drawText(term, {
        x: 60,
        y: termsY - 20 - index * 12,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    // Footer with Signatures
    const footerY = 60;
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
      const os = require("os");
      const fallbackDir = path.join(os.tmpdir(), "advance-bills");
      const filename = `advance-bill-${advanceBill._id}.pdf`;

      // Try primary uploads directory first, fall back to OS tmpdir if write fails (e.g., read-only FS)
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, pdfBytes);
        return filename; // Return just the filename
      } catch (err) {
        console.warn("Primary upload directory write failed, falling back to tmpdir:", err.message);
        try {
          if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
          }
          const fallbackPath = path.join(fallbackDir, filename);
          fs.writeFileSync(fallbackPath, pdfBytes);
          return filename; // Return filename; route will check fallback location
        } catch (err2) {
          console.error("Failed to write PDF to fallback tmpdir:", err2);
          throw new Error(`PDF generation failed: ${err2.message}`);
        }
      }
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

module.exports = generateAdvanceBillPDF;
