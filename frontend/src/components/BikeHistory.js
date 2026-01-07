import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { loadPDFTemplate } from "../utils/pdfTemplateLoader";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  ShipWheel,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Bike,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Download,
  Eye,
  Menu,
  Settings,
  RefreshCw,
  Image,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";

const BikeHistory = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeMenu, setActiveMenu] = useState("Bike History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [bikeHistory, setBikeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

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
    return timeString;
  };

  const formatTime12Hour = (timeString) => {
    if (!timeString) return "";
    try {
      const time = new Date(`1970-01-01T${timeString}`);
      return time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatRupee = (amount) => {
    if (!amount) return "";
    return `Rs.${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatKm = (km) => {
    if (!km) return "";
    return `${Number(km).toLocaleString("en-IN")} KM`;
  };

  const formatIndianAmountInWords = (amount) => {
    if (isNaN(amount)) return "Zero Rupees";

    const num = parseFloat(amount);
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
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const converthundreds = (num) => {
      let result = "";

      if (num > 99) {
        result += units[Math.floor(num / 100)] + " hundred ";
        num %= 100;
      }

      if (num >= 11 && num <= 19) {
        result += teens[num - 10] + " ";
      } else if (num === 10) {
        result += "Ten ";
      } else {
        if (num >= 20) {
          result += tens[Math.floor(num / 10)] + " ";
          num %= 10;
        }
        if (num > 0) {
          result += units[num] + " ";
        }
      }

      return result;
    };

    if (num === 0) return "Zero Rupees";
    if (num < 0) return "Negative " + formatIndianAmountInWords(-num);

    let result = "";
    let crores = Math.floor(num / 10000000);
    let lakhs = Math.floor((num % 10000000) / 100000);
    let thousands = Math.floor((num % 100000) / 1000);
    let hundreds = num % 1000;

    if (crores > 0) {
      result += converthundreds(crores) + "Crore ";
    }
    if (lakhs > 0) {
      result += converthundreds(lakhs) + "Lakh ";
    }
    if (thousands > 0) {
      result += converthundreds(thousands) + "Thousand ";
    }
    if (hundreds > 0) {
      result += converthundreds(hundreds);
    }

    return result.trim() + " Rupees Only";
  };

  const formatAadhar = (val) =>
    val
      ? val
          .replace(/\D/g, "")
          .match(/.{1,4}/g)
          ?.join("-") || ""
      : "";

  const buyLetterFieldPositions = {
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
    note: { x: 60, y: 18, size: 10 },
  };

  const sellLetterFieldPositions = {
    vehicleName: { x: 303, y: 696, size: 11 },
    vehicleModel: { x: 39, y: 674, size: 11 },
    vehicleColor: { x: 453, y: 696, size: 11 },
    registrationNumber: { x: 296, y: 674, size: 11 },
    chassisNumber: { x: 433, y: 674, size: 11 },
    engineNumber: { x: 87, y: 652, size: 11 },
    vehiclekm: { x: 308, y: 652, size: 11 },
    buyerName: { x: 40, y: 629, size: 11 },
    buyerFatherName: { x: 278, y: 629, size: 11 },
    buyerAddress: { x: 65, y: 606, size: 11 },
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
    witnessName: { x: 70, y: 121, size: 11 },
    witnessPhone: { x: 70, y: 105, size: 11 },
    note: { x: 60, y: 33, size: 10 },
  };

  const downloadBuyLetterPDF = async (letter) => {
    try {
      const existingPdfBytes = await loadPDFTemplate("buyletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        sellerName1: letter.sellerName,
        sellerFatherName1: letter.sellerFatherName,
        buyerFatherName1: letter.buyerFatherName,
        buyerCurrentAddress1: letter.buyerCurrentAddress,
        todayDate1: formatDate(letter.todayDate),
        todayTime: formatTime(letter.todayTime),
        todayTime1: formatTime(letter.todayTime),
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime(letter.saleTime),
        todayDate: formatDate(letter.todayDate),
        saleAmount: formatRupee(letter.saleAmount),
        vehiclekm: formatKm(letter.vehiclekm),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),

        dealername: letter.dealername || "",
        dealeraddress: letter.dealeraddress || "",
        selleraadhar: letter.selleraadhar || "",
        sellerpan: letter.sellerpan || "",
        selleraadharphone: letter.selleraadharphone || "",
        selleraadharphone2: letter.selleraadharphone2 || "",
        witnessname: letter.witnessname || "",
        witnessphone: letter.witnessphone || "",
        returnpersonname: letter.returnpersonname || "",
        note: letter.note || "",
      };

      for (const [fieldName, position] of Object.entries(
        buyLetterFieldPositions
      )) {
        if (formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      const saleAmountText = formattedData.saleAmount || "";
      const saleAmountWidth =
        saleAmountText.length * (buyLetterFieldPositions.saleAmount.size / 2);
      const amountInWordsX =
        buyLetterFieldPositions.saleAmount.x +
        saleAmountWidth +
        1.4 * (buyLetterFieldPositions.saleAmount.size / 2);

      pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: buyLetterFieldPositions.saleAmount.y,
        size: buyLetterFieldPositions.saleAmount.size,
        color: rgb(0, 0, 0),
      });

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `buy_letter_${letter.registrationNumber}_${formatDate(
        letter.date
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating buy letter PDF:", error);
      alert("Failed to generate buy letter PDF");
    }
  };

  const downloadSellLetterPDF = async (letter) => {
    try {
      const existingPdfBytes = await loadPDFTemplate("sellletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime12Hour(letter.saleTime),
        vehiclekm: formatKm(letter.vehiclekm),
        todayDate: formatDate(letter.todayDate || new Date()),
        todayTime: formatTime12Hour(letter.todayTime || "12:00"),
        previousDate: formatDate(
          letter.previousDate || letter.todayDate || new Date()
        ),
        previousTime: formatTime12Hour(
          letter.previousTime || letter.todayTime || "12:00"
        ),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),
        saleAmount: formatRupee(letter.saleAmount),

        buyerPhone: letter.buyerPhone || "",
        buyerPhone2: letter.buyerPhone2 || "",
        buyerAadhar: letter.buyerAadhar || "",
        witnessName: letter.witnessName || "",
        witnessPhone: letter.witnessPhone || "",
        note: letter.note || "",
      };

      for (const [fieldName, position] of Object.entries(
        sellLetterFieldPositions
      )) {
        if (formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      if (formattedData.saleAmount && formattedData.amountInWords) {
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const saleText = `${formattedData.saleAmount}`;
        const xBase = sellLetterFieldPositions.saleAmount.x;
        const yBase = sellLetterFieldPositions.saleAmount.y;

        const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
        page.drawText(formattedData.amountInWords, {
          x: xBase + saleTextWidth + 8,
          y: yBase,
          size: 10,
          color: rgb(0, 0, 0),
          font,
        });
      }

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoiceForSell(invoicePage, pdfDoc, letter);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `sell_letter_${letter.registrationNumber}_${formatDate(
        letter.date
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating sell letter PDF:", error);
      alert("Failed to generate sell letter PDF");
    }
  };

  const drawVehicleInvoice = async (page, pdfDoc, letter) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1;
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 80,
      color: rgb(0.047, 0.098, 0.196),
    });

    page.drawImage(logoImage, {
      x: 50,
      y: 740,
      width: 160,
      height: 130,
    });
    page.drawImage(logoImage, {
      x: 280,
      y: 200,
      width: 370,
      height: 300,
      opacity: 0.3,
      rotate: degrees(45),
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 805,
      size: 18,
      color: rgb(1, 1, 1),
      font: font,
    });
    page.drawText(
      "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
      {
        x: 50,
        y: 770,
        size: 8,
        color: rgb(0.8, 0.8, 0.8),
        font: font,
      }
    );
    page.drawRectangle({
      x: 0,
      y: 750,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("VEHICLE BUY INVOICE", {
      x: 200,
      y: 758,
      size: 18,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")}`;

    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Date: ${formatDate(letter.todayDate)}`, {
      x: 400,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`Time: ${formatTime(letter.saleTime)}`, {
      x: 450,
      y: 700,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("CUSTOMER DETAILS", {
      x: 50,
      y: 690,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Name: ${letter.sellerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const address = letter.sellerCurrentAddress || "N/A";
    const maxCharsPerLine = 38;
    const lineHeight = 12;
    const label = "Address: ";
    const labelWidth = 45;

    const addressLines = [];
    for (let i = 0; i < address.length; i += maxCharsPerLine) {
      addressLines.push(address.substring(i, i + maxCharsPerLine));
    }

    addressLines.forEach((line, index) => {
      const text = index === 0 ? `${label}${line}` : line;
      const xPos = index === 0 ? 60 : 60 + labelWidth;

      page.drawText(text, {
        x: xPos,
        y: 650 - index * lineHeight,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });
    page.drawText(`Phone: ${letter.selleraadharphone || "N/A"}`, {
      x: 350,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`, ${letter.selleraadharphone2 || "N/A"}`, {
      x: 440,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Aadhar: ${formatAadhar(letter.selleraadhar) || "N/A"}`, {
      x: 350,
      y: 650,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`PAN: ${letter.sellerpan || "N/A"}`, {
      x: 350,
      y: 635,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: 605,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
    page.drawRectangle({
      x: 50,
      y: 575,
      width: 495,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText("Condition: " + (letter.vehicleCondition || "N/A"), {
      x: 60,
      y: 581,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const vehicleHeaders = [
      "Make",
      "Model",
      "Color",
      "Reg No",
      "Chassis",
      "Engine",
      "KM",
    ];
    const vehicleHeaderPositions = [60, 120, 180, 220, 280, 370, 460];

    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: vehicleHeaderPositions[index],
        y: 555,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: boldFont,
      });
    });
    const vehicleValues = [
      letter.vehicleName || "N/A",
      letter.vehicleModel || "N/A",
      letter.vehicleColor || "N/A",
      letter.registrationNumber || "N/A",
      letter.chassisNumber || "N/A",
      letter.engineNumber || "N/A",
      letter.vehiclekm ? `${formatKm(letter.vehiclekm)} km` : "N/A",
    ];

    const columnWidths = [60, 60, 40, 60, 80, 80, 40, 60];

    vehicleValues.forEach((value, index) => {
      const maxWidth = columnWidths[index];
      const xPos = vehicleHeaderPositions[index];
      let yPos = 543;

      const lines = [];
      let currentLine = "";

      for (const word of value.split(" ")) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);

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
          x: xPos,
          y: yPos - lineIndex * lineHeight,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    });

    page.drawText("BUY INFORMATION", {
      x: 50,
      y: 510,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Buy Date: ${formatDate(letter.saleDate)}`, {
      x: 60,
      y: 490,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Buy Amount: ${formatRupee(letter.saleAmount)}`, {
      x: 200,
      y: 490,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(
      `Payment: ${
        letter.paymentMethod ? letter.paymentMethod.toUpperCase() : "CASH"
      }`,
      {
        x: 350,
        y: 490,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );
    page.drawText(
      `Amount in Words: ${formatIndianAmountInWords(letter.saleAmount)}`,
      {
        x: 60,
        y: 460,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawText("TERMS & CONDITIONS", {
      x: 40,
      y: 430,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    const terms = [
      "1. No refunds after invoice billing, except for transfer issues reported within 15 days.",
      "2. Customer signature confirms acceptance of all terms.",
      `3. OK MOTORS has paid the money amount of ${formatRupee(
        letter.saleAmount
      )} to ${letter.sellerName}.`,
      "4. The seller confirms that the vehicle is free from any loans, liabilities, or pending challans at the time of sale.",
      "5. The seller agrees to provide all original documents including RC, insurance, and ID proof at the time of sale.",
      "6. OK MOTORS is not responsible for any past violations, legal disputes, or ownership claims before the date of purchase.",
      "7. The seller confirms that the bike has not been involved in any major accidents or insurance claims.",
      "8. Vehicle handover includes all keys, documents, and accessories as agreed.",
      "9. The seller confirms that the chassis and engine numbers are intact and not tampered with.",
    ];

    terms.forEach((term, index) => {
      page.drawText(term, {
        x: 40,
        y: 410 - index * 15,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: font,
      });
    });

    if (letter.note) {
      page.drawText("ADDITIONAL NOTES", {
        x: 40,
        y: 170,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: boldFont,
      });

      const noteText = letter.note;
      const maxNoteWidth = 500;
      const noteLines = [];
      let currentNoteLine = "";

      for (const word of noteText.split(" ")) {
        const testLine = currentNoteLine ? `${currentNoteLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);

        if (testWidth <= maxNoteWidth) {
          currentNoteLine = testLine;
        } else {
          if (currentNoteLine) noteLines.push(currentNoteLine);
          currentNoteLine = word;
        }
      }
      if (currentNoteLine) noteLines.push(currentNoteLine);

      noteLines.forEach((line, index) => {
        page.drawText(line, {
          x: 60,
          y: 145 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    }

    page.drawText("Seller Signature", {
      x: 110,
      y: 120,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 115 },
      end: { x: 250, y: 115 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Authorized Signatory", {
      x: 350,
      y: 120,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 115 },
      end: { x: 500, y: 115 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawLine({
      start: { x: 50, y: 70 },
      end: { x: 545, y: 70 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your business!", {
      x: 220,
      y: 50,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      {
        x: 130,
        y: 30,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );
  };

  const drawVehicleInvoiceForSell = async (page, pdfDoc, letter) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1;
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 80,
      color: rgb(0.047, 0.098, 0.196),
    });

    page.drawImage(logoImage, {
      x: 50,
      y: 740,
      width: 160,
      height: 130,
    });
    page.drawImage(logoImage, {
      x: 280,
      y: 200,
      width: 370,
      height: 300,
      opacity: 0.3,
      rotate: degrees(45),
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 805,
      size: 18,
      color: rgb(1, 1, 1),
      font: font,
    });
    page.drawText(
      "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
      {
        x: 50,
        y: 770,
        size: 8,
        color: rgb(0.8, 0.8, 0.8),
        font: font,
      }
    );
    page.drawRectangle({
      x: 0,
      y: 750,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("VEHICLE SALE INVOICE", {
      x: 200,
      y: 758,
      size: 18,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")}`;

    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Date: ${formatDate(letter.todayDate || letter.saleDate)}`, {
      x: 400,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`Time: ${formatTime(letter.saleTime)}`, {
      x: 530,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("BUYER DETAILS", {
      x: 50,
      y: 690,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Name: ${letter.buyerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Father's Name: ${letter.buyerFatherName || "N/A"}`, {
      x: 300,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const address = letter.buyerAddress || "N/A";
    const maxCharsPerLine = 38;
    const lineHeight = 12;
    const label = "Address: ";
    const labelWidth = 45;

    const addressLines = [];
    for (let i = 0; i < address.length; i += maxCharsPerLine) {
      addressLines.push(address.substring(i, i + maxCharsPerLine));
    }

    addressLines.forEach((line, index) => {
      const text = index === 0 ? `${label}${line}` : line;
      const xPos = index === 0 ? 60 : 60 + labelWidth;

      page.drawText(text, {
        x: xPos,
        y: 650 - index * lineHeight,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    page.drawText(`Phone: ${letter.buyerPhone || "N/A"}`, {
      x: 350,
      y: 635,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    if (letter.buyerPhone2) {
      page.drawText(`, ${letter.buyerPhone2}`, {
        x: 440,
        y: 635,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    }

    if (letter.buyerAadhar) {
      page.drawText(`Aadhar: ${formatAadhar(letter.buyerAadhar)}`, {
        x: 350,
        y: 620,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    }

    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: 590,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
    page.drawRectangle({
      x: 50,
      y: 560,
      width: 495,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText("Condition: " + (letter.vehicleCondition || "N/A"), {
      x: 60,
      y: 566,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const vehicleHeaders = [
      "Make",
      "Model",
      "Color",
      "Reg No",
      "Chassis",
      "Engine",
      "KM",
    ];
    const vehicleHeaderPositions = [60, 120, 180, 220, 280, 370, 460];

    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: vehicleHeaderPositions[index],
        y: 540,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: boldFont,
      });
    });

    const vehicleValues = [
      letter.vehicleName || "N/A",
      letter.vehicleModel || "N/A",
      letter.vehicleColor || "N/A",
      letter.registrationNumber || "N/A",
      letter.chassisNumber || "N/A",
      letter.engineNumber || "N/A",
      letter.vehiclekm ? `${formatKm(letter.vehiclekm)} km` : "N/A",
    ];

    const columnWidths = [60, 60, 40, 60, 80, 80, 40, 60];

    vehicleValues.forEach((value, index) => {
      const maxWidth = columnWidths[index];
      const xPos = vehicleHeaderPositions[index];
      let yPos = 528;

      const lines = [];
      let currentLine = "";

      for (const word of value.split(" ")) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);

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
          x: xPos,
          y: yPos - lineIndex * lineHeight,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    });

    page.drawText("SELL INFORMATION", {
      x: 50,
      y: 495,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Sell Date: ${formatDate(letter.saleDate)}`, {
      x: 60,
      y: 475,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Sell Amount: ${formatRupee(letter.saleAmount)}`, {
      x: 200,
      y: 475,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(
      `Payment: ${
        letter.paymentMethod ? letter.paymentMethod.toUpperCase() : "CASH"
      }`,
      {
        x: 350,
        y: 475,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawText(
      `Amount in Words: ${formatIndianAmountInWords(letter.saleAmount)}`,
      {
        x: 60,
        y: 445,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawRectangle({
      x: 0,
      y: 335,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText("GUARRANTEE & WARRANTY CERTIFICATE", {
      x: 130,
      y: 345,
      size: 17,
      color: rgb(0, 0, 0),
      fontWeight: "bold",
      font: boldFont,
    });
    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 385,
      size: 18,
      color: rgb(1, 1, 1),
      font: font,
    });

    page.drawText("TERMS & CONDITIONS", {
      x: 50,
      y: 305,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    const terms = [
      "1. No refunds after invoice billing, except for transfer issues reported within 15 days.",
      "2. A 3-month guarantee is provided on the entire engine.",
      "3. Engine warranty extends from 6 months to 1 year for performance defects.",
      "4. Clutch plate is not covered under any guarantee or warranty.",
      "5. Monthly servicing during the 3-month guarantee is mandatory.",
      "6. First 3 services are free, with minimal charges for oil and parts (excluding engine).",
      "7. Defects must be reported within 24 hours of purchase to avoid repair charges.",
      "8. Delay in transfer beyond 15 days incurs Rs. 17/day penalty.",
      "9. Customer signature confirms acceptance of all terms.",
      `10. OK MOTORS has received the money amount ${formatRupee(
        letter.saleAmount
      )} from ${letter.buyerName}.`,
      "11. It is compulsory to get the vehicle serviced after driving 1500-1800 km otherwise guarantee will be expired.",
    ];

    terms.forEach((term, index) => {
      page.drawText(term, {
        x: 60,
        y: 285 - index * 15,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: font,
      });
    });

    if (letter.note) {
      page.drawText("ADDITIONAL NOTES", {
        x: 40,
        y: 100,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: boldFont,
      });

      const noteText = letter.note;
      const maxNoteWidth = 500;
      const noteLines = [];
      let currentNoteLine = "";

      for (const word of noteText.split(" ")) {
        const testLine = currentNoteLine ? `${currentNoteLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);

        if (testWidth <= maxNoteWidth) {
          currentNoteLine = testLine;
        } else {
          if (currentNoteLine) noteLines.push(currentNoteLine);
          currentNoteLine = word;
        }
      }
      if (currentNoteLine) noteLines.push(currentNoteLine);

      noteLines.forEach((line, index) => {
        page.drawText(line, {
          x: 60,
          y: 75 - index * 12,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    }

    page.drawText("Buyer Signature", {
      x: 120,
      y: 70,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 85 },
      end: { x: 250, y: 85 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Seller Signature (OK MOTORS)", {
      x: 330,
      y: 70,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 85 },
      end: { x: 500, y: 85 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: 545, y: 50 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your business!", {
      x: 220,
      y: 30,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      {
        x: 130,
        y: 15,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );
  };

  const fetchBikeHistory = useCallback(async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const [buyLetters, sellLetters, serviceBills, advanceBills] =
        await Promise.all([
          axios.get(
            `http://localhost:3500/api/buy-letter/by-registration?registrationNumber=${searchTerm}`
          ),
          axios.get(
            `http://localhost:3500/api/sell-letters/by-registration?registrationNumber=${searchTerm}`
          ),
          axios.get(
            `http://localhost:3500/api/service-bills/by-registration?registrationNumber=${searchTerm}`
          ),
          axios.get(
            `http://localhost:3500/api/advance-bills/by-registration?registrationNumber=${searchTerm}`
          ),
        ]);

      const buyData =
        buyLetters.status === 200
          ? Array.isArray(buyLetters.data)
            ? buyLetters.data
            : []
          : [];
      const sellData =
        sellLetters.status === 200
          ? Array.isArray(sellLetters.data)
            ? sellLetters.data
            : []
          : [];
      const serviceData =
        serviceBills.status === 200
          ? Array.isArray(serviceBills.data?.data)
            ? serviceBills.data.data
            : Array.isArray(serviceBills.data)
            ? serviceBills.data
            : []
          : [];
      const advanceData =
        advanceBills.status === 200
          ? Array.isArray(advanceBills.data)
            ? advanceBills.data
            : []
          : [];

      if (
        buyData.length === 0 &&
        sellData.length === 0 &&
        serviceData.length === 0 &&
        advanceData.length === 0
      ) {
        setBikeHistory([]);
        return;
      }

      const combinedData = [
        ...buyData.map((item) => ({
          ...item,
          type: "buy",
          date: item.saleDate || item.createdAt,
        })),
        ...sellData.map((item) => ({
          ...item,
          type: "sell",
          date: item.saleDate || item.createdAt,
        })),
        ...serviceData.map((item) => ({
          ...item,
          type: "service",
          date: item.serviceDate || item.createdAt,
        })),
        ...advanceData.map((item) => ({
          ...item,
          type: "advance",
          date: item.createdAt,
        })),
      ];

      combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBikeHistory(combinedData);
    } catch (error) {
      console.error("Error fetching bike history:", error);
      setBikeHistory([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const previewBuyLetterPDF = async (letter) => {
    try {
      const existingPdfBytes = await loadPDFTemplate("buyletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        sellerName1: letter.sellerName,
        sellerFatherName1: letter.sellerFatherName,
        buyerFatherName1: letter.buyerFatherName,
        buyerCurrentAddress1: letter.buyerCurrentAddress,
        todayDate1: formatDate(letter.todayDate),
        todayTime: formatTime(letter.todayTime),
        todayTime1: formatTime(letter.todayTime),
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime(letter.saleTime),
        todayDate: formatDate(letter.todayDate),
        saleAmount: formatRupee(letter.saleAmount),
        vehiclekm: formatKm(letter.vehiclekm),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),

        dealername: letter.dealername || "",
        dealeraddress: letter.dealeraddress || "",
        selleraadhar: letter.selleraadhar || "",
        sellerpan: letter.sellerpan || "",
        selleraadharphone: letter.selleraadharphone || "",
        selleraadharphone2: letter.selleraadharphone2 || "",
        witnessname: letter.witnessname || "",
        witnessphone: letter.witnessphone || "",
        returnpersonname: letter.returnpersonname || "",
        note: letter.note || "",
      };

      for (const [fieldName, position] of Object.entries(
        buyLetterFieldPositions
      )) {
        if (formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      const saleAmountText = formattedData.saleAmount || "";
      const saleAmountWidth =
        saleAmountText.length * (buyLetterFieldPositions.saleAmount.size / 2);
      const amountInWordsX =
        buyLetterFieldPositions.saleAmount.x +
        saleAmountWidth +
        1.4 * (buyLetterFieldPositions.saleAmount.size / 2);

      pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: buyLetterFieldPositions.saleAmount.y,
        size: buyLetterFieldPositions.saleAmount.size,
        color: rgb(0, 0, 0),
      });

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (error) {
      console.error("Error generating buy letter PDF preview:", error);
      alert("Failed to generate buy letter PDF preview");
    }
  };

  const previewSellLetterPDF = async (letter) => {
    try {
      const existingPdfBytes = await loadPDFTemplate("sellletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime12Hour(letter.saleTime),
        vehiclekm: formatKm(letter.vehiclekm),
        todayDate: formatDate(letter.todayDate || new Date()),
        todayTime: formatTime12Hour(letter.todayTime || "12:00"),
        previousDate: formatDate(
          letter.previousDate || letter.todayDate || new Date()
        ),
        previousTime: formatTime12Hour(
          letter.previousTime || letter.todayTime || "12:00"
        ),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),
        saleAmount: formatRupee(letter.saleAmount),

        buyerPhone: letter.buyerPhone || "",
        buyerPhone2: letter.buyerPhone2 || "",
        buyerAadhar: letter.buyerAadhar || "",
        witnessName: letter.witnessName || "",
        witnessPhone: letter.witnessPhone || "",
        note: letter.note || "",
      };

      for (const [fieldName, position] of Object.entries(
        sellLetterFieldPositions
      )) {
        if (formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      if (formattedData.saleAmount && formattedData.amountInWords) {
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const saleText = `${formattedData.saleAmount}`;
        const xBase = sellLetterFieldPositions.saleAmount.x;
        const yBase = sellLetterFieldPositions.saleAmount.y;

        const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
        page.drawText(formattedData.amountInWords, {
          x: xBase + saleTextWidth + 8,
          y: yBase,
          size: 10,
          color: rgb(0, 0, 0),
          font,
        });
      }

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoiceForSell(invoicePage, pdfDoc, letter);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (error) {
      console.error("Error generating sell letter PDF preview:", error);
      alert("Failed to generate sell letter PDF preview");
    }
  };

  const fetchPdf = async (id, type) => {
    try {
      if (type === "buy") {
        const letter = bikeHistory.find(
          (item) => item._id === id && item.type === "buy"
        );
        if (letter) {
          await previewBuyLetterPDF(letter);
        } else {
          alert("Buy letter data not found");
        }
        return;
      } else if (type === "sell") {
        const letter = bikeHistory.find(
          (item) => item._id === id && item.type === "sell"
        );
        if (letter) {
          await previewSellLetterPDF(letter);
        } else {
          alert("Sell letter data not found");
        }
        return;
      } else if (type === "service") {
        const endpoint = `http://localhost:3500/api/service-bills/${id}/pdf`;
        const response = await axios.get(endpoint, {
          responseType: "blob",
        });
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setShowPdfModal(true);
      } else if (type === "advance") {
        const endpoint = `http://localhost:3500/api/advance-bills/${id}/pdf`;
        const response = await axios.get(endpoint, {
          responseType: "blob",
        });
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setShowPdfModal(true);
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
      alert("Failed to load PDF document");
    }
  };

  const downloadPdf = async (id, type, fileName) => {
    try {
      if (type === "buy") {
        const letter = bikeHistory.find(
          (item) => item._id === id && item.type === "buy"
        );
        if (letter) {
          await downloadBuyLetterPDF(letter);
        } else {
          alert("Buy letter data not found");
        }
        return;
      } else if (type === "sell") {
        const letter = bikeHistory.find(
          (item) => item._id === id && item.type === "sell"
        );
        if (letter) {
          await downloadSellLetterPDF(letter);
        } else {
          alert("Sell letter data not found");
        }
        return;
      } else if (type === "service") {
        const endpoint = `http://localhost:3500/api/service-bills/${id}/pdf`;
        const response = await axios.get(endpoint, {
          responseType: "blob",
        });
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || `service-bill-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (type === "advance") {
        const endpoint = `http://localhost:3500/api/advance-bills/${id}/download`;
        const response = await axios.get(endpoint, {
          responseType: "blob",
        });
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || `advance-receipt-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF document");
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchBikeHistory();
      } else {
        setBikeHistory([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchBikeHistory]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const getActionIcon = (type) => {
    switch (type) {
      case "buy":
        return <ArrowDownLeft size={16} color="#3b82f6" />;
      case "sell":
        return <ArrowUpRight size={16} color="#ef4444" />;
      case "service":
        return <Wrench size={16} color="#10b981" />;
      case "advance":
        return <FileText size={16} color="#f59e0b" />;
      default:
        return <FileText size={16} />;
    }
  };

  const getActionLabel = (type) => {
    switch (type) {
      case "buy":
        return "Purchased";
      case "sell":
        return "Sold";
      case "service":
        return "Serviced";
      case "advance":
        return "Advance Payment";
      default:
        return "Activity";
    }
  };

  const getAmount = (item) => {
    if (item.type === "buy" || item.type === "sell") {
      return `Rs.${item.saleAmount}`;
    }
    if (item.type === "service") {
      return `Rs.${item.grandTotal}`;
    }
    if (item.type === "advance") {
      return `Rs.${item.advancePaid}`;
    }
    return "";
  };

  const getFileName = (item) => {
    const registrationNumber = searchTerm.replace(/\s+/g, "_");
    const date = new Date(item.date)
      .toLocaleDateString("en-IN")
      .replace(/\//g, "-");

    switch (item.type) {
      case "buy":
        return `Buy_Letter_${registrationNumber}_${date}.pdf`;
      case "sell":
        return `Sell_Letter_${registrationNumber}_${date}.pdf`;
      case "service":
        return `Service_Bill_${registrationNumber}_${date}.pdf`;
      case "advance":
        return `Advance_Receipt_${registrationNumber}_${date}.pdf`;
      default:
        return `Document_${registrationNumber}_${date}.pdf`;
    }
  };

  const getDetails = (item) => {
    if (item.type === "buy") {
      return `Purchased from ${item.sellerName}`;
    }
    if (item.type === "sell") {
      return `Sold to ${item.buyerName}`;
    }
    if (item.type === "service") {
      return `Service: ${item.serviceType} (${
        item.serviceItems?.length || 0
      } items)`;
    }
    if (item.type === "advance") {
      return `Advance payment by ${item.customerName}`;
    }
    return "";
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: (userRole) => (userRole === "admin" ? "/admin" : "/staff"),
    },
    {
      name: "Vehicle",
      icon: ShipWheel,
      submenu: [
        { name: "Add Vehicle", path: "/vehicle/create" },
        { name: "Vehicle List", path: "/vehicle/history" },
      ],
    },
    {
      name: "Buy",
      icon: ShoppingCart,
      submenu: [
        { name: "Create Buy Letter", path: "/buy/create" },
        { name: "Buy Letter History", path: "/buy/history" },
      ],
    },
    {
      name: "Sell",
      icon: TrendingUp,
      submenu: [
        { name: "Create Sell Letter", path: "/sell/create" },
        { name: "Sell Letter History", path: "/sell/history" },
      ],
    },
    {
      name: "Sell",
      icon: TrendingUp,
      submenu: [
        { name: "Create Sell Letter", path: "/sell/create" },
        { name: "Sell Letter History", path: "/sell/history" },
        { name: "Sell Requests", path: "/sell/requests" },
      ],
    },
    {
      name: "Updates",
      icon: RefreshCw,
      submenu: [
        { name: "Create Update", path: "/updates/create" },
        { name: "Updates List", path: "/updates" },
      ],
    },
    {
      name: "Service",
      icon: Wrench,
      submenu: [
        { name: "Create Service Bill", path: "/service/create" },
        { name: "Service History", path: "/service/history" },
      ],
    },
    {
      name: "Payment",
      icon: FileText,
      submenu: [
        { name: "Create Advance Bill", path: "/advance/create" },
        { name: "Advance History", path: "/advance/history" },
      ],
    },
    ...(user?.role !== "staff"
      ? [
          {
            name: "Staff",
            icon: Users,
            submenu: [
              { name: "Create Staff ID", path: "/staff/create" },
              { name: "Staff List", path: "/staff/list" },
            ],
          },
        ]
      : []),
    {
      name: "Vehicle History",
      icon: Bike,
      path: "/bike-history",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);

    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
      <div
        style={{
          ...styles.topBar,
          display: isMobile && !isSidebarOpen ? "block" : "none",
        }}
      >
        <div
          style={{
            ...styles.hamburgerMenu,
            display: isMobile && !isSidebarOpen ? "block" : "none",
          }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
      </div>

      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div
        style={{
          ...styles.sidebar,
          ...(isMobile
            ? {
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
                position: "fixed",
                zIndex: 15,
              }
            : {}),
        }}
      >
        <div style={styles.sidebarHeader}>
          <img
            src={logo}
            alt="logo"
            style={{
              width: "100%",
              maxWidth: "25rem",
              height: "9rem",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              margin: "0 auto 1rem auto",
            }}
          />
          <p className="sidebar-subtitle">Welcome, {user?.name || "User"}</p>
        </div>
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                style={{
                  ...styles.menuItem,
                  ...(activeMenu === item.name ? styles.menuItemActive : {}),
                }}
                onClick={() => {
                  if (item.submenu) {
                    toggleMenu(item.name);
                  } else {
                    handleMenuClick(item.name, item.path);
                  }
                }}
              >
                <div style={styles.menuItemContent}>
                  <item.icon size={20} style={styles.menuIcon} />
                  <span style={styles.menuText}>{item.name}</span>
                </div>
                {item.submenu &&
                  (expandedMenus[item.name] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  ))}
              </div>

              {item.submenu && (
                <div
                  style={{
                    ...styles.submenu,
                    maxHeight: expandedMenus[item.name]
                      ? `${item.submenu.length * 48}px`
                      : "0px",
                    opacity: expandedMenus[item.name] ? 1 : 0,
                    transition:
                      "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
                    overflow: "hidden",
                  }}
                >
                  {item.submenu.map((subItem) => (
                    <div
                      key={subItem.name}
                      style={{
                        ...styles.submenuItem,
                        ...(activeMenu === subItem.name
                          ? styles.submenuItemActive
                          : {}),
                      }}
                      onClick={() =>
                        handleMenuClick(subItem.name, subItem.path)
                      }
                    >
                      {subItem.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} style={styles.menuIcon} />
            <span style={styles.menuText}>Logout</span>
          </div>
        </nav>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Enter bike registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading vehicle history...</p>
            </div>
          ) : bikeHistory.length === 0 ? (
            <div style={styles.emptyState}>
              {searchTerm ? (
                <div>
                  <p>No history found for bike: {searchTerm}</p>
                  {user?.role === "staff" && (
                    <p style={{ color: "#64748b", marginTop: "8px" }}>
                      Note: You may only see records marked as visible to staff
                    </p>
                  )}
                </div>
              ) : (
                <p>Enter a bike registration number to search</p>
              )}
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Date & Time</th>
                    <th style={styles.tableHeader}>Action</th>
                    <th style={styles.tableHeader}>Amount</th>
                    <th style={styles.tableHeader}>Details</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bikeHistory.map((item) => (
                    <tr
                      key={`${item.type}-${item._id}`}
                      style={styles.tableRow}
                    >
                      <td style={styles.tableCell}>
                        {new Date(item.date).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td style={styles.tableCell}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {getActionIcon(item.type)}
                          {getActionLabel(item.type)}
                        </div>
                      </td>
                      <td style={styles.tableCell}>{getAmount(item)}</td>
                      <td style={styles.tableCell}>{getDetails(item)}</td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => fetchPdf(item._id, item.type)}
                            style={styles.viewButton}
                            title="View PDF"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={() =>
                              downloadPdf(
                                item._id,
                                item.type,
                                getFileName(item)
                              )
                            }
                            style={styles.downloadButton}
                            title="Download PDF"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {}
      {showPdfModal && (
        <div style={styles.pdfModalOverlay}>
          <div style={styles.pdfModalContainer}>
            <div style={styles.pdfModalHeader}>
              <h3>Document Preview</h3>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  URL.revokeObjectURL(pdfUrl);
                }}
                style={styles.pdfModalCloseButton}
              >
                <X size={20} />
              </button>
            </div>
            <div style={styles.pdfModalContent}>
              <iframe
                src={pdfUrl}
                style={styles.pdfIframe}
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    padding: "1rem",
    background: "#ffffff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 20,
  },
  hamburgerMenu: {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
  },
  sidebarOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 14,
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    height: "100vh",
    transition: "transform 0.3s ease",
    backgroundImage: "linear-gradient(to bottom, #1e293b, #0f172a)",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid #1e293b",
  },
  sidebarTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#ffffff",
    margin: 0,
  },
  sidebarSubtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },
  nav: {
    padding: "16px 0",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#e2e8f0",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ":hover": {
      backgroundColor: "#1e293b",
    },
  },
  menuItemActive: {
    backgroundColor: "#1e293b",
    borderRight: "3px solid #3b82f6",
    color: "#ffffff",
  },
  menuItemContent: {
    display: "flex",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: "12px",
    color: "#94a3b8",
  },
  menuText: {
    fontSize: "0.9375rem",
    fontWeight: "500",
  },
  submenu: {
    backgroundColor: "rgba(26, 32, 44, 0.7)",
    maxHeight: 0,
    opacity: 0,
    overflow: "hidden",
    transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
  },
  submenuItem: {
    padding: "10px 24px 10px 64px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2d3748",
    },
  },
  submenuItemActive: {
    backgroundColor: "#2d3748",
    color: "#ffffff",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#f87171",
    marginTop: "16px",
    borderTop: "1px solid #1e293b",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#7f1d1d20",
    },
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
    backgroundColor: "#ffffff",
  },
  contentPadding: {
    padding: "32px",
  },
  header: {
    marginBottom: "32px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#64748b",
  },
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: "8px 0 0 0",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  searchInputContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "500px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 40px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    backgroundColor: "#f8fafc",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    fontSize: "0.875rem",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    ":hover": {
      backgroundColor: "#f8fafc",
    },
  },
  tableCell: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "#1e293b",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    color: "#64748b",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#059669",
    },
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  pdfModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  pdfModalContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "80%",
    height: "80%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  pdfModalHeader: {
    padding: "16px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  },
  pdfModalCloseButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    ":hover": {
      color: "#1e293b",
    },
  },
  pdfModalContent: {
    flex: 1,
    padding: "0",
    overflow: "hidden",
  },
  pdfIframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
};

export default BikeHistory;
