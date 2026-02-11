
const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const formatIndianAmountInWords = (amount) => {
  if (isNaN(amount)) return "(Zero Rupees)";

  const num = parseFloat(amount);
  if (num === 0) return "(Zero Rupees)";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "Ten",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const convertLessThanHundred = (n) => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    return (
      tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
    );
  };

  const convertLessThanThousand = (n) => {
    if (n < 100) return convertLessThanHundred(n);
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return (
      units[hundred] +
      " Hundred" +
      (remainder !== 0 ? " and " + convertLessThanHundred(remainder) : "")
    );
  };

  const convert = (n) => {
    if (n === 0) return "Zero";

    let result = "";
    const crore = Math.floor(n / 10000000);
    if (crore > 0) {
      result += convertLessThanThousand(crore) + " Crore ";
      n = n % 10000000;
    }

    const lakh = Math.floor(n / 100000);
    if (lakh > 0) {
      result += convertLessThanThousand(lakh) + " Lakh ";
      n = n % 100000;
    }

    const thousand = Math.floor(n / 1000);
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + " Thousand ";
      n = n % 1000;
    }

    if (n > 0) {
      result += convertLessThanThousand(n);
    }

    return result.trim();
  };

  const amountInPaise = num;
  return `(${convert(amountInPaise)} Only)`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (timeString) => {
  if (!timeString) return "";

  const [hour, minute] = timeString.split(":").map(Number);

  const hours12 = hour % 12 || 12;
  const ampm = hour >= 12 ? "PM" : "AM";

  const formattedHours = String(hours12).padStart(2, "0");
  const formattedMinutes = String(minute).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const formatRupee = (val) => {
  if (val === undefined || val === null) return "0.00";
  const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : Number(val);
  return isNaN(num) ? "0.00" : new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatKm = (val) => {
  if (val === undefined || val === null) return "0.00";
  const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : Number(val);
  return isNaN(num) ? "0.00" : new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const generateSellLetterPDF = async (sellLetterData, returnBuffer = false, language = "hindi") => {
  try {
    console.log("Starting PDF generation for sell letter:", sellLetterData._id || "new letter");

    
    const templatePath = language === "hindi"
      ? path.join(__dirname, "../../frontend/public/templates/sellletter.pdf")
      : path.join(__dirname, "../../frontend/public/templates/englishsell.pdf");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`PDF template not found: ${templatePath}`);
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const firstPage = pdfDoc.getPages()[0];

    // embed logo for header/footer if available
    let logoImage = null;
    try {
      const logoPath = path.join(__dirname, "../../frontend/src/images/okmotorback.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        logoImage = await pdfDoc.embedPng(logoBytes);
      }
    } catch (logoErr) {
      console.warn("Logo not found for sell letter header:", logoErr.message || logoErr);
      logoImage = null;
    }

    const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const addHeaderFooterToPage = (page) => {
      try {
        // Header band
        page.drawRectangle({ x: 0, y: 780, width: 595, height: 80, color: rgb(0.047, 0.098, 0.196) });
        if (logoImage) {
          page.drawImage(logoImage, { x: 50, y: 743, width: 150, height: 120 });
        }
        page.drawText("UDAYAM-BR-26-0028550", { x: 330, y: 805, size: 14, color: rgb(1, 1, 1), font: headerFont });
        page.drawText("GSTIN: 22ABCDE1234F1Z5", { x: 330, y: 785, size: 14, color: rgb(1, 1, 1), font: headerFont });

        // Footer - centered thank you + muted address line
        try {
          const thank = "Thank you for your business!";
          const addr = "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
          const thankW = headerFont.widthOfTextAtSize(thank, 12);
          const addrW = headerFont.widthOfTextAtSize(addr, 9);
          const centerXThank = (595 - thankW) / 2;
          const centerXAddr = (595 - addrW) / 2;

          page.drawLine({ start: { x: 20, y: 52 }, end: { x: 575, y: 52 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
          page.drawText(thank, { x: centerXThank, y: 40, size: 12, color: rgb(0, 0, 0), font: headerFont });
          page.drawText(addr, { x: centerXAddr, y: 26, size: 9, color: rgb(0.45, 0.45, 0.45), font: headerFont });
        } catch (e) {}
      } catch (err) {
        console.warn("Failed to draw header/footer on page:", err && err.message ? err.message : err);
      }
    };

    // Add header/footer to existing pages except the first (letter) page
    const existingPages = pdfDoc.getPages();
    for (let i = 1; i < existingPages.length; i++) {
      addHeaderFooterToPage(existingPages[i]);
    }

    
    const formattedData = {
      ...sellLetterData,
      buyerName1: sellLetterData.buyerName,
      buyerName2: sellLetterData.buyerName,
      saleAmount: formatRupee(sellLetterData.saleAmount),
      amountInWords: formatIndianAmountInWords(sellLetterData.saleAmount),
      vehiclekm: formatKm(sellLetterData.vehiclekm),
      saleDate: formatDate(sellLetterData.saleDate),
      saleTime: formatTime(sellLetterData.saleTime),
      todayDate: formatDate(sellLetterData.todayDate || new Date()),
      todayTime: formatTime(sellLetterData.todayTime || "12:00"),
      previousDate: formatDate(sellLetterData.previousDate || sellLetterData.todayDate || new Date()),
      previousTime: formatTime(sellLetterData.previousTime || sellLetterData.todayTime || "12:00"),
    };

    
    const hindiFieldPositions = {
      vehicleName: { x: 303, y: 696, size: 11 },
      vehicleModel: { x: 39, y: 674, size: 11 },
      vehicleColor: { x: 453, y: 696, size: 11 },
      registrationNumber: { x: 296, y: 674, size: 11 },
      chassisNumber: { x: 433, y: 674, size: 11 },
      engineNumber: { x: 87, y: 652, size: 11 },
      vehiclekm: { x: 308, y: 652, size: 11 },
      buyerName: { x: 40, y: 629, size: 11 },
      buyerFatherName: { x: 278, y: 629, size: 11 },
      buyerAddress: { x: 65, y: 607, size: 11 },
      buyerName1: { x: 102, y: 495, size: 11 },
      buyerName2: { x: 102, y: 451, size: 11 },
      saleDate: { x: 78, y: 584, size: 11 },
      saleTime: { x: 180, y: 584, size: 11 },
      saleAmount: { x: 273, y: 584, size: 11 },
      todayDate: { x: 210, y: 562, size: 11 },
      todayTime: { x: 324, y: 562, size: 11 },
      previousDate: { x: 243, y: 517, size: 11 },
      previousTime: { x: 363, y: 517, size: 11 },
      buyerPhone: { x: 85, y: 240, size: 11 },
      buyerPhone2: { x: 150, y: 240, size: 11 },
      buyerAadhar: { x: 111, y: 222, size: 11 },
      witnessName: { x: 70, y: 122, size: 11 },
      witnessPhone: { x: 70, y: 106, size: 11 },
      note: { x: 60, y: 33, size: 10 },
    };

    const englishFieldPositions = {
      vehicleName: { x: 284, y: 680, size: 11 },
      vehicleModel: { x: 93, y: 660, size: 11 },
      vehicleColor: { x: 447, y: 680, size: 11 },
      registrationNumber: { x: 392, y: 660, size: 11 },
      chassisNumber: { x: 54, y: 640, size: 11 },
      engineNumber: { x: 263, y: 640, size: 11 },
      vehiclekm: { x: 455, y: 640, size: 11 },
      buyerName: { x: 185 - 16, y: 619, size: 11 },
      buyerFatherName: { x: 445 - 16, y: 619, size: 11 },
      buyerAddress: { x: 123 - 16, y: 599, size: 11 },
      buyerName1: { x: 120 - 16, y: 517, size: 11 },
      buyerName2: { x: 286 - 16, y: 482, size: 11 },
      saleDate: { x: 70 - 16, y: 578, size: 11 },
      saleTime: { x: 181 - 16, y: 578, size: 11 },
      saleAmount: { x: 285 - 16, y: 578, size: 11 },
      todayDate: { x: 156 - 16, y: 557, size: 11 },
      todayTime: { x: 291 - 16, y: 557, size: 11 },
      previousDate: { x: 240 - 16, y: 538, size: 11 },
      previousTime: { x: 340 - 16, y: 538, size: 11 },
      buyerPhone: { x: 109, y: 282, size: 11 },
      buyerPhone2: { x: 115, y: 282, size: 11 },
      buyerAadhar: { x: 137, y: 263, size: 11 },
      witnessName: { x: 105, y: 135, size: 11 },
      witnessPhone: { x: 105, y: 116, size: 11 },
      note: { x: 70, y: 35, size: 10 },
    };

    const positions = language === "hindi" ? hindiFieldPositions : englishFieldPositions;

    
    const saleAmountText = formattedData.saleAmount || "";
    const saleAmountWidth = saleAmountText.length * (positions.saleAmount.size / 2);
    const amountInWordsX = positions.saleAmount.x + saleAmountWidth + 1 * (positions.saleAmount.size / 1);

    firstPage.drawText(formattedData.amountInWords, {
      x: amountInWordsX,
      y: language === "hindi" ? 584 : 578,
      size: positions.saleAmount.size,
      color: rgb(0, 0, 0),
    });

    
    for (const [fieldName, position] of Object.entries(positions)) {
      if (fieldName === "buyerPhone" && formattedData.buyerPhone) {
        const combinedPhones = `${formattedData.buyerPhone}${
          formattedData.buyerPhone2 ? ` , ${formattedData.buyerPhone2}` : ""
        }`;
        firstPage.drawText(combinedPhones, {
          x: position.x,
          y: position.y,
          size: position.size,
          color: rgb(0, 0, 0),
        });
      } else if (fieldName !== "buyerPhone2" && formattedData[fieldName]) {
        firstPage.drawText(String(formattedData[fieldName]), {
          x: position.x,
          y: position.y,
          size: position.size,
          color: rgb(0, 0, 0),
        });
      }
    }

    
    const invoicePage = pdfDoc.addPage([595, 842]);
    // Ensure invoice page also has header/footer
    addHeaderFooterToPage(invoicePage);

    invoicePage.drawText("Vehicle Invoice", {
      x: 250,
      y: 800,
      size: 20,
      color: rgb(0, 0, 0),
      font: headerFont,
    });

    if (returnBuffer) {
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } else {
      
      const uploadDir = path.join(__dirname, "../uploads/sell-letters");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `sell_letter_${sellLetterData._id || Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, pdfBytes);

      return fileName;
    }
  } catch (error) {
    console.error("Error generating sell letter PDF:", error);
    throw error;
  }
};

module.exports = generateSellLetterPDF;
