
const { PDFDocument, rgb, degrees } = require("pdf-lib");
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

const generateBuyLetterPDF = async (buyLetterData, returnBuffer = false, language = "hindi") => {
  try {
    console.log("Starting PDF generation for buy letter:", buyLetterData._id || "new letter");

    
    const templatePath = language === "hindi"
      ? path.join(__dirname, "../../frontend/public/templates/buyletter.pdf")
      : path.join(__dirname, "../../frontend/public/templates/englishbuyletter.pdf");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`PDF template not found: ${templatePath}`);
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const firstPage = pdfDoc.getPages()[0];

    
    const formattedData = {
      ...buyLetterData,
      saleDate: formatDate(buyLetterData.saleDate),
      todayDate: formatDate(buyLetterData.todayDate),
      todayDate1: formatDate(buyLetterData.todayDate),
      todayTime: formatTime(buyLetterData.todayTime),
      todayTime1: formatTime(buyLetterData.todayTime),
      saleTime: formatTime(buyLetterData.saleTime),
      saleAmount: formatRupee(buyLetterData.saleAmount),
      vehiclekm: formatKm(buyLetterData.vehiclekm),
      amountInWords: formatIndianAmountInWords(buyLetterData.saleAmount),
    };

    
    const fieldPositions = {
      sellerName: { x: 34, y: 632, size: 11 },
      sellerFatherName: { x: 322, y: 632, size: 11 },
      sellerCurrentAddress: { x: 50, y: 610, size: 11 },
      vehicleName: { x: 235, y: 590, size: 11 },
      vehicleModel: { x: 384, y: 590, size: 11 },
      vehicleColor: { x: 531, y: 590, size: 11 },
      registrationNumber: { x: 142, y: 571, size: 11 },
      chassisNumber: { x: 289, y: 571, size: 11 },
      engineNumber: { x: 476, y: 571, size: 11 },
      vehiclekm: { x: 81, y: 552, size: 11 },
      buyerName: { x: 345, y: 552, size: 11 },
      buyerFatherName: { x: 55, y: 533, size: 11 },
      buyerCurrentAddress: { x: 249, y: 533, size: 11 },
      saleDate: { x: 109, y: 514, size: 11 },
      saleTime: { x: 206, y: 514, size: 11 },
      saleAmount: { x: 297, y: 514, size: 11 },
      todayDate: { x: 176, y: 495, size: 11 },
      todayTime: { x: 300, y: 495, size: 11 },
      sellerName1: { x: 26, y: 457, size: 11 },
      sellerFatherName1: { x: 292, y: 457, size: 11 },
      buyerName1: { x: 26, y: 418, size: 11 },
      buyerFatherName1: { x: 334, y: 418, size: 11 },
      todayDate1: { x: 95, y: 438, size: 11 },
      todayTime1: { x: 193, y: 438, size: 11 },
      dealername: { x: 256, y: 380, size: 11 },
      dealeraddress: { x: 27, y: 362, size: 11 },
      selleraadhar: { x: 393, y: 215, size: 10 },
      sellerpan: { x: 391, y: 195, size: 10 },
      selleraadharphone: { x: 395, y: 176, size: 10 },
      selleraadharphone2: { x: 455, y: 176, size: 10 },
      witnessname: { x: 390, y: 87, size: 10 },
      witnessphone: { x: 390, y: 70, size: 10 },
      returnpersonname: { x: 427, y: 323, size: 10 },
      note: { x: 58, y: 18, size: 10 },
    };

    
    for (const [fieldName, position] of Object.entries(fieldPositions)) {
      if (fieldName === "selleraadharphone" && formattedData.selleraadharphone) {
        const combinedPhones = `${formattedData.selleraadharphone}${
          formattedData.selleraadharphone2 ? ` , ${formattedData.selleraadharphone2}` : ""
        }`;
        firstPage.drawText(combinedPhones, {
          x: position.x,
          y: position.y,
          size: position.size,
          color: rgb(0, 0, 0),
        });
      } else if (fieldName !== "selleraadharphone2" && formattedData[fieldName]) {
        firstPage.drawText(String(formattedData[fieldName]), {
          x: position.x,
          y: position.y,
          size: position.size,
          color: rgb(0, 0, 0),
        });
      }
    }

    
    const saleAmountText = formattedData.saleAmount || "";
    const saleAmountWidth = saleAmountText.length * (fieldPositions.saleAmount.size / 2);
    const amountInWordsX = fieldPositions.saleAmount.x + saleAmountWidth + 1.4 * (fieldPositions.saleAmount.size / 2);

    firstPage.drawText(formattedData.amountInWords, {
      x: amountInWordsX,
      y: fieldPositions.saleAmount.y,
      size: fieldPositions.saleAmount.size,
      color: rgb(0, 0, 0),
    });

    
    const invoicePage = pdfDoc.addPage([595, 842]);
    
    invoicePage.drawText("Vehicle Invoice", {
      x: 250,
      y: 800,
      size: 20,
      color: rgb(0, 0, 0),
    });

    if (returnBuffer) {
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } else {
      
      const uploadDir = path.join(__dirname, "../uploads/buy-letters");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `buy_letter_${buyLetterData._id || Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, pdfBytes);

      return fileName;
    }
  } catch (error) {
    console.error("Error generating buy letter PDF:", error);
    throw error;
  }
};

module.exports = generateBuyLetterPDF;
