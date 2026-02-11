const { PDFDocument, rgb, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const formatTime12Hour = (timeString) => {
  try {
    if (!timeString) return "";

    if (timeString instanceof Date) {
      const hours = timeString.getHours();
      const minutes = timeString.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )} ${ampm}`;
    }

    if (typeof timeString === "string") {
      if (timeString.includes("AM") || timeString.includes("PM")) {
        return timeString;
      }

      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0",
        )} ${ampm}`;
      }

      const [hour, minute] = timeString.split(":").map(Number);
      if (!isNaN(hour)) {
        const hours12 = hour % 12 || 12;
        const ampm = hour >= 12 ? "PM" : "AM";
        return `${String(hours12).padStart(2, "0")}:${String(
          minute || 0,
        ).padStart(2, "0")} ${ampm}`;
      }
    }

    return "";
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
};

exports.generateServiceBillPDF = async (serviceBill, returnBuffer = false) => {
  try {
    if (serviceBill && typeof serviceBill.toObject === "function") {
      serviceBill = serviceBill.toObject();
    }

    if (!serviceBill || typeof serviceBill !== "object") {
      throw new Error("Invalid serviceBill parameter: must be an object");
    }
    if (!serviceBill.serviceItems || !Array.isArray(serviceBill.serviceItems)) {
      throw new Error("Invalid serviceBill: serviceItems must be an array");
    }

    const validatedServiceBill = {
      ...serviceBill,
      totalAmount: parseFloat(serviceBill.totalAmount) || 0,
      taxAmount: parseFloat(serviceBill.taxAmount) || 0,
      discount: parseFloat(serviceBill.discount) || 0,
      grandTotal: parseFloat(serviceBill.grandTotal) || 0,
      advancePaid: parseFloat(serviceBill.advancePaid) || 0,
      balanceDue: parseFloat(serviceBill.balanceDue) || 0,
      taxRate: parseFloat(serviceBill.taxRate) || 0,
      serviceItems: serviceBill.serviceItems.map((item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount =
          item.amount !== undefined &&
          item.amount !== null &&
          item.amount !== ""
            ? parseFloat(item.amount) || 0
            : rate * quantity;
        return {
          ...item,
          quantity,
          rate,
          amount,
        };
      }),
    };
    serviceBill = validatedServiceBill;

    serviceBill.paymentMethod = serviceBill.paymentMethod || "cash";
    serviceBill.paymentStatus = serviceBill.paymentStatus || "pending";
    serviceBill.vehicleType = serviceBill.vehicleType || "bike";
    serviceBill.serviceType = serviceBill.serviceType || "regular";
    serviceBill.customerName = serviceBill.customerName || "";
    serviceBill.customerPhone = serviceBill.customerPhone || "";
    serviceBill.customerAddress = serviceBill.customerAddress || "";
    serviceBill.registrationNumber = serviceBill.registrationNumber || "";
    serviceBill.vehicleBrand = serviceBill.vehicleBrand || "";
    serviceBill.vehicleModel = serviceBill.vehicleModel || "";

    const pdfDoc = await PDFDocument.create();
    const pages = [];
    let currentPage = pdfDoc.addPage([595, 842]);
    pages.push(currentPage);

    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    const locateLogo = () => {
      const candidates = [];
      if (process.env.LOGO_PATH) candidates.push(process.env.LOGO_PATH);

      candidates.push(path.join(__dirname, "../assets/images/okmotorback.png"));

      candidates.push(
        path.join(__dirname, "../../frontend/src/images/okmotorback.png"),
      );
      candidates.push(
        path.join(__dirname, "../../frontend/public/images/okmotorback.png"),
      );
      candidates.push(
        path.join(__dirname, "../../frontend/public/okmotorback.png"),
      );
      candidates.push(path.join(__dirname, "../images/okmotorback.png"));
      candidates.push(path.join(__dirname, "../assets/okmotorback.png"));

      console.log("Searching for logo in candidate paths:");
      for (const p of candidates) {
        try {
          console.log(`  Checking: ${p}`);
          if (p && fs.existsSync(p)) {
            console.log(`  ✓ Found logo at: ${p}`);
            return p;
          }
        } catch (e) {
          console.log(`  ✗ Error checking ${p}:`, e.message);
        }
      }
      console.log("  ✗ No logo found in any candidate location");
      return null;
    };

    const logoLocation = locateLogo();
    let logoImage = null;
    if (logoLocation) {
      try {
        const logoBytes = fs.readFileSync(logoLocation);
        logoImage = await pdfDoc.embedPng(logoBytes);
        console.log("Successfully loaded and embedded logo from", logoLocation);
      } catch (logoError) {
        console.error("Error embedding logo for PDF:", logoError.message);
        console.error("Logo path attempted:", logoLocation);
        logoImage = null;
      }
    } else {
      console.warn(
        "⚠ No logo found in candidate locations, PDF will be generated without watermark",
      );
      console.warn("Current __dirname:", __dirname);
    }

    const addWatermark = (page) => {
      if (logoImage) {
        console.log("Drawing watermark logo at x:280, y:200, size:450x400");
        page.drawImage(logoImage, {
          x: 280,
          y: 200,
          width: 450,
          height: 400,
          opacity: 0.4,
          rotate: degrees(45),
        });
      } else {
        console.log("No logo image available for watermark");
      }
    };

    const addPageNumber = (page, currentPageNum, totalPages) => {
      page.drawText(`${currentPageNum}/${totalPages}`, {
        x: 550,
        y: 30,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      });
    };

    addWatermark(currentPage);

    currentPage.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 120,
      color: rgb(0.047, 0.098, 0.196),
    });

    if (logoImage) {
      console.log("Drawing header logo at x:50, y:748, size:180x150");
      currentPage.drawImage(logoImage, {
        x: 50,
        y: 740,
        width: 170,
        height: 140,
      });
      console.log("Header logo drawn successfully");
    } else {
      console.log("No logo image available for header");
    }

    currentPage.drawText("UDAYAM-BR-26-0028550", {
      x: 400,
      y: 815,
      size: 14,
      color: rgb(0.8, 0.8, 0.8),
      font: fontBold,
    });
    // Render GSTIN next to UDAYAM when missing — prefer bill value, then env, then fallback
    try {
      const headerGSTIN =
        (serviceBill && serviceBill.businessGSTIN) || process.env.DEFAULT_GSTIN || "22ABCDE1234F1Z5";
      currentPage.drawText(`GSTIN: ${headerGSTIN}`, {
        x: 400,
        y: 795,
        size: 14,
        color: rgb(0.8, 0.8, 0.8),
        font: fontBold,
      });
    } catch (e) {
      // fallback to a safe hardcoded GSTIN if anything goes wrong
      currentPage.drawText("GSTIN: 22ABCDE1234F1Z5", {
        x: 400,
        y: 795,
        size: 14,
        color: rgb(0.8, 0.8, 0.8),
        font: fontBold,
      });
    }

    currentPage.drawRectangle({
      x: 0,
      y: 750,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });

    currentPage.drawText("VEHICLE SERVICE INVOICE", {
      x: 180,
      y: 758,
      size: 18,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const invoiceNumber =
      serviceBill.billNumber ||
      `OKMTR-${(() => {
        const d = new Date();
        const y = d.getFullYear();
        return d.getMonth() >= 3
          ? `${y}-${String(y + 1).slice(-2)}`
          : `${y - 1}-${String(y).slice(-2)}`;
      })()}-${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")}`;

    currentPage.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

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

    currentPage.drawText(`Date: ${istDateStr} Time: ${istTimeStr}`, {
      x: 400,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    currentPage.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Show business info only when tax is enabled AND the client explicitly
    // requested inclusion via `includeBusinessInPdf`. Previously we required
    // GSTIN to be present; now the toggle controls visibility and fields
    // will fall back to "N/A" when missing.
    const showBusinessInfo =
      Boolean(serviceBill.taxEnabled) &&
      Boolean(serviceBill.includeBusinessInPdf);
    if (showBusinessInfo) {
      currentPage.drawText("BUSINESS INFORMATION", {
        x: 50,
        y: 690,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      currentPage.drawText(`Name: ${serviceBill.businessName || "N/A"}`, {
        x: 60,
        y: 670,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      currentPage.drawText(`GSTIN: ${serviceBill.businessGSTIN || "N/A"}`, {
        x: 380,
        y: 670,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      const address = serviceBill.businessAddress || "";
      const maxCharsPerLine = 30;
      const addressLines = [];
      for (let i = 0; i < address.length; i += maxCharsPerLine) {
        addressLines.push(address.substring(i, i + maxCharsPerLine));
      }

      addressLines.forEach((line, index) => {
        currentPage.drawText(index === 0 ? `Address: ${line}` : line, {
          x: index === 0 ? 60 : 100,
          y: 655 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });

      var customerY = 600;
    } else {
      var customerY = 690;
    }

    currentPage.drawText("CUSTOMER DETAILS", {
      x: 50,
      y: customerY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    currentPage.drawText(`Name: ${serviceBill.customerName || "N/A"}`, {
      x: 60,
      y: customerY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const customerAddress = serviceBill.customerAddress || "";
    const customerAddressLines = [];
    for (let i = 0; i < customerAddress.length; i += 30) {
      customerAddressLines.push(customerAddress.substring(i, i + 30));
    }

    customerAddressLines.forEach((line, index) => {
      currentPage.drawText(index === 0 ? `Address: ${line}` : line, {
        x: index === 0 ? 60 : 100,
        y: customerY - 40 - index * 12,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    currentPage.drawText(`Phone: ${serviceBill.customerPhone || "N/A"}`, {
      x: 350,
      y: customerY - 25,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    currentPage.drawText(`Email: ${serviceBill.customerEmail || "N/A"}`, {
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

    currentPage.drawText("VEHICLE DETAILS", {
      x: leftColumnX,
      y: columnY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    currentPage.drawRectangle({
      x: leftColumnX,
      y: columnY - 30,
      width: columnWidth,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });

    currentPage.drawText(
      "Condition: " + (serviceBill.vehicleCondition || "Excellent"),
      {
        x: leftColumnX + 10,
        y: columnY - 23,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );

    const vehicleDetails = [
      {
        label: "Type:",
        value: (serviceBill.vehicleType ?? "").toString().trim()
          ? serviceBill.vehicleType.toString().toUpperCase()
          : "N/A",
      },
      { label: "Brand:", value: serviceBill.vehicleBrand ?? "N/A" },
      { label: "Model:", value: serviceBill.vehicleModel ?? "N/A" },
      { label: "Reg No:", value: serviceBill.registrationNumber ?? "N/A" },
      {
        label: "KM:",
        value:
          serviceBill.kmReading !== undefined && serviceBill.kmReading !== null
            ? `${Number(serviceBill.kmReading).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} km`
            : "N/A",
      },
    ];

    let vehicleY = columnY - 50;
    vehicleDetails.forEach((detail, index) => {
      currentPage.drawText(detail.label, {
        x: leftColumnX + 10,
        y: vehicleY - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      currentPage.drawText(detail.value, {
        x: leftColumnX + 60,
        y: vehicleY - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    currentPage.drawText("SERVICE DETAILS", {
      x: rightColumnX,
      y: columnY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const serviceDetails = [
      {
        label: "Service Date:",
        value: serviceBill.serviceDate
          ? new Date(serviceBill.serviceDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
      },
      {
        label: "Delivery Date:",
        value: serviceBill.deliveryDate
          ? new Date(serviceBill.deliveryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : new Date(Date.now() + 86400000).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
      },
      {
        label: "Service Type:",
        value: (serviceBill.serviceType ?? "").toString().trim()
          ? serviceBill.serviceType.toString().toUpperCase()
          : "N/A",
      },
    ];

    serviceDetails.forEach((detail, index) => {
      currentPage.drawText(detail.label, {
        x: rightColumnX + 10,
        y: columnY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      currentPage.drawText(detail.value, {
        x: rightColumnX + 90,
        y: columnY - 25 - index * 15,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    const isCustomService =
      serviceBill.serviceType &&
      serviceBill.serviceType.toLowerCase() === "custom";
    const hasCustomDesc =
      serviceBill.customServiceDescription &&
      serviceBill.customServiceDescription.trim() !== "";

    if (isCustomService && hasCustomDesc) {
      const customDescY = columnY - 25 - serviceDetails.length * 15;

      currentPage.drawText("Custom Service Description:", {
        x: rightColumnX + 10,
        y: customDescY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      const description = serviceBill.customServiceDescription;
      const maxCharsPerLine = 30;
      const descLines = [];
      for (let i = 0; i < description.length; i += maxCharsPerLine) {
        descLines.push(description.substring(i, i + maxCharsPerLine));
      }

      descLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: rightColumnX + 10,
          y: customDescY - 15 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    }

    const itemsStartY = columnY - 140;
    const minItemsFirstPage = 25;
    const maxItemsPerPage = 25;
    let currentY = itemsStartY;
    let currentPageItems = 0;
    let isFirstPage = true;

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

    const drawServiceItemHeaders = (page, y) => {
      const serviceHeaders = [
        "#",
        "Description",
        "Qty",
        "Rate Rs.",
        "Disc Rs.",
        "Amount Rs.",
      ];

      const serviceHeaderPositions = [60, 100, 300, 350, 400, 470];

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

    drawServiceItemHeaders(currentPage, currentY);
    currentY -= 20;

    if (!Array.isArray(serviceBill.serviceItems)) {
      console.warn("serviceItems is not an array:", serviceBill.serviceItems);
      return;
    }

    serviceBill.serviceItems.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        console.warn("Invalid service item at index", index, ":", item);
        return;
      }

      const shouldCreateNewPage =
        (!isFirstPage && currentPageItems >= maxItemsPerPage) ||
        (isFirstPage &&
          currentPageItems >= minItemsFirstPage &&
          currentY < 300);

      if (shouldCreateNewPage) {
        currentPage = pdfDoc.addPage([595, 842]);
        pages.push(currentPage);
        addWatermark(currentPage);
        isFirstPage = false;
        currentY = 780;
        currentPageItems = 0;

        drawServiceItemHeaders(currentPage, currentY);
        currentY -= 20;
      }

      currentPage.drawText((index + 1).toString(), {
        x: 60,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      const description = item.description;
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
        currentPage.drawText(line, {
          x: 100,
          y: currentY - lineIndex * 12,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });

      const descHeight = Math.max(lines.length * 12, 12);

      currentPage.drawText(item.quantity.toString(), {
        x: 300,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      const rate = parseFloat(item.rate) || 0;
      currentPage.drawText(rate.toFixed(2), {
        x: 350,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      const amount = parseFloat(item.amount) || 0;
      const qty = parseFloat(item.quantity) || 0;
      const perUnitAmount = qty > 0 ? amount / qty : rate;

      const discountPerUnit = rate - perUnitAmount;

      currentPage.drawText(discountPerUnit.toFixed(2), {
        x: 400,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      currentPage.drawText(amount.toFixed(2), {
        x: 470,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      currentY -= descHeight;
      currentPageItems++;
    });

    if (currentY < 300) {
      currentPage = pdfDoc.addPage([595, 842]);
      pages.push(currentPage);
      addWatermark(currentPage);
      currentY = 700;
    }

    let sectionY = currentY;

    currentPage.drawText("Subtotal:", {
      x: 350,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    const totalAmount = parseFloat(serviceBill.totalAmount) || 0;
    currentPage.drawText(totalAmount.toFixed(2), {
      x: 450,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    sectionY -= 20;
    if (serviceBill.taxEnabled) {
      currentPage.drawText(`Tax (${serviceBill.taxRate}%):`, {
        x: 350,
        y: sectionY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
      const taxAmount = parseFloat(serviceBill.taxAmount) || 0;
      currentPage.drawText(taxAmount.toFixed(2), {
        x: 450,
        y: sectionY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
      sectionY -= 20;
    }

    let discountAmount = 0;
    let discountLabel = "Discount:";
    if (serviceBill.discountType === "percentage") {
      discountAmount =
        ((serviceBill.discountPercentage || 0) / 100) * totalAmount;
      discountLabel = `Discount (${serviceBill.discountPercentage || 0}%):`;
    } else {
      discountAmount = parseFloat(serviceBill.discount) || 0;
    }
    currentPage.drawText(discountLabel, {
      x: 350,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    currentPage.drawText(discountAmount.toFixed(2), {
      x: 450,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    sectionY -= 20;

    currentPage.drawText("Advance Paid:", {
      x: 350,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    const advancePaid = parseFloat(serviceBill.advancePaid) || 0;
    currentPage.drawText(advancePaid.toFixed(2), {
      x: 450,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    sectionY -= 20;

    currentPage.drawText("Balance Due:", {
      x: 350,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    const balanceDue = parseFloat(serviceBill.balanceDue) || 0;
    currentPage.drawText(balanceDue.toFixed(2), {
      x: 450,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    sectionY -= 20;

    const grandTotal = parseFloat(serviceBill.grandTotal) || 0;
    currentPage.drawText("GRAND TOTAL:", {
      x: 350,
      y: sectionY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });
    currentPage.drawText(grandTotal.toFixed(2), {
      x: 450,
      y: sectionY,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    sectionY -= 40;

    currentPage.drawText("Payment Method:", {
      x: 50,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText((serviceBill.paymentMethod || "CASH").toUpperCase(), {
      x: 150,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    sectionY -= 20;

    currentPage.drawText("Payment Status:", {
      x: 50,
      y: sectionY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: fontBold,
    });
    currentPage.drawText(
      (serviceBill.paymentStatus || "PENDING").toUpperCase(),
      {
        x: 150,
        y: sectionY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );
    sectionY -= 20;

    const labelX = 50;
    const contentX = 150;
    const rightMargin = 545;
    const contentWidth = rightMargin - contentX;
    const fontSize = 9;
    const titleSize = 10;
    const lineHeight = 12;

    function wrapTextByWidth(text, maxWidth, font, size) {
      if (!text) return [];
      const words = text.split(/\s+/);
      const lines = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, size);
        if (width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }

          if (font.widthOfTextAtSize(word, size) > maxWidth) {
            let sub = "";
            for (const ch of word) {
              const testSub = sub + ch;
              if (font.widthOfTextAtSize(testSub, size) <= maxWidth) {
                sub = testSub;
              } else {
                if (sub) lines.push(sub);
                sub = ch;
              }
            }
            if (sub) currentLine = sub;
            else currentLine = "";
          } else {
            currentLine = word;
          }
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    const issues = (serviceBill.issuesReported || "").trim();
    const notes = (serviceBill.technicianNotes || "").trim();
    const warranty = (serviceBill.warrantyInfo || "").trim();

    const issuesLines = wrapTextByWidth(issues, contentWidth, font, fontSize);
    const notesLines = wrapTextByWidth(notes, contentWidth, font, fontSize);
    const warrantyLines = wrapTextByWidth(
      warranty,
      contentWidth,
      font,
      fontSize,
    );

    const neededHeight =
      (issuesLines.length > 0 ? (issuesLines.length + 1) * lineHeight + 8 : 0) +
      (notesLines.length > 0 ? (notesLines.length + 1) * lineHeight + 8 : 0) +
      (warrantyLines.length > 0
        ? (warrantyLines.length + 1) * lineHeight + 8
        : 0);

    if (sectionY - neededHeight < 140) {
      currentPage = pdfDoc.addPage([595, 842]);
      pages.push(currentPage);
      addWatermark(currentPage);
      sectionY = 780;
    }

    let cursorY = sectionY;

    if (issuesLines.length > 0) {
      currentPage.drawText("ISSUES REPORTED", {
        x: labelX,
        y: cursorY,
        size: titleSize,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
      cursorY -= lineHeight;
      issuesLines.forEach((line) => {
        currentPage.drawText(line, {
          x: contentX,
          y: cursorY,
          size: fontSize,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
        cursorY -= lineHeight;
      });
      cursorY -= 8;
    }

    if (notesLines.length > 0) {
      currentPage.drawText("TECHNICAL NOTES", {
        x: labelX,
        y: cursorY,
        size: titleSize,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
      cursorY -= lineHeight;
      notesLines.forEach((line) => {
        currentPage.drawText(line, {
          x: contentX,
          y: cursorY,
          size: fontSize,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
        cursorY -= lineHeight;
      });
      cursorY -= 8;
    }

    if (warrantyLines.length > 0) {
      currentPage.drawText("WARRANTY INFORMATION", {
        x: labelX,
        y: cursorY,
        size: titleSize,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
      cursorY -= lineHeight;
      warrantyLines.forEach((line) => {
        currentPage.drawText(line, {
          x: contentX,
          y: cursorY,
          size: fontSize,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
        cursorY -= lineHeight;
      });
      cursorY -= 8;
    }

    sectionY = cursorY;

    const footerY = 80;

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

    currentPage.drawText("Thank you for your business!", {
      x: 220,
      y: footerY - 30,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    currentPage.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      {
        x: 130,
        y: footerY - 50,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      },
    );

    const totalPages = pages.length;
    pages.forEach((page, index) => {
      addPageNumber(page, index + 1, totalPages);
    });

    const pdfBytes = await pdfDoc.save();
    console.log("PDF saved, bytes length:", pdfBytes.length);

    console.log("Returning buffer for download/preview (Vercel-compatible)");
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
