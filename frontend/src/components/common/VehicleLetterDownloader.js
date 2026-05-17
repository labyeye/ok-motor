import React, { useState, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { loadPDFTemplate } from "../../utils/pdfTemplateLoader";
import logo1 from "../../images/okmotorback.png";

/**
 * VehicleLetterDownloader
 *
 * Self-contained "download letter with document selection" modal flow.
 * Extracted (copy of logic) from SellLetterHistory.js and BuyLetterHistory.js.
 *
 * Props:
 *  - letter:     the sell letter OR buy letter object (full doc with .documents nested).
 *                When non-null, the flow opens immediately at the language modal.
 *  - letterType: "sell" | "buy" — picks Hindi/English template + which PDF generator to use.
 *  - onClose:    called when the user closes any modal or after a download completes.
 */
const VehicleLetterDownloader = ({ letter, letterType = "sell", onClose }) => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [chosenLanguage, setChosenLanguage] = useState(null);
  const [docSelections, setDocSelections] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const isSell = letterType !== "buy";

  // Open the language modal as soon as a non-null `letter` is passed in.
  useEffect(() => {
    if (letter) {
      setShowLanguageModal(true);
      setShowDocumentModal(false);
      setChosenLanguage(null);
      setIsDownloading(false);
      setDownloadProgress(0);
    } else {
      setShowLanguageModal(false);
      setShowDocumentModal(false);
    }
  }, [letter]);

  const close = () => {
    setShowLanguageModal(false);
    setShowDocumentModal(false);
    setIsDownloading(false);
    setDownloadProgress(0);
    setChosenLanguage(null);
    if (typeof onClose === "function") onClose();
  };

  // -------------------------------------------------------------------------
  // Shared helpers (copied from SellLetterHistory — sell version preferred;
  // buy versions are equivalent enough to share).
  // -------------------------------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return "";
    let ds = dateString;
    try {
      if (typeof ds === "string" && ds.includes("T")) ds = ds.split("T")[0];
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (err) {
      return "";
    }
  };

  const formatTime12Hour = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
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

  const formatTimeFromDate = (dateObj) => {
    if (!dateObj) return "";
    try {
      const date = new Date(dateObj);
      if (isNaN(date.getTime())) return "";
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const formattedHours = String(hours).padStart(2, "0");
      const formattedMinutes = String(minutes).padStart(2, "0");
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch (e) {
      return "";
    }
  };

  const formatKm = (val) => {
    const num = parseFloat((val ?? "").toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
  };

  // Sell-style rupee formatter (no "Rs." prefix).
  const formatRupeeSell = (val) => {
    const num = parseFloat((val ?? "").toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : `${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };

  // Buy-style rupee formatter (with "Rs." prefix).
  const formatRupeeBuy = (val) => {
    const num = parseFloat(val);
    return isNaN(num)
      ? "0.00"
      : `Rs. ${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };

  // Sell-style: "(... Only)" with parens.
  const formatIndianAmountInWordsSell = (amount) => {
    if (isNaN(amount)) return "(Zero Rupees)";
    const num = parseFloat(amount);
    if (num === 0) return "(Zero Rupees)";

    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertLessThanHundred = (n) => {
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
    };
    const convertLessThanThousand = (n) => {
      if (n < 100) return convertLessThanHundred(n);
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return units[hundred] + " Hundred" + (remainder !== 0 ? " and " + convertLessThanHundred(remainder) : "");
    };
    const convert = (n) => {
      if (n === 0) return "Zero";
      let result = "";
      const crore = Math.floor(n / 10000000);
      if (crore > 0) { result += convertLessThanThousand(crore) + " Crore "; n = n % 10000000; }
      const lakh = Math.floor(n / 100000);
      if (lakh > 0) { result += convertLessThanThousand(lakh) + " Lakh "; n = n % 100000; }
      const thousand = Math.floor(n / 1000);
      if (thousand > 0) { result += convertLessThanThousand(thousand) + " Thousand "; n = n % 1000; }
      if (n > 0) result += convertLessThanThousand(n);
      return result.trim();
    };

    return `(${convert(num)} Only)`;
  };

  // Buy-style: "... Only" without parens.
  const formatIndianAmountInWordsBuy = (amount) => {
    if (isNaN(amount)) return "Zero Rupees";
    const num = parseFloat(amount);

    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
      return units[Math.floor(n / 100)] + " hundred" + (n % 100 !== 0 ? " and " + convertLessThanThousand(n % 100) : "");
    };
    const convert = (n) => {
      if (n === 0) return "Zero Rupees";
      let result = "";
      const crore = Math.floor(n / 10000000);
      if (crore > 0) { result += convertLessThanThousand(crore) + " Crore "; n %= 10000000; }
      const lakh = Math.floor(n / 100000);
      if (lakh > 0) { result += convertLessThanThousand(lakh) + " Lakh "; n %= 100000; }
      const thousand = Math.floor(n / 1000);
      if (thousand > 0) { result += convertLessThanThousand(thousand) + " Thousand "; n %= 1000; }
      const remainder = convertLessThanThousand(n);
      if (remainder) result += remainder;
      return result.trim() + " Only";
    };

    return convert(num);
  };

  const formatAadhar = (val) =>
    (val || "")
      .replace(/\D/g, "")
      .match(/.{1,4}/g)
      ?.join("-") || "";

  const simulateProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setDownloadProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  // -------------------------------------------------------------------------
  // Field position maps
  // -------------------------------------------------------------------------
  const sellHindiFieldPositions = {
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

  const sellEnglishFieldPositions = {
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
    buyerPhone2: { x: 176, y: 282, size: 11 },
    buyerAadhar: { x: 137, y: 263, size: 11 },
    witnessName: { x: 105, y: 135, size: 11 },
    witnessPhone: { x: 105, y: 116, size: 11 },
    note: { x: 70, y: 35, size: 10 },
  };

  const buyHindiFieldPositions = {
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

  const buyEnglishFieldPositions = {
    sellerName: { x: 29, y: 628, size: 11 },
    sellerFatherName: { x: 327, y: 628, size: 11 },
    sellerCurrentAddress: { x: 83, y: 605, size: 11 },
    vehicleName: { x: 282, y: 586, size: 11 },
    vehicleModel: { x: 468, y: 586, size: 11 },
    vehicleColor: { x: 60, y: 567, size: 11 },
    registrationNumber: { x: 244, y: 567, size: 11 },
    chassisNumber: { x: 417, y: 567, size: 11 },
    engineNumber: { x: 92, y: 544, size: 11 },
    vehiclekm: { x: 323, y: 544, size: 11 },
    buyerName: { x: 74, y: 526, size: 11 },
    buyerFatherName: { x: 385, y: 526, size: 11 },
    buyerCurrentAddress: { x: 89, y: 508, size: 11 },
    saleDate: { x: 483, y: 508, size: 11 },
    saleTime: { x: 23, y: 490, size: 11 },
    saleAmount: { x: 190, y: 490, size: 11 },
    todayDate: { x: 132, y: 472, size: 11 },
    todayTime: { x: 273, y: 472, size: 11 },
    sellerName1: { x: 73, y: 440, size: 11 },
    sellerFatherName1: { x: 349, y: 440, size: 11 },
    buyerName1: { x: 26, y: 403, size: 11 },
    buyerFatherName1: { x: 382, y: 403, size: 11 },
    todayDate1: { x: 170, y: 421, size: 11 },
    todayTime1: { x: 305, y: 421, size: 11 },
    dealername: { x: 136, y: 351, size: 11 },
    dealeraddress: { x: 368, y: 351, size: 11 },
    selleraadhar: { x: 403, y: 221, size: 10 },
    sellerpan: { x: 403, y: 207, size: 10 },
    selleraadharphone: { x: 405, y: 192, size: 10 },
    selleraadharphone2: { x: 470, y: 192, size: 10 },
    witnessname: { x: 400, y: 96, size: 10 },
    witnessphone: { x: 400, y: 80, size: 10 },
    note: { x: 60, y: 20, size: 10 },
    returnpersonname: { x: 332, y: 298, size: 10 },
  };

  // -------------------------------------------------------------------------
  // PDF asset helpers
  // -------------------------------------------------------------------------
  const drawHeaderFooter = async (pdfDoc, page) => {
    try {
      const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const logoBytes = await fetch(logo1).then((r) => r.arrayBuffer());
      const logoImg = await pdfDoc.embedPng(logoBytes);

      page.drawRectangle({
        x: 0,
        y: 780,
        width: 595,
        height: 80,
        color: rgb(0.047, 0.098, 0.196),
      });
      page.drawImage(logoImg, { x: 50, y: 743, width: 150, height: 120 });
      try {
        page.drawImage(logoImg, {
          x: 180,
          y: 430,
          width: 260,
          height: 220,
          opacity: 0.3,
        });
      } catch (e) {}
      page.drawText("UDAYAM-BR-26-0028550", {
        x: 330, y: 805, size: 14, color: rgb(1, 1, 1), font: headerFont,
      });
      page.drawText("GSTIN: 22ABCDE1234F1Z5", {
        x: 330, y: 785, size: 14, color: rgb(1, 1, 1), font: headerFont,
      });

      try {
        const thank = "Thank you for your business!";
        const addr =
          "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
        const thankW = headerFont.widthOfTextAtSize(thank, 12);
        const addrW = regularFont.widthOfTextAtSize(addr, 9);
        const centerXThank = (595 - thankW) / 2;
        const centerXAddr = (595 - addrW) / 2;

        page.drawLine({
          start: { x: 20, y: 52 },
          end: { x: 575, y: 52 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        page.drawText(thank, {
          x: centerXThank, y: 40, size: 12, color: rgb(0, 0, 0), font: headerFont,
        });
        page.drawText(addr, {
          x: centerXAddr, y: 26, size: 9, color: rgb(0.45, 0.45, 0.45), font: regularFont,
        });
      } catch (e) {}
    } catch (err) {
      console.warn("Failed to draw header/footer:", err);
    }
  };

  const embedAssetFromUrl = async (pdfDoc, url) => {
    try {
      const res = await fetch(url);
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const bytes = await res.arrayBuffer();

      if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
        const embeddedPages = await pdfDoc.embedPdf(bytes);
        if (Array.isArray(embeddedPages) && embeddedPages.length > 0)
          return { kind: "pdf", embeddedPages };
        return null;
      }
      if (contentType.includes("png")) {
        const img = await pdfDoc.embedPng(bytes);
        return { kind: "image", embedded: img };
      }
      const img = await pdfDoc.embedJpg(bytes);
      return { kind: "image", embedded: img };
    } catch (err) {
      console.warn("Failed to embed asset from", url, err);
      return null;
    }
  };

  // -------------------------------------------------------------------------
  // Invoice generators
  // -------------------------------------------------------------------------
  const drawVehicleInvoiceSell = async (page, pdfDoc, l) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoImageBytes = await fetch(logo1).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    page.drawRectangle({ x: 0, y: 780, width: 595, height: 80, color: rgb(0.047, 0.098, 0.196) });
    page.drawImage(logoImage, { x: 50, y: 743, width: 150, height: 120 });
    page.drawImage(logoImage, { x: 180, y: 430, width: 260, height: 220, opacity: 0.3 });
    page.drawImage(logoImage, { x: 180, y: 130, width: 260, height: 220, opacity: 0.3 });

    page.drawText("UDAYAM-BR-26-0028550", { x: 330, y: 815, size: 14, color: rgb(1, 1, 1), font: boldFont });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", { x: 330, y: 795, size: 14, color: rgb(1, 1, 1), font: boldFont });
    try {
      page.drawText(
        "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
        { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font: boldFont }
      );
    } catch (e) {}
    page.drawRectangle({ x: 0, y: 750, width: 595, height: 30, color: rgb(0.9, 0.9, 0.9) });
    page.drawText("VEHICLE SALE INVOICE", { x: 200, y: 758, size: 18, color: rgb(0.047, 0.098, 0.196), font: boldFont });

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    page.drawText(`Invoice Number: ${invoiceNumber}`, { x: 50, y: 720, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Date: ${formatDate(l.todayDate)}`, { x: 385, y: 720, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Time: ${formatTime(l.saleTime)}`, { x: 470, y: 720, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    page.drawLine({ start: { x: 50, y: 710 }, end: { x: 545, y: 710 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    page.drawText("CUSTOMER DETAILS", { x: 50, y: 690, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });

    page.drawText(`Name: ${l.buyerName || "N/A"}`, { x: 60, y: 665, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    const lineHeight2 = 12;
    const address = l.buyerAddress || "N/A";
    const maxCharsPerLine = 38;
    const label = "Address: ";
    const labelWidth = 45;
    const addressLines = [];
    for (let i = 0; i < address.length; i += maxCharsPerLine) {
      addressLines.push(address.substring(i, i + maxCharsPerLine));
    }
    addressLines.forEach((line, index) => {
      const text = index === 0 ? `${label}${line}` : line;
      const xPos = index === 0 ? 60 : 60 + labelWidth;
      page.drawText(text, { x: xPos, y: 650 - index * lineHeight2, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    });

    page.drawText(`Phone: ${l.buyerPhone || "N/A"}`, { x: 370, y: 665, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`, ${l.buyerPhone2 || "N/A"}`, { x: 460, y: 665, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Aadhar: ${l.buyerAadhar || "N/A"}`, { x: 370, y: 650, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    page.drawText("VEHICLE DETAILS", { x: 50, y: 620, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawRectangle({ x: 50, y: 590, width: 495, height: 20, color: rgb(0.9, 0.9, 0.9) });

    const vehicleHeaders = ["Make", "Model", "Color", "Reg No", "Chassis", "Engine", "KM"];
    const vehicleHeaderPositions = [60, 120, 180, 220, 280, 370, 460];
    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, { x: vehicleHeaderPositions[index], y: 571, size: 9, color: rgb(0.2, 0.2, 0.2), font: boldFont });
    });
    const lineHeight = 12;
    const vehicleValues = [
      l.vehicleName || "N/A",
      l.vehicleModel || "N/A",
      l.vehicleColor || "N/A",
      l.registrationNumber || "N/A",
      l.chassisNumber || "N/A",
      l.engineNumber || "N/A",
      l.vehiclekm ? `${formatKm(l.vehiclekm)} km` : "N/A",
    ];
    const columnWidths = [60, 60, 40, 60, 80, 80, 40, 60];
    vehicleValues.forEach((value, index) => {
      const maxWidth = columnWidths[index];
      const xPos = vehicleHeaderPositions[index];
      let yPos = 550;
      const lines = [];
      let currentLine = "";
      for (const word of value.split(" ")) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        if (testWidth <= maxWidth) currentLine = testLine;
        else { if (currentLine) lines.push(currentLine); currentLine = word; }
      }
      if (currentLine) lines.push(currentLine);
      lines.forEach((line, lineIndex) => {
        page.drawText(line, { x: xPos, y: yPos - lineIndex * lineHeight, size: 8, color: rgb(0.2, 0.2, 0.2), font });
      });
    });

    page.drawText("SALE INFORMATION", { x: 50, y: 515, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawText(`Sale Date: ${formatDate(l.saleDate)}`, { x: 60, y: 495, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Sale Amount: Rs. ${formatRupeeSell(l.saleAmount) || "0"}`, { x: 200, y: 495, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    const paymentMethodDisplay = { cash: "CASH", upi: "UPI", bankTransfer: "BANK TRANSFER", soldloan: "LOAN" };
    page.drawText(`Payment: ${paymentMethodDisplay[l.paymentMethod] || "CASH"}`, {
      x: 350, y: 495, size: 10, color: rgb(0.2, 0.2, 0.2), font,
    });
    page.drawText(`Amount in Words: ${formatIndianAmountInWordsSell(l.saleAmount) || "N/A"}`, {
      x: 60, y: 475, size: 10, color: rgb(0.2, 0.2, 0.2), font,
    });
    page.drawText(`Condition: ${l.vehicleCondition === "running" ? "RUNNING" : "NOT RUNNING"}`, {
      x: 60, y: 596, size: 10, color: rgb(0.2, 0.2, 0.2), font,
    });

    page.drawRectangle({ x: 0, y: 360, width: 595, height: 60, color: rgb(0.047, 0.098, 0.196) });
    page.drawImage(logoImage, { x: 40, y: 345, width: 120, height: 90 });
    page.drawRectangle({ x: 0, y: 335, width: 595, height: 30, color: rgb(0.9, 0.9, 0.9) });
    page.drawText("GUARRANTEE & WARRANTY CERTIFICATE", {
      x: 130, y: 345, size: 17, color: rgb(0, 0, 0), fontWeight: "bold", font: boldFont,
    });
    page.drawText("UDAYAM-BR-26-0028550", { x: 330, y: 395, size: 14, color: rgb(1, 1, 1), font: boldFont });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", { x: 330, y: 375, size: 14, color: rgb(1, 1, 1), font: boldFont });

    try {
      page.drawText(
        "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
        { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font: boldFont }
      );
    } catch (e) {}

    page.drawText("TERMS & CONDITIONS", { x: 50, y: 305, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
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
      `10. OK MOTORS has recieved the money amount ${formatRupeeSell(l.saleAmount)} from ${l.buyerName}.`,
      "11. It is compulsory to get the vehicle serviced after driving 1500-1800 km otherwise guarrantee will be expired ",
    ];
    terms.forEach((term, index) => {
      page.drawText(term, { x: 60, y: 285 - index * 15, size: 10, color: rgb(0.3, 0.3, 0.3), font });
    });

    page.drawText("Buyer Signature", { x: 120, y: 70, size: 10, color: rgb(0.4, 0.4, 0.4), font });
    page.drawLine({ start: { x: 60, y: 85 }, end: { x: 250, y: 85 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
    page.drawText("Authorized Signatory", { x: 360, y: 70, size: 10, color: rgb(0.4, 0.4, 0.4), font });
    page.drawLine({ start: { x: 310, y: 85 }, end: { x: 500, y: 85 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
    page.drawLine({ start: { x: 50, y: 55 }, end: { x: 545, y: 55 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

    page.drawText("Thank you for your business!", { x: 220, y: 35, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      { x: 160, y: 20, size: 8, color: rgb(0.5, 0.5, 0.5), font }
    );
  };

  const drawVehicleInvoiceBuy = async (page, pdfDoc, l) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoImageBytes = await fetch(logo1).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    page.drawRectangle({ x: 0, y: 780, width: 595, height: 80, color: rgb(0.047, 0.098, 0.196) });
    page.drawImage(logoImage, { x: 50, y: 740, width: 160, height: 130 });
    page.drawImage(logoImage, {
      x: 280, y: 200, width: 370, height: 300, opacity: 0.3, rotate: degrees(45),
    });

    page.drawText("UDAYAM-BR-26-0028550", { x: 330, y: 815, size: 14, color: rgb(1, 1, 1), font });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", { x: 330, y: 795, size: 14, color: rgb(1, 1, 1), font });
    try {
      page.drawText(
        "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
        { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font }
      );
    } catch (e) {}
    page.drawText(
      "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
      { x: 50, y: 770, size: 8, color: rgb(0.8, 0.8, 0.8), font }
    );
    page.drawRectangle({ x: 0, y: 750, width: 595, height: 30, color: rgb(0.9, 0.9, 0.9) });
    page.drawText("VEHICLE BUY INVOICE", { x: 200, y: 758, size: 18, color: rgb(0.047, 0.098, 0.196), font: boldFont });

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    page.drawText(`Invoice Number: ${invoiceNumber}`, { x: 50, y: 720, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Date: ${formatDate(l.todayDate)}`, { x: 400, y: 720, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Time: ${formatTime(l.saleTime)}`, { x: 450, y: 700, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    page.drawLine({ start: { x: 50, y: 710 }, end: { x: 545, y: 710 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    page.drawText("CUSTOMER DETAILS", { x: 50, y: 690, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawText(`Name: ${l.sellerName || "N/A"}`, { x: 60, y: 665, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    const address = l.sellerCurrentAddress || "N/A";
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
      page.drawText(text, { x: xPos, y: 650 - index * lineHeight, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    });
    page.drawText(`Phone: ${l.selleraadharphone || "N/A"}`, { x: 350, y: 665, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`, ${l.selleraadharphone2 || "N/A"}`, { x: 440, y: 665, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Aadhar: ${formatAadhar(l.selleraadhar) || "N/A"}`, { x: 350, y: 650, size: 10, color: rgb(0.2, 0.2, 0.2), font });

    page.drawText("VEHICLE DETAILS", { x: 50, y: 605, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawRectangle({ x: 50, y: 575, width: 495, height: 20, color: rgb(0.9, 0.9, 0.9) });
    page.drawText("Condition: " + (l.vehicleCondition || "N/A"), {
      x: 60, y: 581, size: 10, color: rgb(0.2, 0.2, 0.2), font,
    });

    const vehicleHeaders = ["Make", "Model", "Color", "Reg No", "Chassis", "Engine", "KM"];
    const vehicleHeaderPositions = [60, 120, 180, 220, 280, 370, 460];
    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, { x: vehicleHeaderPositions[index], y: 555, size: 9, color: rgb(0.2, 0.2, 0.2), font: boldFont });
    });
    const vehicleValues = [
      l.vehicleName || "N/A",
      l.vehicleModel || "N/A",
      l.vehicleColor || "N/A",
      l.registrationNumber || "N/A",
      l.chassisNumber || "N/A",
      l.engineNumber || "N/A",
      l.vehiclekm ? `${formatKm(l.vehiclekm)} km` : "N/A",
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
        if (testWidth <= maxWidth) currentLine = testLine;
        else { if (currentLine) lines.push(currentLine); currentLine = word; }
      }
      if (currentLine) lines.push(currentLine);
      lines.forEach((line, lineIndex) => {
        page.drawText(line, { x: xPos, y: yPos - lineIndex * lineHeight, size: 8, color: rgb(0.2, 0.2, 0.2), font });
      });
    });

    page.drawText("BUY INFORMATION", { x: 50, y: 510, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawText(`Buy Date: ${formatDate(l.saleDate)}`, { x: 60, y: 490, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(`Buy Amount: ${formatRupeeBuy(l.saleAmount)}`, { x: 200, y: 490, size: 10, color: rgb(0.2, 0.2, 0.2), font });
    page.drawText(
      `Payment: ${l.paymentMethod ? l.paymentMethod.toUpperCase() : "CASH"}`,
      { x: 350, y: 490, size: 10, color: rgb(0.2, 0.2, 0.2), font }
    );
    page.drawText(`Amount in Words: ${formatIndianAmountInWordsBuy(l.saleAmount)}`, {
      x: 60, y: 460, size: 10, color: rgb(0.2, 0.2, 0.2), font,
    });

    page.drawText("TERMS & CONDITIONS", { x: 40, y: 430, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    const terms = [
      "1. No refunds after invoice billing, except for transfer issues reported within 15 days.",
      "2. Customer signature confirms acceptance of all terms.",
      `3. OK MOTORS has paid the money amount of ${formatRupeeBuy(l.saleAmount)} to ${l.sellerName}.`,
      "4. The seller confirms that the vehicle is free from any loans, liabilities, or pending challans at the time of sale.",
      "5. The seller agrees to provide all original documents including RC, insurance, and ID proof at the time of sale.",
      "6. OK MOTORS is not responsible for any past violations, legal disputes, or ownership claims before the date of purchase.",
      "7. The seller confirms that the bike has not been involved in any major accidents or insurance claims.",
      "8. Vehicle handover includes all keys, documents, and accessories as agreed.",
      "9. The seller confirms that the chassis and engine numbers are intact and not tampered with.",
    ];
    terms.forEach((term, index) => {
      page.drawText(term, { x: 40, y: 410 - index * 15, size: 10, color: rgb(0.3, 0.3, 0.3), font });
    });

    page.drawText("Seller Signature", { x: 110, y: 120, size: 10, color: rgb(0.4, 0.4, 0.4), font });
    page.drawLine({ start: { x: 60, y: 115 }, end: { x: 250, y: 115 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
    page.drawText("Authorized Signatory", { x: 350, y: 120, size: 10, color: rgb(0.4, 0.4, 0.4), font });
    page.drawLine({ start: { x: 310, y: 115 }, end: { x: 500, y: 115 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
    page.drawLine({ start: { x: 50, y: 70 }, end: { x: 545, y: 70 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    page.drawText("Thank you for your business!", { x: 220, y: 50, size: 12, color: rgb(0.047, 0.098, 0.196), font: boldFont });
    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      { x: 130, y: 30, size: 8, color: rgb(0.5, 0.5, 0.5), font }
    );
  };

  // -------------------------------------------------------------------------
  // SELL: addDocumentPages (mirrors fillAndDownloadHindi/EnglishPdf behavior)
  // -------------------------------------------------------------------------
  const addDocumentPagesSell = async (pdfDoc, documentsObj) => {
    if (!documentsObj) return;
    const items = [];
    const panItems = [];
    const deliveryPhotoItems = [];
    const rcItems = [];
    const signedDocSellItems = [];

    if (documentsObj.vehicleRC) {
      if (documentsObj.vehicleRC.front)
        rcItems.push({ title: "Vehicle RC - Front", url: documentsObj.vehicleRC.front });
      if (documentsObj.vehicleRC.back)
        rcItems.push({ title: "Vehicle RC - Back", url: documentsObj.vehicleRC.back });
    }

    const singleAadhaarItem = [];
    if (documentsObj.aadhaar) {
      const uploadMode = documentsObj.aadhaarUploadMode || "separate";
      if (uploadMode === "single") {
        if (documentsObj.aadhaar.front)
          singleAadhaarItem.push({ title: "Aadhaar (Front and Back)", url: documentsObj.aadhaar.front });
      } else {
        if (documentsObj.aadhaar.front)
          items.push({ title: "Aadhaar - Front", url: documentsObj.aadhaar.front });
        if (documentsObj.aadhaar.back && documentsObj.aadhaar.back !== documentsObj.aadhaar.front)
          items.push({ title: "Aadhaar - Back", url: documentsObj.aadhaar.back });
      }
    }

    if (documentsObj.pan)
      panItems.push({ title: "PAN Card", url: documentsObj.pan });
    if (documentsObj.deliveryPhoto || documentsObj.vehicleKM)
      deliveryPhotoItems.push({ title: "Delivery Photo", url: documentsObj.deliveryPhoto || documentsObj.vehicleKM });
    if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
      documentsObj.vehiclePhotos.forEach((u, i) =>
        items.push({ title: `Vehicle Photo ${i + 1}`, url: u })
      );
    }
    if (documentsObj.signedDocSell) {
      signedDocSellItems.push({ title: "Signed Doc (Sell)", url: documentsObj.signedDocSell });
    }

    const transferReceiptItems = [];
    if (documentsObj.transferReceipt) {
      const trPages =
        documentsObj.transferReceipt.pages ||
        (Array.isArray(documentsObj.transferReceipt)
          ? documentsObj.transferReceipt
          : typeof documentsObj.transferReceipt === "string"
            ? [documentsObj.transferReceipt]
            : []);
      trPages.forEach((p, idx) =>
        transferReceiptItems.push({ title: `Transfer Receipt ${idx + 1}`, url: p })
      );
    }

    const insuranceCertificateItems = [];
    const vehicleNOCItems = [];
    if (documentsObj.insuranceCertificate) {
      if (Array.isArray(documentsObj.insuranceCertificate.pages)) {
        documentsObj.insuranceCertificate.pages.forEach((p, idx) =>
          insuranceCertificateItems.push({ title: `Insurance Certificate ${idx + 1}`, url: p })
        );
      } else if (Array.isArray(documentsObj.insuranceCertificate)) {
        documentsObj.insuranceCertificate.forEach((p, idx) =>
          insuranceCertificateItems.push({ title: `Insurance Certificate ${idx + 1}`, url: p })
        );
      }
    }
    if (documentsObj.vehicleNOC) {
      if (Array.isArray(documentsObj.vehicleNOC.pages)) {
        documentsObj.vehicleNOC.pages.forEach((p, idx) =>
          vehicleNOCItems.push({ title: `Vehicle NOC ${idx + 1}`, url: p })
        );
      } else if (Array.isArray(documentsObj.vehicleNOC)) {
        documentsObj.vehicleNOC.forEach((p, idx) =>
          vehicleNOCItems.push({ title: `Vehicle NOC ${idx + 1}`, url: p })
        );
      }
    }

    if (signedDocSellItems.length > 0) {
      for (const item of signedDocSellItems) items.push(item);
    }

    // RC: two-column page
    if (rcItems.length > 0) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const margin = 40;
      const colWidth = (595 - 3 * margin) / 2;
      const colGap = margin;
      const maxHeight = 250;
      for (let i = 0; i < rcItems.length; i++) {
        const item = rcItems[i];
        const xPos = margin + i * (colWidth + colGap);
        const yTop = 700;
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(item.title, { x: xPos, y: yTop, size: 10, font: titleFont });
        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (asset) {
          let width, height;
          if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
          else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
          let drawW = colWidth - 20;
          let drawH = (height / width) * drawW;
          if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
          const centeredX = xPos + (colWidth - drawW) / 2;
          const drawY = yTop - drawH - 15;
          if (asset.kind === "image") page.drawImage(asset.embedded, { x: centeredX, y: drawY, width: drawW, height: drawH });
          else { try { page.drawPage(asset.embeddedPages[0], { x: centeredX, y: drawY, width: drawW, height: drawH }); } catch (e) {} }
        }
      }
    }

    // Single Aadhaar (front+back combined)
    if (singleAadhaarItem.length > 0) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const item = singleAadhaarItem[0];
      page.drawText(item.title, { x: 50, y: 720, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 595;
        const margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = 660;
        let width, height;
        if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
        else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
        let drawW = maxWidth;
        let drawH = (height / width) * drawW;
        if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
        const xPos = (pageWidth - drawW) / 2;
        const yPos = 690 - drawH;
        if (asset.kind === "image") page.drawImage(asset.embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        else { try { page.drawPage(asset.embeddedPages[0], { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
      }
    }

    // PAN
    for (const item of panItems) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(item.title, { x: 50, y: 753, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 595, pageHeight = 842, margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 150;
        let width, height;
        if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
        else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
        let drawW = maxWidth;
        let drawH = (height / width) * drawW;
        if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
        const xPos = (pageWidth - drawW) / 2;
        const yPos = 750 - drawH;
        if (asset.kind === "image") page.drawImage(asset.embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        else { try { page.drawPage(asset.embeddedPages[0], { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
      }
    }

    // Delivery photo
    for (const item of deliveryPhotoItems) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(item.title, { x: 50, y: 753, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 595, pageHeight = 842, margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 150;
        let width, height;
        if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
        else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
        let drawW = maxWidth;
        let drawH = (height / width) * drawW;
        if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
        const xPos = (pageWidth - drawW) / 2;
        const yPos = 750 - drawH;
        if (asset.kind === "image") page.drawImage(asset.embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        else { try { page.drawPage(asset.embeddedPages[0], { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
      }
    }

    // Generic two-column items (vehicle photos, signed doc, separate-mode aadhaar)
    for (let i = 0; i < items.length; i += 2) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const yPositions = [740, 390];
      for (let cell = 0; cell < 2; cell++) {
        const item = items[i + cell];
        if (!item) continue;
        const x = 50;
        const yTop = yPositions[cell];
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(item.title, { x, y: yTop, size: 12, font: titleFont });
        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (asset) {
          const cellMaxW = 500, cellMaxH = 320;
          let width, height;
          if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
          else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
          let drawW = cellMaxW;
          let drawH = (height / width) * drawW;
          if (drawH > cellMaxH) { drawH = cellMaxH; drawW = (width / height) * drawH; }
          const drawY = yTop - drawH - 10;
          if (asset.kind === "image") page.drawImage(asset.embedded, { x, y: drawY, width: drawW, height: drawH });
          else { try { page.drawPage(asset.embeddedPages[0], { x, y: drawY, width: drawW, height: drawH }); } catch (e) {} }
        }
      }
    }

    // Insurance certificates (single page each)
    for (const item of insuranceCertificateItems) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(item.title, { x: 50, y: 753, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 595, pageHeight = 842, margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 150;
        let width, height;
        if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
        else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
        let drawW = maxWidth;
        let drawH = (height / width) * drawW;
        if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
        const xPos = (pageWidth - drawW) / 2;
        const yPos = 750 - drawH;
        if (asset.kind === "image") page.drawImage(asset.embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        else { try { page.drawPage(asset.embeddedPages[0], { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
      }
    }

    // Transfer receipts (multi-page-aware)
    for (const item of transferReceiptItems) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(item.title, { x: 50, y: 753, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pagesToRender = asset.kind === "image" ? [asset.embedded] : asset.embeddedPages;
        for (let idx = 0; idx < pagesToRender.length; idx++) {
          let currentPage = idx === 0 ? page : pdfDoc.addPage([595, 842]);
          if (idx > 0) {
            try { await drawHeaderFooter(pdfDoc, currentPage); } catch (e) {}
            currentPage.drawText(item.title + " (continued)", { x: 50, y: 753, size: 14, font });
          }
          const subAsset = pagesToRender[idx];
          let width, height;
          if (asset.kind === "image") { const d = subAsset.scale(1); width = d.width; height = d.height; }
          else { width = subAsset.width || subAsset.getWidth?.() || 595; height = subAsset.height || subAsset.getHeight?.() || 842; }
          let drawW = 495;
          let drawH = (height / width) * drawW;
          if (drawH > 692) { drawH = 692; drawW = (width / height) * drawH; }
          const xPos = (595 - drawW) / 2;
          const yPos = 750 - drawH;
          if (asset.kind === "image") currentPage.drawImage(subAsset, { x: xPos, y: yPos, width: drawW, height: drawH });
          else { try { currentPage.drawPage(subAsset, { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
        }
      }
    }

    // Vehicle NOC
    for (const item of vehicleNOCItems) {
      const page = pdfDoc.addPage([595, 842]);
      try { await drawHeaderFooter(pdfDoc, page); } catch (e) {}
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(item.title, { x: 50, y: 753, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 595, pageHeight = 842, margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 150;
        let width, height;
        if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
        else { const p = asset.embeddedPages[0]; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
        let drawW = maxWidth;
        let drawH = (height / width) * drawW;
        if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
        const xPos = (pageWidth - drawW) / 2;
        const yPos = 750 - drawH;
        if (asset.kind === "image") page.drawImage(asset.embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        else { try { page.drawPage(asset.embeddedPages[0], { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
      }
    }
  };

  // -------------------------------------------------------------------------
  // BUY: addDocumentPages (mirrors downloadHindiPDF/downloadEnglishPDF behavior)
  // -------------------------------------------------------------------------
  const addDocumentPagesBuy = async (pdfDoc, documentsObj) => {
    if (!documentsObj) return;
    const items = [];
    const rcItems = [];
    const aadhaarItems = [];
    const insuranceCertificateItems = [];
    const vehicleNOCItems = [];
    const vehicleBuyReceiptItems = [];
    const signedDocBuyItems = [];

    if (documentsObj.vehicleRC) {
      if (documentsObj.vehicleRC.front && documentsObj.vehicleRC.front !== null)
        rcItems.push({ title: "Vehicle RC - Front", url: documentsObj.vehicleRC.front });
      if (documentsObj.vehicleRC.back && documentsObj.vehicleRC.back !== null)
        rcItems.push({ title: "Vehicle RC - Back", url: documentsObj.vehicleRC.back });
    }

    const singleAadhaarItem = [];
    if (documentsObj.aadhaar) {
      const uploadMode = documentsObj.aadhaarUploadMode || "separate";
      if (uploadMode === "single") {
        if (documentsObj.aadhaar.front) {
          singleAadhaarItem.push({ title: "Aadhaar (Front and Back)", url: documentsObj.aadhaar.front });
        }
      } else {
        if (documentsObj.aadhaar.front && documentsObj.aadhaar.front !== null) {
          aadhaarItems.push({ title: "Aadhaar - Front", url: documentsObj.aadhaar.front });
        }
        if (documentsObj.aadhaar.back && documentsObj.aadhaar.back !== null && documentsObj.aadhaar.back !== documentsObj.aadhaar.front) {
          aadhaarItems.push({ title: "Aadhaar - Back", url: documentsObj.aadhaar.back });
        }
      }
    }

    if (documentsObj.insuranceCertificate) {
      if (Array.isArray(documentsObj.insuranceCertificate.pages)) {
        documentsObj.insuranceCertificate.pages.forEach((p, idx) =>
          insuranceCertificateItems.push({ title: `Insurance Certificate ${idx + 1}`, url: p })
        );
      } else if (Array.isArray(documentsObj.insuranceCertificate)) {
        documentsObj.insuranceCertificate.forEach((p, idx) =>
          insuranceCertificateItems.push({ title: `Insurance Certificate ${idx + 1}`, url: p })
        );
      }
    }
    if (documentsObj.vehicleNOC) {
      if (Array.isArray(documentsObj.vehicleNOC.pages)) {
        documentsObj.vehicleNOC.pages.forEach((p, idx) =>
          vehicleNOCItems.push({ title: `Vehicle NOC ${idx + 1}`, url: p })
        );
      } else if (Array.isArray(documentsObj.vehicleNOC)) {
        documentsObj.vehicleNOC.forEach((p, idx) =>
          vehicleNOCItems.push({ title: `Vehicle NOC ${idx + 1}`, url: p })
        );
      }
    }
    if (documentsObj.vehicleBuyReceipt) {
      if (Array.isArray(documentsObj.vehicleBuyReceipt.pages)) {
        documentsObj.vehicleBuyReceipt.pages.forEach((p, idx) =>
          vehicleBuyReceiptItems.push({ title: `Vehicle Buy Receipt ${idx + 1}`, url: p })
        );
      } else if (Array.isArray(documentsObj.vehicleBuyReceipt)) {
        documentsObj.vehicleBuyReceipt.forEach((p, idx) =>
          vehicleBuyReceiptItems.push({ title: `Vehicle Buy Receipt ${idx + 1}`, url: p })
        );
      }
    }
    if (documentsObj.pan && documentsObj.pan !== null)
      items.push({ title: "PAN Card", url: documentsObj.pan });
    if (documentsObj.signedDocBuy && documentsObj.signedDocBuy !== null)
      signedDocBuyItems.push({ title: "Signed Doc (Buy)", url: documentsObj.signedDocBuy });

    const deliveryPhotoUrl =
      (documentsObj.deliveryPhoto && documentsObj.deliveryPhoto !== null && documentsObj.deliveryPhoto) ||
      (documentsObj.vehicleKM && documentsObj.vehicleKM !== null && documentsObj.vehicleKM) ||
      null;

    if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
      documentsObj.vehiclePhotos.forEach((u, i) =>
        items.push({ title: `Vehicle Photo ${i + 1}`, url: u })
      );
    }

    const renderTwoColumnPage = async (pageItems) => {
      const page = pdfDoc.addPage([595, 842]);
      await drawHeaderFooter(pdfDoc, page);
      const colWidth = (595 - 2 * 10) / 2;
      const colGap = 0;
      const maxHeight = 250;
      for (let i = 0; i < pageItems.length; i++) {
        const item = pageItems[i];
        const xPos = 10 + i * (colWidth + colGap);
        const yTop = 700;
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(item.title, { x: xPos, y: yTop, size: 10, font: titleFont });
        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (asset) {
          let drawW, drawH, width, height;
          if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
          else { const p = asset.embeddedPages?.[0]; if (!p) continue; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
          drawW = colWidth - 20;
          drawH = (height / width) * drawW;
          if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
          const centeredX = xPos + (colWidth - drawW) / 2;
          const drawY = yTop - drawH - 15;
          if (asset.kind === "image") page.drawImage(asset.embedded, { x: centeredX, y: drawY, width: drawW, height: drawH });
          else { try { page.drawPage(asset.embeddedPages[0], { x: centeredX, y: drawY, width: drawW, height: drawH }); } catch (e) {} }
        }
      }
    };

    const renderSingleImagePerPage = async (pageItems) => {
      for (const item of pageItems) {
        const page = pdfDoc.addPage([595, 842]);
        await drawHeaderFooter(pdfDoc, page);
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const titleY = 730;
        page.drawText(item.title, { x: 50, y: titleY, size: 12, font: titleFont });
        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (!asset) continue;
        const pageWidth = 595, margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = 630;
        if (asset.kind === "image") {
          const embedded = asset.embedded;
          const { width, height } = embedded.scale(1);
          let drawW = maxWidth;
          let drawH = (height / width) * drawW;
          if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
          const xPos = (pageWidth - drawW) / 2;
          const yPos = titleY - drawH - 15;
          page.drawImage(embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        } else if (asset.kind === "pdf") {
          const embeddedPage = asset.embeddedPages?.[0];
          if (!embeddedPage) continue;
          const embeddedWidth = embeddedPage.width || embeddedPage.getWidth?.() || 595;
          const embeddedHeight = embeddedPage.height || embeddedPage.getHeight?.() || 842;
          let drawW = maxWidth;
          let drawH = (embeddedHeight / embeddedWidth) * drawW;
          if (drawH > maxHeight) { drawH = maxHeight; drawW = (embeddedWidth / embeddedHeight) * drawH; }
          const xPos = (pageWidth - drawW) / 2;
          const yPos = titleY - drawH - 15;
          try {
            page.drawPage(embeddedPage, { x: xPos, y: yPos, width: drawW, height: drawH });
          } catch (err) {
            try {
              const asImage = await pdfDoc.embedJpg(await fetch(item.url).then((r) => r.arrayBuffer()));
              page.drawImage(asImage, { x: xPos, y: yPos, width: drawW, height: drawH });
            } catch (err2) {
              console.warn("Failed to draw embedded PDF page for", item.url, err2);
            }
          }
        }
      }
    };

    if (rcItems.length > 0) await renderTwoColumnPage(rcItems);

    if (singleAadhaarItem.length > 0) {
      const page = pdfDoc.addPage([595, 842]);
      await drawHeaderFooter(pdfDoc, page);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const item = singleAadhaarItem[0];
      page.drawText(item.title, { x: 50, y: 720, size: 14, font });
      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 620, margin = 0;
        const maxWidth = pageWidth - 1 * margin;
        const maxHeight = 780;
        let width, height;
        if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
        else { const p = asset.embeddedPages?.[0]; if (!p) return; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
        let drawW = maxWidth;
        let drawH = (height / width) * drawW;
        if (drawH > maxHeight) { drawH = maxHeight; drawW = (width / height) * drawH; }
        const xPos = (pageWidth - drawW) / 2;
        const yPos = 800 - drawH;
        if (asset.kind === "image") page.drawImage(asset.embedded, { x: xPos, y: yPos, width: drawW, height: drawH });
        else { try { page.drawPage(asset.embeddedPages[0], { x: xPos, y: yPos, width: drawW, height: drawH }); } catch (e) {} }
      }
    } else if (aadhaarItems.length > 0) {
      await renderTwoColumnPage(aadhaarItems);
    }

    if (insuranceCertificateItems.length > 0) await renderSingleImagePerPage(insuranceCertificateItems);
    if (vehicleNOCItems.length > 0) await renderSingleImagePerPage(vehicleNOCItems);
    if (vehicleBuyReceiptItems.length > 0) await renderSingleImagePerPage(vehicleBuyReceiptItems);
    if (signedDocBuyItems.length > 0) await renderSingleImagePerPage(signedDocBuyItems);
    if (deliveryPhotoUrl) {
      await renderSingleImagePerPage([{ title: "Delivery Photo", url: deliveryPhotoUrl }]);
    }

    for (let i = 0; i < items.length; i += 2) {
      const page = pdfDoc.addPage([595, 842]);
      await drawHeaderFooter(pdfDoc, page);
      const yPositions = [740, 390];
      for (let cell = 0; cell < 2; cell++) {
        const item = items[i + cell];
        if (!item) continue;
        const x = 50;
        const yTop = yPositions[cell];
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(item.title, { x, y: yTop, size: 12, font: titleFont });
        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (asset) {
          const cellMaxW = 500, cellMaxH = 320;
          let width, height;
          if (asset.kind === "image") { const d = asset.embedded.scale(1); width = d.width; height = d.height; }
          else { const p = asset.embeddedPages?.[0]; if (!p) continue; width = p.width || p.getWidth?.() || 595; height = p.height || p.getHeight?.() || 842; }
          let drawW = cellMaxW;
          let drawH = (height / width) * drawW;
          if (drawH > cellMaxH) { drawH = cellMaxH; drawW = (width / height) * drawH; }
          const drawY = yTop - drawH - 10;
          if (asset.kind === "image") page.drawImage(asset.embedded, { x, y: drawY, width: drawW, height: drawH });
          else { try { page.drawPage(asset.embeddedPages[0], { x, y: drawY, width: drawW, height: drawH }); } catch (e) {} }
        }
      }
    }
  };

  // -------------------------------------------------------------------------
  // SELL: PDF generators
  // -------------------------------------------------------------------------
  const fillAndDownloadHindiPdfSell = async (l, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      await simulateProgress();

      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("sellletter.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        const formattedLetter = {
          ...l,
          buyerName1: l.buyerName,
          buyerName2: l.buyerName,
          saleDate: formatDate(l.saleDate),
          saleTime: formatTime12Hour(l.saleTime),
          vehiclekm: formatKm(l.vehiclekm),
          todayDate: formatDate(l.todayDate || new Date()),
          todayTime: formatTime12Hour(l.todayTime || "12:00"),
          previousDate: formatDate(l.previousDate || l.todayDate || new Date()),
          previousTime: formatTime12Hour(l.previousTime || l.todayTime || "12:00"),
          amountInWords: formatIndianAmountInWordsSell(l.saleAmount),
          saleAmount: formatRupeeSell(l.saleAmount),
          sellerphone: l.sellerphone || "9876543210",
          selleraadhar: l.selleraadhar || "764465626571",
        };

        for (const [fieldName, position] of Object.entries(sellHindiFieldPositions)) {
          if (fieldName === "buyerPhone" && formattedLetter.buyerPhone) {
            const combinedPhones = `${formattedLetter.buyerPhone}${formattedLetter.buyerPhone2 ? ` , ${formattedLetter.buyerPhone2}` : ""}`;
            pdfDoc.getPages()[0].drawText(combinedPhones, {
              x: position.x, y: position.y, size: position.size, weight: "bold", color: rgb(0, 0, 0),
            });
          } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
            pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
              x: position.x, y: position.y, size: position.size, weight: "bold", color: rgb(0, 0, 0),
            });
          }
        }
        if (formattedLetter.saleAmount && formattedLetter.amountInWords) {
          const page = pdfDoc.getPages()[0];
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const saleText = `${formattedLetter.saleAmount}`;
          const xBase = sellHindiFieldPositions.saleAmount.x;
          const yBase = sellHindiFieldPositions.saleAmount.y;
          const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
          page.drawText(formattedLetter.amountInWords, {
            x: xBase + saleTextWidth + 8, y: yBase, size: 10, color: rgb(0, 0, 0), font,
          });
        }
      } else {
        pdfDoc = await PDFDocument.create();
      }

      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoiceSell(invoicePage, pdfDoc, l);
      }

      await addDocumentPagesSell(pdfDoc, documentsToInclude || l.documents);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg = l.registrationNumber || l.vehicle?.registrationNumber || l._id;
      link.setAttribute("download", `OKM-SELL-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadProgress(100);
    } catch (error) {
      console.error("Error generating Hindi PDF:", error);
      alert("Failed to generate Hindi PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const fillAndDownloadEnglishPdfSell = async (l, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      await simulateProgress();

      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("englishsell.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        const formattedLetter = {
          ...l,
          buyerName1: l.buyerName,
          buyerName2: l.buyerName,
          saleDate: formatDate(l.saleDate),
          saleTime: formatTime12Hour(l.saleTime),
          amountInWords: formatIndianAmountInWordsSell(l.saleAmount),
          saleAmount: formatRupeeSell(l.saleAmount),
          todayTime: formatTime12Hour(l.todayTime || "12:00"),
          previousDate: formatDate(l.previousDate || l.todayDate || new Date()),
          previousTime: formatTime12Hour(l.previousTime || l.todayTime || "12:00"),
          vehiclekm: formatKm(l.vehiclekm),
          sellerphone: l.sellerphone || "9876543210",
          selleraadhar: l.selleraadhar || "764465626571",
        };

        for (const [fieldName, position] of Object.entries(sellEnglishFieldPositions)) {
          if (fieldName === "buyerPhone" && formattedLetter.buyerPhone) {
            const combinedPhones = `${formattedLetter.buyerPhone}${formattedLetter.buyerPhone2 ? ` , ${formattedLetter.buyerPhone2}` : ""}`;
            pdfDoc.getPages()[0].drawText(combinedPhones, {
              x: position.x, y: position.y, size: position.size, weight: "bold", color: rgb(0, 0, 0),
            });
          } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
            pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
              x: position.x, y: position.y, size: position.size, weight: "bold", color: rgb(0, 0, 0),
            });
          }
        }
        if (formattedLetter.saleAmount && formattedLetter.amountInWords) {
          const page = pdfDoc.getPages()[0];
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const saleText = `${formattedLetter.saleAmount}`;
          const xBase = sellEnglishFieldPositions.saleAmount.x;
          const yBase = sellEnglishFieldPositions.saleAmount.y;
          const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
          const offsetMultiplier = 3;
          page.drawText(formattedLetter.amountInWords, {
            x: xBase + saleTextWidth + offsetMultiplier * (sellEnglishFieldPositions.saleAmount.size / 2),
            y: yBase, size: 10, color: rgb(0, 0, 0), font,
          });
        }
      } else {
        pdfDoc = await PDFDocument.create();
      }

      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoiceSell(invoicePage, pdfDoc, l);
      }

      await addDocumentPagesSell(pdfDoc, documentsToInclude || l.documents);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg = l.registrationNumber || l.vehicle?.registrationNumber || l._id;
      link.setAttribute("download", `OKM-SELL-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadProgress(100);
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // -------------------------------------------------------------------------
  // BUY: PDF generators
  // -------------------------------------------------------------------------
  const downloadHindiPdfBuy = async (l, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      await simulateProgress();

      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("buyletter.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        const formattedData = {
          ...l,
          buyerName1: l.buyerName,
          buyerName2: l.buyerName,
          sellerName1: l.sellerName,
          sellerFatherName1: l.sellerFatherName,
          buyerFatherName1: l.buyerFatherName,
          buyerCurrentAddress1: l.buyerCurrentAddress,
          todayDate1: formatDate(l.todayDate),
          todayTime: formatTime(l.todayTime),
          todayTime1: formatTime(l.todayTime),
          buyerCurrentAddress2: "PATNA BIHAR",
          saleDate: formatDate(l.saleDate),
          saleTime: formatTime(l.saleTime),
          todayDate: formatDate(l.todayDate),
          saleAmount: formatRupeeBuy(l.saleAmount),
          vehiclekm: formatKm(l.vehiclekm),
          amountInWords: formatIndianAmountInWordsBuy(l.saleAmount),
        };

        for (const [fieldName, position] of Object.entries(buyHindiFieldPositions)) {
          if (formattedData[fieldName]) {
            pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
              x: position.x, y: position.y, size: position.size, color: rgb(0, 0, 0),
            });
          }
        }
        const saleAmountText = formattedData.saleAmount || "";
        const saleAmountWidth = saleAmountText.length * (buyHindiFieldPositions.saleAmount.size / 2);
        const amountInWordsX =
          buyHindiFieldPositions.saleAmount.x +
          saleAmountWidth +
          1.4 * (buyHindiFieldPositions.saleAmount.size / 2);

        pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
          x: amountInWordsX, y: buyHindiFieldPositions.saleAmount.y,
          size: buyHindiFieldPositions.saleAmount.size, color: rgb(0, 0, 0),
        });
      } else {
        pdfDoc = await PDFDocument.create();
      }

      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoiceBuy(invoicePage, pdfDoc, l);
      }

      await addDocumentPagesBuy(pdfDoc, documentsToInclude || l.documents);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg = l.registrationNumber || l.vehicle?.registrationNumber || l._id;
      link.setAttribute("download", `OKM-BUY-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadProgress(100);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadEnglishPdfBuy = async (l, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      await simulateProgress();

      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("englishbuyletter.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        const formattedData = {
          ...l,
          buyerName1: l.buyerName,
          buyerName2: l.buyerName,
          sellerName1: l.sellerName,
          sellerFatherName1: l.sellerFatherName,
          buyerFatherName1: l.buyerFatherName,
          buyerCurrentAddress1: l.buyerCurrentAddress,
          todayDate1: formatDate(l.todayDate),
          todayTime: formatTime(l.todayTime),
          todayTime1: formatTime(l.todayTime),
          buyerCurrentAddress2: "PATNA BIHAR",
          saleDate: formatDate(l.saleDate),
          saleTime: formatTime(l.saleTime),
          todayDate: formatDate(l.todayDate),
          saleAmount: formatRupeeBuy(l.saleAmount),
          vehiclekm: formatKm(l.vehiclekm),
          amountInWords: formatIndianAmountInWordsBuy(l.saleAmount),
        };

        for (const [fieldName, position] of Object.entries(buyEnglishFieldPositions)) {
          if (formattedData[fieldName]) {
            pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
              x: position.x, y: position.y, size: position.size, color: rgb(0, 0, 0),
            });
          }
        }
        const saleAmountText = formattedData.saleAmount || "";
        const saleAmountWidth = saleAmountText.length * (buyEnglishFieldPositions.saleAmount.size / 2);
        const amountInWordsX =
          buyEnglishFieldPositions.saleAmount.x +
          saleAmountWidth +
          3 * (buyEnglishFieldPositions.saleAmount.size / 2);

        pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
          x: amountInWordsX, y: buyEnglishFieldPositions.saleAmount.y,
          size: buyEnglishFieldPositions.saleAmount.size, color: rgb(0, 0, 0),
        });
      } else {
        pdfDoc = await PDFDocument.create();
      }

      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoiceBuy(invoicePage, pdfDoc, l);
      }

      await addDocumentPagesBuy(pdfDoc, documentsToInclude || l.documents);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg = l.registrationNumber || l.vehicle?.registrationNumber || l._id;
      link.setAttribute("download", `OKM-BUY-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadProgress(100);
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Doc selection schema picker (mirrors the modal's English/Hindi onClick blocks)
  // -------------------------------------------------------------------------
  const buildInitialDocSelections = (l) => {
    if (isSell) {
      return {
        vehicleRC: !!l.documents?.vehicleRC,
        aadhaar: !!l.documents?.aadhaar,
        pan: !!l.documents?.pan,
        vehicleKM: !!(l.documents?.deliveryPhoto || l.documents?.vehicleKM),
        vehiclePhotos: !!(l.documents?.vehiclePhotos && l.documents.vehiclePhotos.length),
        signedDocSell: !!l.documents?.signedDocSell,
        transferReceipt: !!l.documents?.transferReceipt,
        insuranceCertificate: !!l.documents?.insuranceCertificate,
        vehicleNOC: !!l.documents?.vehicleNOC,
        letter: true,
        invoice: true,
      };
    }
    // buy
    return {
      vehicleRC: !!l.documents?.vehicleRC,
      aadhaar: !!l.documents?.aadhaar,
      pan: !!l.documents?.pan,
      vehicleKM: !!(l.documents?.deliveryPhoto || l.documents?.vehicleKM),
      vehiclePhotos: !!(l.documents?.vehiclePhotos && l.documents.vehiclePhotos.length),
      signedDocBuy: !!l.documents?.signedDocBuy,
      insuranceCertificate: !!l.documents?.insuranceCertificate,
      vehicleNOC: !!l.documents?.vehicleNOC,
      vehicleBuyReceipt: !!l.documents?.vehicleBuyReceipt,
      letter: true,
      invoice: true,
    };
  };

  const buildFilteredDocsSell = (docs = {}, sel = {}) => {
    const out = { letter: sel.letter, invoice: sel.invoice };
    if (sel.vehicleRC && docs.vehicleRC) out.vehicleRC = docs.vehicleRC;
    if (sel.aadhaar && docs.aadhaar) {
      out.aadhaar = docs.aadhaar;
      out.aadhaarUploadMode = docs.aadhaarUploadMode;
    }
    if (sel.pan && docs.pan) out.pan = docs.pan;
    if (sel.vehicleKM && (docs.deliveryPhoto || docs.vehicleKM))
      out.deliveryPhoto = docs.deliveryPhoto || docs.vehicleKM;
    if (sel.vehiclePhotos && docs.vehiclePhotos) out.vehiclePhotos = docs.vehiclePhotos;
    if (sel.signedDocSell && docs.signedDocSell) out.signedDocSell = docs.signedDocSell;
    if (sel.insuranceCertificate && docs.insuranceCertificate) out.insuranceCertificate = docs.insuranceCertificate;
    if (sel.vehicleNOC && docs.vehicleNOC) out.vehicleNOC = docs.vehicleNOC;
    if (sel.transferReceipt && docs.transferReceipt) out.transferReceipt = docs.transferReceipt;
    return out;
  };

  const buildFilteredDocsBuy = (docs = {}, sel = {}) => {
    const out = { letter: sel.letter, invoice: sel.invoice };
    if (sel.vehicleRC && docs.vehicleRC) out.vehicleRC = docs.vehicleRC;
    if (sel.aadhaar && docs.aadhaar) {
      out.aadhaar = docs.aadhaar;
      out.aadhaarUploadMode = docs.aadhaarUploadMode;
    }
    if (sel.pan && docs.pan) out.pan = docs.pan;
    if (sel.vehicleKM && (docs.deliveryPhoto || docs.vehicleKM))
      out.deliveryPhoto = docs.deliveryPhoto || docs.vehicleKM;
    if (sel.vehiclePhotos && docs.vehiclePhotos) out.vehiclePhotos = docs.vehiclePhotos;
    if (sel.signedDocBuy && docs.signedDocBuy) out.signedDocBuy = docs.signedDocBuy;
    if (sel.insuranceCertificate && docs.insuranceCertificate) out.insuranceCertificate = docs.insuranceCertificate;
    if (sel.vehicleNOC && docs.vehicleNOC) out.vehicleNOC = docs.vehicleNOC;
    if (sel.vehicleBuyReceipt && docs.vehicleBuyReceipt) out.vehicleBuyReceipt = docs.vehicleBuyReceipt;
    return out;
  };

  // -------------------------------------------------------------------------
  // Styles (copied from SellLetterHistory `styles` + `modalStyles` + `progressStyles`)
  // -------------------------------------------------------------------------
  const styles = {
    modalOverlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px",
      width: "400px", maxWidth: "90%",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    modalTitle: {
      fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#1e293b",
    },
    modalText: { marginBottom: "24px", color: "#64748b" },
    modalButtons: { display: "flex", gap: "16px", marginBottom: "24px" },
    englishButton: {
      flex: 1, padding: "12px", backgroundColor: "#088395", color: "white",
      border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500",
    },
    hindiButton: {
      flex: 1, padding: "12px", backgroundColor: "#37B7C3", color: "white",
      border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500",
    },
    modalCloseButton: {
      width: "100%", padding: "8px", backgroundColor: "#f1f5f9", color: "#64748b",
      border: "none", borderRadius: "6px", cursor: "pointer",
    },
  };

  const modalStyles = {
    overlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "#ffffff", borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      width: "80%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto",
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 24px", borderBottom: "1px solid #e2e8f0",
    },
    title: { fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "#1e293b" },
  };

  const progressStyles = {
    progressContainer: {
      width: "100%", height: "20px", backgroundColor: "#e2e8f0",
      borderRadius: "10px", overflow: "hidden", marginBottom: "8px",
    },
    progressBar: { height: "100%", backgroundColor: "#088395", transition: "width 0.3s ease" },
    progressText: { fontSize: "0.875rem", color: "#64748b" },
  };

  // -------------------------------------------------------------------------
  // Inline DownloadProgressModal
  // -------------------------------------------------------------------------
  const DownloadProgressModal = ({ progress, onClose: handleClose }) => (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Generating PDF</h2>
        </div>
        <div style={{ padding: "24px", textAlign: "center" }}>
          <div style={progressStyles.progressContainer}>
            <div style={{ ...progressStyles.progressBar, width: `${progress}%` }} />
          </div>
          <p style={progressStyles.progressText}>{progress}% Complete</p>
          {progress === 100 && (
            <button
              onClick={handleClose}
              style={{
                padding: "8px 16px", backgroundColor: "#088395", color: "white",
                border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "16px",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Document-selection items per letter type
  // -------------------------------------------------------------------------
  const supportingDocList = isSell
    ? [
        { key: "vehicleRC", label: "Vehicle RC (Front/Back)" },
        { key: "aadhaar", label: "Aadhaar (Front/Back)" },
        { key: "pan", label: "PAN Card" },
        { key: "vehicleKM", label: "Vehicle KM Photo" },
        { key: "vehiclePhotos", label: "Vehicle Photos" },
        { key: "signedDocSell", label: "Signed Doc (Sell)" },
        { key: "insuranceCertificate", label: "Insurance Certificate" },
        { key: "vehicleNOC", label: "Vehicle NOC" },
        { key: "transferReceipt", label: "Transfer Receipt" },
      ]
    : [
        { key: "vehicleRC", label: "Vehicle RC (Front/Back)" },
        { key: "aadhaar", label: "Aadhaar (Front/Back)" },
        { key: "pan", label: "PAN Card" },
        { key: "vehicleKM", label: "Vehicle KM Photo" },
        { key: "vehiclePhotos", label: "Vehicle Photos" },
        { key: "signedDocBuy", label: "Signed Doc (Buy)" },
        { key: "insuranceCertificate", label: "Insurance Certificate" },
        { key: "vehicleNOC", label: "Vehicle NOC" },
        { key: "vehicleBuyReceipt", label: "Vehicle Buy Receipt" },
      ];

  const letterLabel = isSell ? "Sell Letter" : "Buy Letter";
  const promptText = isSell
    ? "Choose the language for your sell letter:"
    : "Choose the language for your buy letter:";

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleLanguagePick = (lang) => {
    if (!letter) return;
    setChosenLanguage(lang);
    setShowLanguageModal(false);
    setDocSelections(buildInitialDocSelections(letter));
    setShowDocumentModal(true);
  };

  const handleDownloadClick = async () => {
    if (!letter) return;
    const filtered = isSell
      ? buildFilteredDocsSell(letter.documents, docSelections)
      : buildFilteredDocsBuy(letter.documents, docSelections);

    setShowDocumentModal(false);

    if (isSell) {
      if (chosenLanguage === "hindi") await fillAndDownloadHindiPdfSell(letter, filtered);
      else await fillAndDownloadEnglishPdfSell(letter, filtered);
    } else {
      if (chosenLanguage === "hindi") await downloadHindiPdfBuy(letter, filtered);
      else await downloadEnglishPdfBuy(letter, filtered);
    }
    // After the PDF has been generated and downloaded, let the caller know.
    close();
  };

  // Re-used checkbox row renderer for the doc-selection modal.
  const renderCheckRow = (key, label, extra = {}) => {
    const checked = !!docSelections[key];
    return (
      <label
        key={key}
        style={{
          display: "flex", alignItems: "center", padding: "10px 12px",
          marginBottom: "8px",
          backgroundColor: checked ? "#f0f9ff" : "transparent",
          border: `2px solid ${checked ? "#0284c7" : "#e2e8f0"}`,
          borderRadius: "8px", cursor: "pointer", transition: "all 0.2s ease",
          ...extra,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) =>
            setDocSelections((s) => ({ ...s, [key]: e.target.checked }))
          }
          style={{
            width: "18px", height: "18px", marginRight: "12px",
            accentColor: "#0284c7", cursor: "pointer",
          }}
        />
        <span style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>
          {label}
        </span>
      </label>
    );
  };

  if (!letter) return null;

  return (
    <>
      {showLanguageModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Select PDF Language</h3>
            <p style={styles.modalText}>{promptText}</p>
            <div style={styles.modalButtons}>
              <button style={styles.englishButton} onClick={() => handleLanguagePick("english")}>
                English PDF
              </button>
              <button style={styles.hindiButton} onClick={() => handleLanguagePick("hindi")}>
                Hindi PDF
              </button>
            </div>
            <button style={styles.modalCloseButton} onClick={close}>
              Close
            </button>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: "500px", padding: 0 }}>
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#1e293b" }}>
                Select Items to Include
              </h3>
              <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                Choose which items to include in the PDF
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "13px", fontWeight: "600", color: "#475569",
                    marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px",
                  }}
                >
                  Main Documents
                </div>
                {renderCheckRow("letter", letterLabel)}
                {renderCheckRow("invoice", "Invoice")}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    fontSize: "13px", fontWeight: "600", color: "#475569",
                    marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px",
                  }}
                >
                  Supporting Documents
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {supportingDocList.map((d) =>
                    renderCheckRow(d.key, d.label, { marginBottom: 0 })
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex", gap: "12px",
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <button
                style={{
                  flex: 1, padding: "10px 16px",
                  backgroundColor: "#ffffff", color: "#475569",
                  border: "2px solid #e2e8f0", borderRadius: "8px",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                }}
                onClick={close}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1, padding: "10px 16px",
                  backgroundColor: "#0284c7", color: "#ffffff",
                  border: "none", borderRadius: "8px",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                }}
                onClick={handleDownloadClick}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {isDownloading && (
        <DownloadProgressModal
          progress={downloadProgress}
          onClose={() => {
            setIsDownloading(false);
            close();
          }}
        />
      )}
    </>
  );
};

export default VehicleLetterDownloader;
