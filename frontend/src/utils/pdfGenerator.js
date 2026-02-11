// utils/pdfGenerator.js
const { PDFDocument, rgb, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const formatTime12Hour = (timeString) => {
  try {
    if (!timeString) return "";

    // Handle Date objects
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

    // Handle string inputs
    if (typeof timeString === "string") {
      // Check if it's already in 12-hour format
      if (timeString.includes("AM") || timeString.includes("PM")) {
        return timeString;
      }

      // Handle ISO format or HH:MM format
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

      // Handle simple HH:MM strings
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
    // Defensive: convert Mongoose doc to plain object
    if (serviceBill && typeof serviceBill.toObject === "function") {
      serviceBill = serviceBill.toObject();
    }

    // Validate input
    if (!serviceBill || typeof serviceBill !== "object") {
      throw new Error("Invalid serviceBill parameter: must be an object");
    }
    if (!serviceBill.serviceItems || !Array.isArray(serviceBill.serviceItems)) {
      throw new Error("Invalid serviceBill: serviceItems must be an array");
    }

    // Parse all numeric fields safely
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

    // Set defaults for missing string fields
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

    // PDF generation
    const pdfDoc = await PDFDocument.create();
    const pages = [];
    let currentPage = pdfDoc.addPage([595, 842]);
    pages.push(currentPage);

    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    // Load logo
    const logoPath = path.join(
      __dirname,
      "../../frontend/src/images/okmotorback.png",
    );
    let logoImage;
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (logoError) {
      console.error("Error loading logo for PDF:", logoError);
      logoImage = null;
    }

    // Function to add watermark to a page
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

    // Function to add page number to a page
    const addPageNumber = (page, currentPageNum, totalPages) => {
      page.drawText(`${currentPageNum}/${totalPages}`, {
        x: 550,
        y: 30,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      });
    };

    // Add watermark to first page
    addWatermark(currentPage);

    // Header Section
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
      y: 800,
      size: 14,
      color: rgb(0.8, 0.8, 0.8),
      font: fontBold,
    });
    currentPage.drawText("GSTIN: 22ABCDE1234F1Z5", {
      x: 400,
      y: 780,
      size: 14,
      color: rgb(0.8, 0.8, 0.8),
      font: fontBold,
    });

    // Title Section
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

    // Invoice Info
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

    const currentDate = new Date();
    currentPage.drawText(
      `Date: ${currentDate.toLocaleDateString(
        "en-IN",
      )} Time: ${formatTime12Hour(currentDate)}`,
      {
        x: 400,
        y: 720,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );

    // Divider
    currentPage.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Business Information (if enabled)
    let customerY;
    if (Boolean(serviceBill.taxEnabled)) {
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

      // Adjust Y positions for other sections
      customerY = 600;
    } else {
      customerY = 690;
    }

    // Customer Information
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

    // Vehicle condition
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

    // Right Column - Service Information
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

    // Draw the first three service details
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

    // Immediately after service type, add custom description if applicable
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

      // Handle multi-line description
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

    // Service Items Table with pagination
    const itemsStartY = columnY - 140;
    const minItemsFirstPage = 25; // Minimum items to show on first page
    const maxItemsPerPage = 25; // Items per page after first page
    let currentY = itemsStartY;
    let currentPageItems = 0;
    let isFirstPage = true;

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

    // Function to draw table headers (added Discount column)
    const drawServiceItemHeaders = (page, y) => {
      const serviceHeaders = [
        "#",
        "Description",
        "Qty",
        "Rate Rs.",
        "Disc Rs.",
        "Amount Rs.",
      ];
      // positions: index, desc, qty, rate, discount, amount
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

    // Draw headers on first page
    drawServiceItemHeaders(currentPage, currentY);
    currentY -= 20;

    // Draw all service items with pagination
    // Ensure serviceItems is an array and has valid items
    if (!Array.isArray(serviceBill.serviceItems)) {
      console.warn("serviceItems is not an array:", serviceBill.serviceItems);
      return;
    }

    serviceBill.serviceItems.forEach((item, index) => {
      // Ensure item has required properties
      if (!item || typeof item !== "object") {
        console.warn("Invalid service item at index", index, ":", item);
        return;
      }
      // Check if we need a new page
      const shouldCreateNewPage =
        (!isFirstPage && currentPageItems >= maxItemsPerPage) ||
        (isFirstPage &&
          currentPageItems >= minItemsFirstPage &&
          currentY < 300);

      if (shouldCreateNewPage) {
        // Create new page
        currentPage = pdfDoc.addPage([595, 842]);
        pages.push(currentPage);
        addWatermark(currentPage); // Add watermark to new page
        isFirstPage = false;
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

      // Draw quantity, rate, discount and amount
      currentPage.drawText(item.quantity.toString(), {
        x: 300,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      // Ensure rate is a number and handle potential string values
      const rate = parseFloat(item.rate) || 0;
      currentPage.drawText(rate.toFixed(2), {
        x: 350,
        y: currentY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      // Compute amount (already validated earlier) and per-unit charged amount
      const amount = parseFloat(item.amount) || 0;
      const qty = parseFloat(item.quantity) || 0;
      const perUnitAmount = qty > 0 ? amount / qty : rate;
      // Discount per unit = rate - perUnitAmount (how much less than rate we charged)
      const discountPerUnit = rate - perUnitAmount;

      // Draw discount per unit
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

    // Ensure we have enough space for totals and footer (about 300pt)
    if (currentY < 300) {
      currentPage = pdfDoc.addPage([595, 842]);
      pages.push(currentPage);
      addWatermark(currentPage); // Add watermark to new page
      currentY = 700; // Start lower on new page to leave room
    }

    // Use dynamic Y position for all totals and subsequent sections
    let sectionY = currentY;

    // Totals Section
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

    // Discount
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

    // Advance Paid
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

    // Balance Due
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
    // Payment Information
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

    // Issues Reported
    currentPage.drawText("ISSUES REPORTED", {
      x: 50,
      y: sectionY,
      size: 10,
      color: rgb(0.047, 0.098, 0.196),
      font: fontBold,
    });

    const issues = serviceBill.issuesReported || "";
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

    // Technical Notes
    const technicianNotes = serviceBill.technicianNotes || "";
    const technicianNotesLines = splitTextIntoLines(
      technicianNotes,
      maxCharsPerLine,
    );

    if (technicianNotesLines.length > 0) {
      currentPage.drawText("TECHNICAL NOTES", {
        x: 50,
        y: startY - issuesLines.length * lineHeight - 60,
        size: 10,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      technicianNotesLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: 150,
          y:
            startY -
            issuesLines.length * lineHeight -
            60 -
            (index + 1) * lineHeight,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    }

    // Warranty Information
    const warrantyInfo = serviceBill.warrantyInfo || "";
    const warrantyInfoLines = splitTextIntoLines(warrantyInfo, maxCharsPerLine);

    if (warrantyInfoLines.length > 0) {
      const warrantyStartY =
        startY -
        issuesLines.length * lineHeight -
        (technicianNotesLines.length > 0
          ? technicianNotesLines.length * lineHeight + 60
          : 0) -
        60;

      currentPage.drawText("WARRANTY INFORMATION", {
        x: 50,
        y: warrantyStartY,
        size: 10,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      warrantyInfoLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: 150,
          y: warrantyStartY - (index + 1) * lineHeight,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    }

    // Grand Total at the very end

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
      },
    );

    // Add page numbers to all pages
    const totalPages = pages.length;
    pages.forEach((page, index) => {
      addPageNumber(page, index + 1, totalPages);
    });

    const pdfBytes = await pdfDoc.save();
    console.log("PDF saved, bytes length:", pdfBytes.length);

    if (returnBuffer) {
      console.log("Returning buffer for download/preview");
      return Buffer.from(pdfBytes);
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
