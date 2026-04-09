import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { loadPDFTemplate } from "../utils/pdfTemplateLoader";
import {
  Wrench,
  FileText,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Download,
  Eye,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
import PdfPreview from "./PdfPreview";
import logo1 from "../images/okmotorback.png";

const BikeHistory = ({ externalSearchTerm }) => {
  const { user, logout } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [bikeHistory, setBikeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (
      typeof externalSearchTerm !== "undefined" &&
      externalSearchTerm !== null
    ) {
      const term = String(externalSearchTerm || "").trim();
      if (term && term !== searchTerm) {
        setSearchTerm(term);
      }
      if (!term) {
        setSearchTerm("");
      }
    }
  }, [externalSearchTerm, searchTerm]);

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

  const addHeaderFooterToPage = async (page, pdfDoc) => {
    try {
      const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const logoUrl = logo1;
      const logoImageBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
      const logoImage = await pdfDoc.embedPng(logoImageBytes);

      // Draw header background
      page.drawRectangle({
        x: 0,
        y: 780,
        width: 595,
        height: 62,
        color: rgb(0.047, 0.098, 0.196),
      });

      // Draw logo
      page.drawImage(logoImage, {
        x: 50,
        y: 740,
        width: 160,
        height: 130,
      });

      // Draw company info
      page.drawText("UDAYAM-BR-26-0028550", {
        x: 330,
        y: 815,
        size: 14,
        color: rgb(1, 1, 1),
        font: headerFont,
      });

      page.drawText("GSTIN: 22ABCDE1234F1Z5", {
        x: 330,
        y: 795,
        size: 14,
        color: rgb(1, 1, 1),
        font: headerFont,
      });

      // Draw footer
      page.drawLine({
        start: { x: 20, y: 52 },
        end: { x: 575, y: 52 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      const thankText = "Thank you for your business!";
      const addrText =
        "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
      const thankWidth = headerFont.widthOfTextAtSize(thankText, 12);
      const addrWidth = regularFont.widthOfTextAtSize(addrText, 8);
      const thankX = (595 - thankWidth) / 2;
      const addrX = (595 - addrWidth) / 2;

      page.drawText(thankText, {
        x: thankX,
        y: 40,
        size: 12,
        color: rgb(0, 0, 0),
        font: headerFont,
      });

      page.drawText(addrText, {
        x: addrX,
        y: 26,
        size: 8,
        color: rgb(0.4, 0.4, 0.4),
        font: regularFont,
      });
    } catch (err) {
      console.warn("Failed to add header/footer:", err);
    }
  };

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

      // Add header/footer to pages after the first (leave first page as the letter)
      try {
        const pages = pdfDoc.getPages();
        if (pages.length > 1) {
          const headerFont = await pdfDoc.embedFont(
            StandardFonts.HelveticaBold,
          );
          const logoUrl = logo1;
          const logoImageBytes = await fetch(logoUrl).then((r) =>
            r.arrayBuffer(),
          );
          const logoImage = await pdfDoc.embedPng(logoImageBytes);

          for (let i = 1; i < pages.length; i++) {
            const p = pages[i];
            try {
              p.drawRectangle({
                x: 0,
                y: 780,
                width: 595,
                height: 80,
                color: rgb(0.047, 0.098, 0.196),
              });
              p.drawImage(logoImage, {
                x: 50,
                y: 740,
                width: 160,
                height: 130,
              });
              try {
                p.drawImage(logoImage, {
                  x: 280,
                  y: 200,
                  width: 370,
                  height: 300,
                  opacity: 0.3,
                  rotate: degrees(45),
                });
              } catch (e) {}
              p.drawText("UDAYAM-BR-26-0028550", {
                x: 330,
                y: 815,
                size: 14,
                color: rgb(1, 1, 1),
                font: headerFont,
              });
              p.drawText("GSTIN: 22ABCDE1234F1Z5", {
                x: 330,
                y: 795,
                size: 14,
                color: rgb(1, 1, 1),
                font: headerFont,
              });
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn(
          "Failed to add header/footer to sellletter preview template pages",
          err,
        );
      }

      for (const [fieldName, position] of Object.entries(
        buyLetterFieldPositions,
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

      // Add document pages
      try {
        const docs = letter.documents || {};
        const docUrls = [];

        // Collect all document URLs
        if (docs.vehicleRC?.front)
          docUrls.push({
            label: "Vehicle RC (Front)",
            url: docs.vehicleRC.front,
          });
        if (docs.vehicleRC?.back)
          docUrls.push({
            label: "Vehicle RC (Back)",
            url: docs.vehicleRC.back,
          });
        if (docs.aadhaar?.front)
          docUrls.push({ label: "Aadhaar (Front)", url: docs.aadhaar.front });
        if (docs.aadhaar?.back)
          docUrls.push({ label: "Aadhaar (Back)", url: docs.aadhaar.back });
        if (docs.pan) docUrls.push({ label: "PAN", url: docs.pan });
        if (docs.deliveryPhoto)
          docUrls.push({ label: "Delivery Photo", url: docs.deliveryPhoto });
        if (docs.signedDocBuy)
          docUrls.push({ label: "Signed Document", url: docs.signedDocBuy });
        if (Array.isArray(docs.insuranceCertificate)) {
          docs.insuranceCertificate.forEach((url, idx) => {
            docUrls.push({ label: `Insurance Certificate (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehicleNOC)) {
          docs.vehicleNOC.forEach((url, idx) => {
            docUrls.push({ label: `Vehicle NOC (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehicleBuyReceipt)) {
          docs.vehicleBuyReceipt.forEach((url, idx) => {
            docUrls.push({ label: `Buy Receipt (${idx + 1})`, url });
          });
        }

        // Add each document as a page
        for (const doc of docUrls) {
          try {
            const response = await fetch(doc.url);
            const imageData = await response.arrayBuffer();
            let documentImage;

            if (doc.url.toLowerCase().endsWith(".pdf")) {
              // Skip PDF files for now, can be enhanced later
              continue;
            } else {
              documentImage = await pdfDoc
                .embedPng(imageData)
                .catch(() => pdfDoc.embedJpg(imageData));
            }

            const docPage = pdfDoc.addPage([595, 842]);

            // Add header and footer first
            await addHeaderFooterToPage(docPage, pdfDoc);

            const { width, height } = documentImage.scaleToFit(500, 650);
            docPage.drawImage(documentImage, {
              x: 47.5,
              y: 660 - height,
              width,
              height,
            });

            // Add document label
            const labelFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            docPage.drawText(doc.label, {
              x: 22.5,
              y: 690,
              size: 12,
              color: rgb(0, 0, 0),
              font: labelFont,
            });
          } catch (docErr) {
            console.warn(`Failed to add document ${doc.label}:`, docErr);
          }
        }
      } catch (docsErr) {
        console.warn("Failed to add documents:", docsErr);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `buy_letter_${letter.registrationNumber}_${formatDate(
        letter.date,
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
          letter.previousDate || letter.todayDate || new Date(),
        ),
        previousTime: formatTime12Hour(
          letter.previousTime || letter.todayTime || "12:00",
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
        sellLetterFieldPositions,
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

      // Add document pages
      try {
        const docs = letter.documents || {};
        const docUrls = [];

        // Collect all document URLs
        if (docs.vehicleRC?.front)
          docUrls.push({
            label: "Vehicle RC (Front)",
            url: docs.vehicleRC.front,
          });
        if (docs.vehicleRC?.back)
          docUrls.push({
            label: "Vehicle RC (Back)",
            url: docs.vehicleRC.back,
          });
        if (docs.aadhaar?.front)
          docUrls.push({ label: "Aadhaar (Front)", url: docs.aadhaar.front });
        if (docs.aadhaar?.back)
          docUrls.push({ label: "Aadhaar (Back)", url: docs.aadhaar.back });
        if (docs.pan) docUrls.push({ label: "PAN", url: docs.pan });
        if (docs.deliveryPhoto)
          docUrls.push({ label: "Delivery Photo", url: docs.deliveryPhoto });
        if (docs.signedDocSell)
          docUrls.push({ label: "Signed Document", url: docs.signedDocSell });
        if (Array.isArray(docs.insuranceCertificate)) {
          docs.insuranceCertificate.forEach((url, idx) => {
            docUrls.push({ label: `Insurance Certificate (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehiclePhotos)) {
          docs.vehiclePhotos.forEach((url, idx) => {
            docUrls.push({ label: `Vehicle Photo (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehicleNOC)) {
          docs.vehicleNOC.forEach((url, idx) => {
            docUrls.push({ label: `Vehicle NOC (${idx + 1})`, url });
          });
        }

        // Add each document as a page
        for (const doc of docUrls) {
          try {
            const response = await fetch(doc.url);
            const imageData = await response.arrayBuffer();
            let documentImage;

            if (doc.url.toLowerCase().endsWith(".pdf")) {
              // Skip PDF files for now
              continue;
            } else {
              documentImage = await pdfDoc
                .embedPng(imageData)
                .catch(() => pdfDoc.embedJpg(imageData));
            }

            const docPage = pdfDoc.addPage([595, 842]);

            // Add header and footer first
            await addHeaderFooterToPage(docPage, pdfDoc);

            const { width, height } = documentImage.scaleToFit(500, 650);
            docPage.drawImage(documentImage, {
              x: 47.5,
              y: 660 - height,
              width,
              height,
            });

            // Add document label
            const labelFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            docPage.drawText(doc.label, {
              x: 22.5,
              y: 690,
              size: 12,
              color: rgb(0, 0, 0),
              font: labelFont,
            });
          } catch (docErr) {
            console.warn(`Failed to add document ${doc.label}:`, docErr);
          }
        }
      } catch (docsErr) {
        console.warn("Failed to add documents:", docsErr);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `sell_letter_${letter.registrationNumber}_${formatDate(
        letter.date,
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
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1;
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer(),
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
      y: 815,
      size: 14,
      color: rgb(1, 1, 1),
      font: fontBold,
    });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", {
      x: 330,
      y: 795,
      size: 14,
      color: rgb(1, 1, 1),
      font: fontBold,
    });
    try {
      const thank = "Thank you for your business!";
      const addr =
        "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
      const thankW = fontBold.widthOfTextAtSize(thank, 12);
      const addrW = font.widthOfTextAtSize(addr, 8);
      const cxThank = (595 - thankW) / 2;
      const cxAddr = (595 - addrW) / 2;

      page.drawText(thank, {
        x: cxThank,
        y: 40,
        size: 12,
        color: rgb(0, 0, 0),
        font: fontBold,
      });
      page.drawText(addr, {
        x: cxAddr,
        y: 26,
        size: 8,
        color: rgb(0.4, 0.4, 0.4),
        font: font,
      });
    } catch (e) {}
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
      Math.random() * 10000,
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
      },
    );
    page.drawText(
      `Amount in Words: ${formatIndianAmountInWords(letter.saleAmount)}`,
      {
        x: 60,
        y: 460,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
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
        letter.saleAmount,
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
  };

  const drawVehicleInvoiceForSell = async (page, pdfDoc, letter) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1;
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer(),
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
      y: 815,
      size: 14,
      color: rgb(1, 1, 1),
      font: boldFont,
    });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", {
      x: 330,
      y: 795,
      size: 14,
      color: rgb(1, 1, 1),
      font: boldFont,
    });
    page.drawText(
      "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
      {
        x: 50,
        y: 770,
        size: 8,
        color: rgb(0.8, 0.8, 0.8),
        font: font,
      },
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
      Math.random() * 10000,
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
      },
    );

    page.drawText(
      `Amount in Words: ${formatIndianAmountInWords(letter.saleAmount)}`,
      {
        x: 60,
        y: 445,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
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
      y: 395,
      size: 14,
      color: rgb(1, 1, 1),
      font: boldFont,
    });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", {
      x: 330,
      y: 375,
      size: 14,
      color: rgb(1, 1, 1),
      font: boldFont,
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
        letter.saleAmount,
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
  };

  const fetchBikeHistory = useCallback(async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const [
        buyLetters,
        sellLetters,
        serviceBills,
        advanceBills,
        insuranceResp,
        pucResp,
      ] = await Promise.all([
        axios.get(
          `https://ok-motor-51l3.vercel.app/api/buy-letter/by-registration?registrationNumber=${searchTerm}`,
        ),
        axios.get(
          `https://ok-motor-51l3.vercel.app/api/sell-letters/by-registration?registrationNumber=${searchTerm}`,
        ),
        axios.get(
          `https://ok-motor-51l3.vercel.app/api/service-bills/by-registration?registrationNumber=${searchTerm}`,
        ),
        axios.get(
          `https://ok-motor-51l3.vercel.app/api/advance-bills/by-registration?registrationNumber=${searchTerm}`,
        ),
        // insurance and puc endpoints return single records (or 404) when queried by vehicle
        axios
          .get(
            `https://ok-motor-51l3.vercel.app/api/insurance/vehicle/${encodeURIComponent(searchTerm)}`,
          )
          .catch((e) => ({ status: e.response?.status || 500, data: null })),
        axios
          .get(
            `https://ok-motor-51l3.vercel.app/api/puc/vehicle/${encodeURIComponent(searchTerm)}`,
          )
          .catch((e) => ({ status: e.response?.status || 500, data: null })),
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

      console.log(
        "insuranceResp:",
        insuranceResp && insuranceResp.status,
        insuranceResp && insuranceResp.data,
      );
      console.log(
        "pucResp:",
        pucResp && pucResp.status,
        pucResp && pucResp.data,
      );

      const insuranceData =
        insuranceResp && insuranceResp.status === 200 && insuranceResp.data
          ? Array.isArray(insuranceResp.data)
            ? insuranceResp.data
            : [insuranceResp.data]
          : [];

      const pucData =
        pucResp && pucResp.status === 200 && pucResp.data
          ? Array.isArray(pucResp.data)
            ? pucResp.data
            : [pucResp.data]
          : [];

      const processLetterData = (data, type) => {
        if (!data || data.length === 0) return [];

        // 1. Group records by registration number and date part
        const groups = {};
        data.forEach((item) => {
          const dateKey = item.saleDate
            ? item.saleDate.split("T")[0]
            : "nodate";
          const groupKey = `${item.registrationNumber}-${dateKey}`;
          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push(item);
        });

        const processed = [];

        Object.values(groups).forEach((group) => {
          // Sort chronologically (oldest version first)
          group.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          const baseItem = group[0];

          // Get the properly merged Sale Date and Sale Time
          const actualSaleTimestamp = new Date(
            `${baseItem.saleDate.split("T")[0]}T${baseItem.saleTime}:00`,
          ).getTime();
          const fallbackTimestamp = baseItem.createdAt
            ? new Date(baseItem.createdAt).getTime()
            : 0;
          const creationTimestamp = actualSaleTimestamp || fallbackTimestamp;

          // A) ALWAYS CREATE EXACTLY ONE "CREATED" ROW WITH PROPER TIME
          processed.push({
            ...baseItem,
            type: type,
            date: creationTimestamp,
            createdAt: creationTimestamp, // Bypass your `isEditedActionItem` check
            saleDate: creationTimestamp,
            changeHistory: [],
            previousVersionId: null,
            editedAt: null,
            _id: `${baseItem._id}-created-base`,
          });

          // B) RENDER EVERY SINGLE EDIT ROW INDEPENDENTLY
          group.forEach((doc, index) => {
            // Check if this specific document has edit flags or is a subsequent version
            const isEdit =
              doc.previousVersionId ||
              (Array.isArray(doc.changeHistory) &&
                doc.changeHistory.length > 0) ||
              doc.editedAt ||
              index > 0; // If index > 0, it's definitely an edit of the base

            if (isEdit) {
              const editTimestamp = doc.editedAt
                ? new Date(doc.editedAt).getTime()
                : doc.updatedAt
                  ? new Date(doc.updatedAt).getTime()
                  : new Date(doc.createdAt).getTime();

              processed.push({
                ...doc,
                type: type,
                date: editTimestamp,
                editedAt: editTimestamp, // Forces UI to show as "Edited"
                _id: `${doc._id}-edit-version-${index}`,
              });
            }
          });
        });

        return processed;
      };

      const processedBuyData = processLetterData(buyData, "buy");
      const processedSellData = processLetterData(sellData, "sell");
      // --- END OF NEW FLAWLESS LOGIC ---

      const combinedData = [
        ...processedBuyData,
        ...processedSellData,
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
        ...insuranceData.map((item) => ({
          ...item,
          type: "insurance",
          date: item.createdAt,
        })),
        ...pucData.map((item) => ({
          ...item,
          type: "puc",
          date: item.createdAt,
        })),
      ];

      // If no data at all, show empty state
      if (combinedData.length === 0) {
        setBikeHistory([]);
        return;
      }

      // If no data at all, show empty state
      if (combinedData.length === 0) {
        setBikeHistory([]);
        return;
      }

      // Add insurance renewal entries only if a previous version exists (meaning it's been edited)
      insuranceData.forEach((item) => {
        if (item.previousVersionId) {
          // Only add renewal entry if there's an actual previous version
          combinedData.push({
            ...item,
            type: "insurance-renewed",
            date: item.editedAt || item.updatedAt,
            _id: `${item._id}-renewed`,
          });
        }
      });

      // Add PUC renewal entries only if a previous version exists (meaning it's been edited)
      pucData.forEach((item) => {
        if (item.previousVersionId) {
          // Only add renewal entry if there's an actual previous version
          combinedData.push({
            ...item,
            type: "puc-renewed",
            date: item.editedAt || item.updatedAt,
            _id: `${item._id}-renewed`,
          });
        }
      });

      // Fetch previous versions for items that have been edited
      const itemsWithPreviousVersionId = combinedData.filter(
        (item) => item.previousVersionId,
      );

      if (itemsWithPreviousVersionId.length > 0) {
        try {
          const prevVersionPromises = itemsWithPreviousVersionId.map((item) => {
            if (item.type === "buy" || item.type === "sell") {
              return axios
                .get(
                  `https://ok-motor-51l3.vercel.app/api/${item.type}-letter/${item.previousVersionId}`,
                )
                .then((res) => ({ id: item._id, previousVersion: res.data }))
                .catch(() => ({ id: item._id, previousVersion: null }));
            }
            return Promise.resolve({ id: item._id, previousVersion: null });
          });

          const previousVersions = await Promise.all(prevVersionPromises);
          const prevVersionMap = new Map(
            previousVersions.map((pv) => [pv.id, pv.previousVersion]),
          );

          combinedData.forEach((item) => {
            if (prevVersionMap.has(item._id)) {
              item.previousVersion = prevVersionMap.get(item._id);
            }
          });
        } catch (err) {
          console.warn("Failed to fetch previous versions:", err);
        }
      }

      const getSortTimestamp = (historyItem) => {
        const type = historyItem?.type;
        const candidateDates = [
          // Prefer normalized action date first (set while building combinedData).
          historyItem.date,
          // Renewal entries should follow updated time as the action timestamp.
          type === "puc-renewed" || type === "insurance-renewed"
            ? historyItem.updatedAt
            : null,
          type === "service" ? historyItem.serviceDate : null,
          type === "sell" ? historyItem.saleDate : null,
          type === "buy" ? historyItem.saleDate : null,
          historyItem.editedAt,
          historyItem.updatedAt,
          historyItem.saleDate,
          historyItem.serviceDate,
          historyItem.pucIssueDate,
          historyItem.pucExpiryDate,
          historyItem.insuranceExpiryDate,
          historyItem.createdAt,
        ];

        const parseDateValue = (value) => {
          if (!value) return NaN;
          if (value instanceof Date) return value.getTime();

          const directParsed = new Date(value).getTime();
          if (!Number.isNaN(directParsed)) return directParsed;

          if (typeof value === "string") {
            const trimmedValue = value.trim();
            const ddmmyyyyMatch = trimmedValue.match(
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2})\s*(am|pm)?)?$/i,
            );

            if (ddmmyyyyMatch) {
              const day = Number(ddmmyyyyMatch[1]);
              const month = Number(ddmmyyyyMatch[2]) - 1;
              const year = Number(ddmmyyyyMatch[3]);
              let hours = Number(ddmmyyyyMatch[4] || 0);
              const minutes = Number(ddmmyyyyMatch[5] || 0);
              const meridiem = (ddmmyyyyMatch[6] || "").toLowerCase();

              if (meridiem === "pm" && hours < 12) hours += 12;
              if (meridiem === "am" && hours === 12) hours = 0;

              return new Date(year, month, day, hours, minutes).getTime();
            }
          }

          return NaN;
        };

        for (const candidate of candidateDates) {
          const timestamp = parseDateValue(candidate);
          if (!Number.isNaN(timestamp)) return timestamp;
        }

        // Keep entries with invalid dates at the bottom in latest-first sorting.
        return 0;
      };

      const isEditedEntry = (historyItem) => {
        if (!historyItem) return false;

        if (
          historyItem.previousVersionId ||
          (Array.isArray(historyItem.changeHistory) &&
            historyItem.changeHistory.length > 0)
        ) {
          return true;
        }

        if (historyItem.editedAt && historyItem.createdAt) {
          const editedTime = new Date(historyItem.editedAt).getTime();
          const createdTime = new Date(historyItem.createdAt).getTime();
          if (!Number.isNaN(editedTime) && !Number.isNaN(createdTime)) {
            return editedTime > createdTime + 1000;
          }
        }

        return false;
      };

      combinedData.sort((firstItem, secondItem) => {
        const secondTimestamp = getSortTimestamp(secondItem);
        const firstTimestamp = getSortTimestamp(firstItem);
        // Sort in descending order: newest at top, oldest at bottom
        const timestampDiff = secondTimestamp - firstTimestamp;
        if (timestampDiff !== 0) return timestampDiff;

        const getActionPriority = (historyItem) => {
          const type = historyItem?.type;
          const edited =
            (type === "buy" || type === "sell") && isEditedEntry(historyItem);

          if (type === "service") return 1;
          if (type === "puc-renewed") return 2;
          if (type === "insurance-renewed") return 3;
          if (type === "sell" && !edited) return 4;
          if (type === "buy" && !edited) return 5;
          if (type === "advance") return 6;
          if (edited) return 7;
          if (type === "insurance") return 8;
          if (type === "puc") return 9;
          return 99;
        };

        return getActionPriority(firstItem) - getActionPriority(secondItem);
      });

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
        buyLetterFieldPositions,
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

      // Add document pages
      try {
        const docs = letter.documents || {};
        const docUrls = [];

        // Collect all document URLs
        if (docs.vehicleRC?.front)
          docUrls.push({
            label: "Vehicle RC (Front)",
            url: docs.vehicleRC.front,
          });
        if (docs.vehicleRC?.back)
          docUrls.push({
            label: "Vehicle RC (Back)",
            url: docs.vehicleRC.back,
          });
        if (docs.aadhaar?.front)
          docUrls.push({ label: "Aadhaar (Front)", url: docs.aadhaar.front });
        if (docs.aadhaar?.back)
          docUrls.push({ label: "Aadhaar (Back)", url: docs.aadhaar.back });
        if (docs.pan) docUrls.push({ label: "PAN", url: docs.pan });
        if (docs.deliveryPhoto)
          docUrls.push({ label: "Delivery Photo", url: docs.deliveryPhoto });
        if (docs.signedDocBuy)
          docUrls.push({ label: "Signed Document", url: docs.signedDocBuy });
        if (Array.isArray(docs.insuranceCertificate)) {
          docs.insuranceCertificate.forEach((url, idx) => {
            docUrls.push({ label: `Insurance Certificate (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehicleNOC)) {
          docs.vehicleNOC.forEach((url, idx) => {
            docUrls.push({ label: `Vehicle NOC (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehicleBuyReceipt)) {
          docs.vehicleBuyReceipt.forEach((url, idx) => {
            docUrls.push({ label: `Buy Receipt (${idx + 1})`, url });
          });
        }

        // Add each document as a page
        for (const doc of docUrls) {
          try {
            const response = await fetch(doc.url);
            const imageData = await response.arrayBuffer();
            let documentImage;

            if (doc.url.toLowerCase().endsWith(".pdf")) {
              continue;
            } else {
              documentImage = await pdfDoc
                .embedPng(imageData)
                .catch(() => pdfDoc.embedJpg(imageData));
            }

            const docPage = pdfDoc.addPage([595, 842]);

            // Add header and footer first
            await addHeaderFooterToPage(docPage, pdfDoc);

            const { width, height } = documentImage.scaleToFit(500, 650);
            docPage.drawImage(documentImage, {
              x: 47.5,
              y: 660 - height,
              width,
              height,
            });

            // Add document label
            const labelFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            docPage.drawText(doc.label, {
              x: 22.5,
              y: 690,
              size: 12,
              color: rgb(0, 0, 0),
              font: labelFont,
            });
          } catch (docErr) {
            console.warn(`Failed to add document ${doc.label}:`, docErr);
          }
        }
      } catch (docsErr) {
        console.warn("Failed to add documents:", docsErr);
      }

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
          letter.previousDate || letter.todayDate || new Date(),
        ),
        previousTime: formatTime12Hour(
          letter.previousTime || letter.todayTime || "12:00",
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
        sellLetterFieldPositions,
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

      // Add document pages
      try {
        const docs = letter.documents || {};
        const docUrls = [];

        // Collect all document URLs
        if (docs.vehicleRC?.front)
          docUrls.push({
            label: "Vehicle RC (Front)",
            url: docs.vehicleRC.front,
          });
        if (docs.vehicleRC?.back)
          docUrls.push({
            label: "Vehicle RC (Back)",
            url: docs.vehicleRC.back,
          });
        if (docs.aadhaar?.front)
          docUrls.push({ label: "Aadhaar (Front)", url: docs.aadhaar.front });
        if (docs.aadhaar?.back)
          docUrls.push({ label: "Aadhaar (Back)", url: docs.aadhaar.back });
        if (docs.pan) docUrls.push({ label: "PAN", url: docs.pan });
        if (docs.deliveryPhoto)
          docUrls.push({ label: "Delivery Photo", url: docs.deliveryPhoto });
        if (docs.signedDocSell)
          docUrls.push({ label: "Signed Document", url: docs.signedDocSell });
        if (Array.isArray(docs.insuranceCertificate)) {
          docs.insuranceCertificate.forEach((url, idx) => {
            docUrls.push({ label: `Insurance Certificate (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehiclePhotos)) {
          docs.vehiclePhotos.forEach((url, idx) => {
            docUrls.push({ label: `Vehicle Photo (${idx + 1})`, url });
          });
        }
        if (Array.isArray(docs.vehicleNOC)) {
          docs.vehicleNOC.forEach((url, idx) => {
            docUrls.push({ label: `Vehicle NOC (${idx + 1})`, url });
          });
        }

        // Add each document as a page
        for (const doc of docUrls) {
          try {
            const response = await fetch(doc.url);
            const imageData = await response.arrayBuffer();
            let documentImage;

            if (doc.url.toLowerCase().endsWith(".pdf")) {
              continue;
            } else {
              documentImage = await pdfDoc
                .embedPng(imageData)
                .catch(() => pdfDoc.embedJpg(imageData));
            }

            const docPage = pdfDoc.addPage([595, 842]);

            // Add header and footer first
            await addHeaderFooterToPage(docPage, pdfDoc);

            const { width, height } = documentImage.scaleToFit(500, 650);
            docPage.drawImage(documentImage, {
              x: 47.5,
              y: 660 - height,
              width,
              height,
            });

            // Add document label
            const labelFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            docPage.drawText(doc.label, {
              x: 22.5,
              y: 690,
              size: 12,
              color: rgb(0, 0, 0),
              font: labelFont,
            });
          } catch (docErr) {
            console.warn(`Failed to add document ${doc.label}:`, docErr);
          }
        }
      } catch (docsErr) {
        console.warn("Failed to add documents:", docsErr);
      }

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
          (item) => item._id === id && item.type === "buy",
        );
        if (letter) {
          await previewBuyLetterPDF(letter);
        } else {
          alert("Buy letter data not found");
        }
        return;
      } else if (type === "sell") {
        const letter = bikeHistory.find(
          (item) => item._id === id && item.type === "sell",
        );
        if (letter) {
          await previewSellLetterPDF(letter);
        } else {
          alert("Sell letter data not found");
        }
        return;
      } else if (type === "service") {
        const endpoint = `https://ok-motor-51l3.vercel.app/api/service-bills/${id}/pdf`;
        const response = await axios.get(endpoint, {
          responseType: "blob",
        });
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setShowPdfModal(true);
      } else if (type === "advance") {
        const endpoint = `https://ok-motor-51l3.vercel.app/api/advance-bills/${id}/pdf`;
        const response = await axios.get(endpoint, {
          responseType: "blob",
        });
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setShowPdfModal(true);
        return;
      }
      // insurance and puc don't have PDFs; open their history pages instead
      else if (type === "insurance" || type === "insurance-renewed") {
        navigate(`/insurance/history?reg=${encodeURIComponent(searchTerm)}`);
        return;
      } else if (type === "puc" || type === "puc-renewed") {
        navigate(`/puc/history?reg=${encodeURIComponent(searchTerm)}`);
        return;
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
          (item) => item._id === id && item.type === "buy",
        );
        if (letter) {
          await downloadBuyLetterPDF(letter);
        } else {
          alert("Buy letter data not found");
        }
        return;
      } else if (type === "sell") {
        const letter = bikeHistory.find(
          (item) => item._id === id && item.type === "sell",
        );
        if (letter) {
          await downloadSellLetterPDF(letter);
        } else {
          alert("Sell letter data not found");
        }
        return;
      } else if (type === "service") {
        const endpoint = `https://ok-motor-51l3.vercel.app/api/service-bills/${id}/pdf`;
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
        const endpoint = `https://ok-motor-51l3.vercel.app/api/advance-bills/${id}/download`;
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
      } else if (type === "insurance" || type === "insurance-renewed") {
        navigate(`/insurance/history?reg=${encodeURIComponent(searchTerm)}`);
        return;
      } else if (type === "puc" || type === "puc-renewed") {
        navigate(`/puc/history?reg=${encodeURIComponent(searchTerm)}`);
        return;
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
        return <ArrowDownLeft size={16} color="#089532ff" />;
      case "sell":
        return <ArrowUpRight size={16} color="#ef4444" />;
      case "service":
        return <Wrench size={16} color="#10b981" />;
      case "advance":
        return <FileText size={16} color="#f59e0b" />;
      case "insurance":
        return <Shield size={16} color="#0ea5e9" />;
      case "insurance-renewed":
        return <Shield size={16} color="#06b6d4" />;
      case "puc":
        return <FileText size={16} color="#94a3b8" />;
      case "puc-renewed":
        return <FileText size={16} color="#8b5cf6" />;
      default:
        return <FileText size={16} />;
    }
  };

  const isEditedActionItem = (item) => {
    if (!item || (item.type !== "buy" && item.type !== "sell")) return false;

    // Check if there's a previousVersionId or changeHistory
    if (
      item.previousVersionId ||
      (Array.isArray(item.changeHistory) && item.changeHistory.length > 0)
    ) {
      return true;
    }

    // For buy/sell letters, check if saleDate differs from createdAt
    // If they differ significantly, it means the letter was edited
    if (item.saleDate && item.createdAt) {
      const saleTime = new Date(item.saleDate).getTime();
      const createdTime = new Date(item.createdAt).getTime();
      if (!Number.isNaN(saleTime) && !Number.isNaN(createdTime)) {
        // If saleDate is different from createdAt, it was edited
        return Math.abs(saleTime - createdTime) > 1000;
      }
    }

    // Original check for editedAt vs createdAt
    if (item.editedAt && item.createdAt) {
      const editedTime = new Date(item.editedAt).getTime();
      const createdTime = new Date(item.createdAt).getTime();
      if (!Number.isNaN(editedTime) && !Number.isNaN(createdTime)) {
        return editedTime > createdTime + 1000;
      }
    }

    return false;
  };

  const getActionLabel = (type, item = null) => {
    const isEdited = isEditedActionItem(item);

    switch (type) {
      case "buy":
        return isEdited ? "Edited Buy Letter" : "Created Buy Letter";
      case "sell":
        return isEdited ? "Edited Sell Letter" : "Created Sell Letter";
      case "service":
        return "Serviced";
      case "advance":
        return "Advance Payment";
      case "insurance":
        return "Insurance";
      case "insurance-renewed":
        return "Insurance Renewed";
      case "puc":
        return "PUC";
      case "puc-renewed":
        return "PUC Renewed";
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
    // insurance / puc do not have an amount to display in history
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
      case "insurance":
        return `Insurance_${registrationNumber}_${date}.pdf`;
      case "insurance-renewed":
        return `Insurance_Renewed_${registrationNumber}_${date}.pdf`;
      case "puc":
        return `PUC_${registrationNumber}_${date}.pdf`;
      case "puc-renewed":
        return `PUC_Renewed_${registrationNumber}_${date}.pdf`;
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
    if (item.type === "insurance") {
      const policy =
        item.insurancePolicyNumber ||
        item.insurancePolicyNo ||
        item.insurancePolicyNo ||
        "-";
      const comp = item.insuranceCompany || "-";
      const exp = item.insuranceExpiryDate || item.insuranceExpiry || null;
      return `Policy: ${policy} • ${comp}${exp ? ` • Exp: ${new Date(exp).toLocaleDateString("en-IN")}` : ""}`;
    }
    if (item.type === "puc") {
      const pucNo = item.pucNumber || item.pucNo || "-";
      const exp = item.pucExpiryDate || item.pucExpiry || null;
      return `PUC: ${pucNo}${exp ? ` • Exp: ${new Date(exp).toLocaleDateString("en-IN")}` : ""}`;
    }
    if (item.type === "insurance-renewed") {
      const comp = item.insuranceCompany || "-";
      const exp = item.insuranceExpiryDate || item.insuranceExpiry || null;
      return `Renewed with ${comp}${exp ? ` • Exp: ${new Date(exp).toLocaleDateString("en-IN")}` : ""}`;
    }
    if (item.type === "puc-renewed") {
      const pucNo = item.pucNumber || item.pucNo || "-";
      const exp = item.pucExpiryDate || item.pucExpiry || null;
      return `Renewed • PUC: ${pucNo}${exp ? ` • Exp: ${new Date(exp).toLocaleDateString("en-IN")}` : ""}`;
    }
    return "";
  };

  const toggleExpandedItem = (itemKey) => {
    const newExpanded = new Set(expandedItems);

    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      vehicleMake: "Vehicle Make",
      vehicleName: "Vehicle Name",
      vehicleModel: "Vehicle Model",
      vehicleColor: "Vehicle Color",
      registrationNumber: "Registration Number",
      chassisNumber: "Chassis Number",
      engineNumber: "Engine Number",
      vehiclekm: "Vehicle KM",
      vehicleCondition: "Vehicle Condition",
      buyerName: "Buyer Name",
      buyerFatherName: "Buyer Father Name",
      buyerCurrentAddress: "Buyer Address",
      buyerPhone: "Buyer Phone",
      buyerAadhar: "Buyer Aadhar",
      sellerName: "Seller Name",
      sellerFatherName: "Seller Father Name",
      sellerCurrentAddress: "Seller Address",
      sellerAddress: "Seller Address",
      sellerPhone: "Seller Phone",
      selleraadhar: "Seller Aadhar",
      sellerpan: "Seller PAN",
      selleraadharphone: "Seller Phone",
      selleraadharphone2: "Seller Phone 2",
      saleAmount: "Sale Amount",
      saleDate: "Sale Date",
      saleTime: "Sale Time",
      serviceType: "Service Type",
      kmReading: "KM Reading",
      grandTotal: "Total Amount",
      serviceItems: "Service Items",
      advancePaid: "Advance Amount",
      insuranceCompany: "Insurance Company",
      insurancePolicyNumber: "Policy Number",
      insuranceExpiryDate: "Insurance Expiry",
      pucNumber: "PUC Number",
      pucExpiryDate: "PUC Expiry",
      note: "Notes",
      status: "Status",
      customerName: "Customer Name",
      paymentMethod: "Payment Method",
    };
    return labels[fieldName] || fieldName;
  };

  const getEditedFields = (item) => {
    const fieldsToCompare = [
      "vehicleName",
      "vehicleModel",
      "vehicleColor",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "vehiclekm",
      "vehicleCondition",
      "buyerName",
      "buyerFatherName",
      "buyerCurrentAddress",
      "buyerPhone",
      "buyerAadhar",
      "sellerName",
      "sellerFatherName",
      "sellerCurrentAddress",
      "sellerAddress",
      "sellerPhone",
      "selleraadhar",
      "sellerpan",
      "selleraadharphone",
      "selleraadharphone2",
      "saleAmount",
      "saleDate",
      "saleTime",
      "serviceType",
      "kmReading",
      "grandTotal",
      "advancePaid",
      "insuranceCompany",
      "insurancePolicyNumber",
      "insuranceExpiryDate",
      "insuranceStatus",
      "pucNumber",
      "pucExpiryDate",
      "pucIssueDate",
      "pucStatus",
      "note",
      "status",
      "customerName",
      "paymentMethod",
    ];

    const editedFields = [];

    // Normalize function to properly compare values
    const normalize = (val) => {
      if (val === null || val === undefined) return "";
      return String(val).trim();
    };

    const normalizeDate = (val) => {
      if (!val) return "";
      try {
        let ds = val;
        if (typeof ds === "string" && ds.includes("T")) ds = ds.split("T")[0];
        const date = new Date(ds);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0];
      } catch (e) {
        return "";
      }
    };

    // Check if the item has changeHistory field
    if (
      item.changeHistory &&
      Array.isArray(item.changeHistory) &&
      item.changeHistory.length > 0
    ) {
      item.changeHistory.forEach((change) => {
        if (
          change.field &&
          change.oldValue !== undefined &&
          change.newValue !== undefined
        ) {
          editedFields.push({
            field: getFieldLabel(change.field),
            oldValue: String(change.oldValue || ""),
            newValue: String(change.newValue || ""),
          });
        }
      });
    } else if (item.previousVersion) {
      // If we have a previous version object, compare fields
      fieldsToCompare.forEach((field) => {
        const oldValue = item.previousVersion[field];
        const newValue = item[field];

        // For date fields, use date normalization
        if (
          [
            "saleDate",
            "pucIssueDate",
            "pucExpiryDate",
            "insuranceExpiryDate",
          ].includes(field)
        ) {
          if (normalizeDate(oldValue) !== normalizeDate(newValue)) {
            editedFields.push({
              field: getFieldLabel(field),
              oldValue: formatDate(oldValue) || "(empty)",
              newValue: formatDate(newValue) || "(empty)",
            });
          }
        } else {
          // For regular fields, use text normalization
          if (normalize(oldValue) !== normalize(newValue)) {
            editedFields.push({
              field: getFieldLabel(field),
              oldValue: normalize(oldValue) || "(empty)",
              newValue: normalize(newValue) || "(empty)",
            });
          }
        }
      });
    } else if (item.editedAt && item.createdAt) {
      // Fallback: Just show that it was edited
      const createdDate = new Date(item.createdAt);
      const editedDate = new Date(item.editedAt);

      if (editedDate.getTime() !== createdDate.getTime()) {
        editedFields.push({
          field: "Record Modified",
          oldValue: new Date(createdDate).toLocaleString("en-IN"),
          newValue: new Date(editedDate).toLocaleString("en-IN"),
        });
      }
    }

    return editedFields;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
      <AppSidebar user={user} onLogout={handleLogout} />

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
            <>
              {!isMobile && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Date & Time</th>
                        <th style={styles.tableHeader}>Action</th>
                        <th style={styles.tableHeader}>KM Reading</th>
                        <th style={styles.tableHeader}>Amount</th>
                        <th style={styles.tableHeader}>Details</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bikeHistory.map((item) => {
                        const itemKey = `${item.type}-${item._id}`;
                        return (
                          <React.Fragment key={itemKey}>
                            <tr style={styles.tableRow}>
                              <td style={styles.tableCell}>
                                {item.type === "buy" || item.type === "sell" ? (
                                  <div>
                                    <div>
                                      Created:{" "}
                                      {item.createdAt
                                        ? new Date(
                                            item.createdAt,
                                          ).toLocaleString("en-IN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : item.saleDate
                                          ? new Date(
                                              item.saleDate,
                                            ).toLocaleString("en-IN")
                                          : new Date(item.date).toLocaleString(
                                              "en-IN",
                                            )}
                                    </div>
                                    {item.editedAt && (
                                      <div
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.9em",
                                        }}
                                      >
                                        Edited:{" "}
                                        {new Date(item.editedAt).toLocaleString(
                                          "en-IN",
                                          {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          },
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  new Date(item.date).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                )}
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
                                  {getActionLabel(item.type, item)}
                                </div>
                              </td>
                              <td style={styles.tableCell}>
                                {item.type === "buy" && (
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: "#0f766e",
                                    }}
                                  >
                                    {item.vehiclekm
                                      ? formatKm(item.vehiclekm)
                                      : "—"}
                                  </span>
                                )}
                                {item.type === "sell" && (
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: "#b45309",
                                    }}
                                  >
                                    {item.vehiclekm
                                      ? formatKm(item.vehiclekm)
                                      : "—"}
                                  </span>
                                )}
                                {item.type === "service" && (
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: "#1d4ed8",
                                    }}
                                  >
                                    {item.kmReading
                                      ? formatKm(item.kmReading)
                                      : "—"}
                                  </span>
                                )}
                                {item.type !== "buy" &&
                                  item.type !== "sell" &&
                                  item.type !== "service" && (
                                    <span style={{ color: "#94a3b8" }}>—</span>
                                  )}
                              </td>
                              <td style={styles.tableCell}>
                                {getAmount(item)}
                              </td>
                              <td style={styles.tableCell}>
                                {getDetails(item)}
                              </td>
                              <td style={styles.tableCell}>
                                <div style={styles.actionButtons}>
                                  {/* Hide View button for PUC and Insurance (they show history, not PDF) */}
                                  {!(
                                    item.type === "insurance" ||
                                    item.type === "insurance-renewed" ||
                                    item.type === "puc" ||
                                    item.type === "puc-renewed"
                                  ) && (
                                    <button
                                      onClick={() =>
                                        fetchPdf(item._id, item.type)
                                      }
                                      style={styles.viewButton}
                                      title="View PDF"
                                    >
                                      <Eye size={14} />
                                      View
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      downloadPdf(
                                        item._id,
                                        item.type,
                                        getFileName(item),
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
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {isMobile && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {bikeHistory.map((item) => {
                    const baseDate =
                      item.createdAt || item.saleDate || item.date;
                    const dateLabel = baseDate
                      ? new Date(baseDate).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <div
                        key={`${item.type}-${item._id}`}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {/* Card Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "10px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                color: "#1e293b",
                              }}
                            >
                              {(searchTerm || "").toUpperCase() || "Vehicle"}
                            </div>
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              {dateLabel}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "rgba(8,131,149,0.06)",
                              color: "#071952",
                              borderRadius: "999px",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {getActionIcon(item.type)}
                            <span>{getActionLabel(item.type, item)}</span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            >
                              KM
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#1e293b",
                                fontWeight: 600,
                              }}
                            >
                              {item.type === "service"
                                ? item.kmReading
                                  ? formatKm(item.kmReading)
                                  : "—"
                                : item.vehiclekm
                                  ? formatKm(item.vehiclekm)
                                  : "—"}
                            </span>
                          </div>

                          {!!getAmount(item) && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#64748b",
                                  fontWeight: 500,
                                }}
                              >
                                Amount
                              </span>
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#071952",
                                  fontWeight: 700,
                                }}
                              >
                                {getAmount(item)}
                              </span>
                            </div>
                          )}

                          {!!getDetails(item) && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#64748b",
                                  fontWeight: 500,
                                }}
                              >
                                Details
                              </span>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#1e293b",
                                  fontWeight: 500,
                                  textAlign: "right",
                                  maxWidth: "65%",
                                }}
                              >
                                {getDetails(item)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: "10px",
                          }}
                        >
                          {/* Hide View button for PUC and Insurance */}
                          {!(
                            item.type === "insurance" ||
                            item.type === "insurance-renewed" ||
                            item.type === "puc" ||
                            item.type === "puc-renewed"
                          ) && (
                            <button
                              onClick={() => fetchPdf(item._id, item.type)}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                padding: "8px",
                                backgroundColor: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                color: "#1e293b",
                                fontWeight: 500,
                              }}
                            >
                              <Eye size={14} /> View
                            </button>
                          )}
                          {/* Only show Renew button for renewed entries */}
                          {(item.type === "puc-renewed" ||
                            item.type === "insurance-renewed") && (
                            <button
                              onClick={() => {
                                if (item.type === "puc-renewed") {
                                  navigate("/puc-form", {
                                    state: { pucData: item },
                                  });
                                } else if (item.type === "insurance-renewed") {
                                  navigate("/insurance-form", {
                                    state: { insuranceData: item },
                                  });
                                }
                              }}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                padding: "8px",
                                backgroundColor: "#10b981",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                color: "#ffffff",
                                fontWeight: 500,
                              }}
                            >
                              <ArrowUpRight size={14} /> Renew
                            </button>
                          )}
                          <button
                            onClick={() =>
                              downloadPdf(
                                item._id,
                                item.type,
                                getFileName(item),
                              )
                            }
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "8px",
                              backgroundColor: "#071952",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#ffffff",
                              fontWeight: 500,
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        </div>

                        {/* Edit History Section for Mobile */}
                        {item.editedAt && getEditedFields(item).length > 0 && (
                          <div
                            style={{
                              marginTop: "12px",
                              borderTop: "1px solid #e2e8f0",
                              paddingTop: "12px",
                            }}
                          >
                            <button
                              onClick={() =>
                                toggleExpandedItem(`${item.type}-${item._id}`)
                              }
                              style={{
                                width: "100%",
                                padding: "10px",
                                backgroundColor: "#fff8e1",
                                border: "1px solid #ffe0b2",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#ff9800",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderLeft: "4px solid #ff9800",
                              }}
                            >
                              <span>
                                🔄{" "}
                                {expandedItems.has(`${item.type}-${item._id}`)
                                  ? "Hide"
                                  : "Show"}{" "}
                                Changes ({getEditedFields(item).length})
                              </span>
                            </button>

                            {expandedItems.has(`${item.type}-${item._id}`) && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "10px",
                                }}
                              >
                                {getEditedFields(item).map((change, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      backgroundColor: "#fffbf0",
                                      padding: "12px",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      borderLeft: "4px solid #ff9800",
                                      border: "1px solid #ffe0b2",
                                      borderLeftWidth: "4px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "#424242",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      {change.field}:
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "3px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#e53935",
                                          textDecoration: "line-through",
                                        }}
                                      >
                                        {change.oldValue}
                                      </div>
                                      <div
                                        style={{
                                          color: "#43a047",
                                          fontWeight: 500,
                                        }}
                                      >
                                        → {change.newValue}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showPdfModal && pdfUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => {
            setShowPdfModal(false);
            setPdfUrl("");
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              maxWidth: isMobile ? "95vw" : "1400px",
              width: "100%",
              height: isMobile ? "85vh" : "90vh",
              maxHeight: isMobile ? "85vh" : "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={24} color="#088395" />
                Document Preview
              </h2>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfUrl("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
                backgroundColor: "#525659",
              }}
            >
              {isMobile ? (
                <PdfPreview pdfUrl={pdfUrl} />
              ) : (
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                  aria-label="Bike History PDF Preview"
                >
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="Bike History PDF Preview"
                  />
                </object>
              )}
            </div>

            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                backgroundColor: "#f8fafc",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfUrl("");
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
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
    backgroundColor: "#EBF4F6",
    fontFamily: "'Inter', sans-serif",
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#071952",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    zIndex: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 1rem",
  },
  topBarLogo: {
    width: "250px",
    height: "auto",
    margin: "-40px",
    padding: 0,
    display: "block",
  },
  hamburgerMenu: {
    cursor: "pointer",
    padding: "8px",
    position: "absolute",
    left: "1rem",
    color: "#ffffff",
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
    backgroundColor: "#071952",
    color: "#f8fafc",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
    transition: "transform 0.3s ease",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
    flex: "1 1 auto",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
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
    backgroundColor: "rgba(8, 131, 149, 0.2)",
    borderRight: "3px solid #088395",
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
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
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
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(8, 131, 149, 0.1)",
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
    backgroundColor: "#EBF4F6",
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
    backgroundColor: "#088395",
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
    backgroundColor: "#37B7C3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2DA2AD",
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
