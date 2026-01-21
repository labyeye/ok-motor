import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import networkService from "./networkService";
import axios from "axios";
import fileSaveService from "./fileSaveService";
import logo from "../images/okmotor.png";
import logoBack from "../images/okmotor.png";
class PDFService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  }

  async _embedImageByUrl(pdfDoc, url) {
    if (!url) return null;
    try {
      let resp = null;
      try {
        resp = await fetch(url);
      } catch (e) {
        resp = null;
      }

      if (!resp || !resp.ok) {
        try {
          const originPrefixed =
            (typeof window !== "undefined" &&
            window.location &&
            window.location.origin
              ? window.location.origin
              : "") + url;
          resp = await fetch(originPrefixed);
        } catch (e) {
          resp = null;
        }
      }

      if (!resp || !resp.ok) {
        try {
          const pub = process.env.PUBLIC_URL || "";
          const pubUrl = pub + url;
          resp = await fetch(pubUrl);
        } catch (e) {
          resp = null;
        }
      }

      if (!resp || !resp.ok) throw new Error(`Failed to fetch image at ${url}`);
      const bytes = await resp.arrayBuffer();
      const lower = url.split("?")[0].toLowerCase();
      if (lower.endsWith(".png")) {
        return await pdfDoc.embedPng(bytes);
      }
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        return await pdfDoc.embedJpg(bytes);
      }

      try {
        return await pdfDoc.embedPng(bytes);
      } catch (e) {
        return await pdfDoc.embedJpg(bytes);
      }
    } catch (err) {
      console.warn(
        "_embedImageByUrl fetch failed for",
        url,
        err?.message || err,
      );

      try {
        if (
          typeof window !== "undefined" &&
          window.electronAPI &&
          window.electronAPI.isElectron &&
          typeof window.electronAPI.readAsset === "function"
        ) {
          const res = await window.electronAPI.readAsset(url);
          if (
            res &&
            res.success &&
            Array.isArray(res.data) &&
            res.data.length > 0
          ) {
            const arr = Uint8Array.from(res.data);
            const lower2 = (url || "").split("?")[0].toLowerCase();
            try {
              if (lower2.endsWith(".png")) return await pdfDoc.embedPng(arr);
              if (lower2.endsWith(".jpg") || lower2.endsWith(".jpeg"))
                return await pdfDoc.embedJpg(arr);

              try {
                return await pdfDoc.embedPng(arr);
              } catch (e2) {
                return await pdfDoc.embedJpg(arr);
              }
            } catch (embedErr) {
              console.warn(
                "_embedImageByUrl electron-embed failed for",
                url,
                embedErr?.message || embedErr,
              );
              return null;
            }
          }
        }
      } catch (ipcErr) {
        console.warn(
          "_embedImageByUrl readAsset IPC failed for",
          url,
          ipcErr?.message || ipcErr,
        );
      }

      return null;
    }
  }

  formatIndianAmountInWords(amount) {
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

    return `(${convert(num)} Only)`;
  }

  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async generateBuyLetterPDF(letterData) {
    if (networkService.getStatus()) {
      try {
        return await this.generateBuyLetterPDFOnline(letterData);
      } catch (error) {
        console.log("Online PDF generation failed, using offline:", error);
      }
    }

    return await this.generateBuyLetterPDFOffline(letterData);
  }

  async generateBuyLetterPDFOnline(letterData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/buy-letters/generate-pdf`,
        letterData,
        {
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const buffer = response.data;
      const blob = new Blob([buffer], { type: "application/pdf" });

      let saveRes = null;
      try {
        const filename = `buy-letter-${
          letterData.registrationNumber || letterData.registration || Date.now()
        }.pdf`;
        saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          buffer,
          "buy",
        );
      } catch (saveErr) {
        console.warn(
          "Silent save failed for buy letter:",
          saveErr?.message || saveErr,
        );
      }

      return {
        success: true,
        blob,
        buffer,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      throw error;
    }
  }

  async generateBuyLetterPDFOffline(data) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      let yPosition = height - 50;

      const drawText = (text, x, y, options = {}) => {
        page.drawText(text, {
          x,
          y,
          size: options.size || 10,
          font: options.bold ? boldFont : font,
          color: rgb(0, 0, 0),
          ...options,
        });
      };

      drawText("VEHICLE PURCHASE AGREEMENT", width / 2 - 100, yPosition, {
        bold: true,
        size: 14,
      });
      yPosition -= 30;

      drawText("SELLER INFORMATION", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Name: ${data.sellerName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Father's Name: ${data.sellerFatherName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Address: ${data.sellerCurrentAddress}`, 50, yPosition);
      yPosition -= 15;
      if (data.selleraadhar) {
        drawText(`Aadhar: ${data.selleraadhar}`, 50, yPosition);
        yPosition -= 15;
      }
      if (data.sellerpan) {
        drawText(`PAN: ${data.sellerpan}`, 50, yPosition);
        yPosition -= 15;
      }

      yPosition -= 10;

      // Vehicle Information
      drawText("VEHICLE INFORMATION", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(
        `Vehicle: ${data.vehicleName} ${data.vehicleModel}`,
        50,
        yPosition,
      );
      yPosition -= 15;
      drawText(`Color: ${data.vehicleColor}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Registration: ${data.registrationNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Chassis No: ${data.chassisNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Engine No: ${data.engineNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Condition: ${data.vehicleCondition}`, 50, yPosition);
      yPosition -= 15;
      if (data.vehiclekm) {
        drawText(`Kilometers: ${data.vehiclekm}`, 50, yPosition);
        yPosition -= 15;
      }

      yPosition -= 10;

      // Buyer Information
      drawText("BUYER INFORMATION", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Name: ${data.buyerName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Father's Name: ${data.buyerFatherName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Address: ${data.buyerCurrentAddress}`, 50, yPosition);
      yPosition -= 15;

      yPosition -= 10;

      drawText("SALE DETAILS", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Sale Date: ${this.formatDate(data.saleDate)}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Sale Amount: ₹${data.saleAmount}`, 50, yPosition);
      yPosition -= 15;
      drawText(
        `Amount in Words: ${this.formatIndianAmountInWords(data.saleAmount)}`,
        50,
        yPosition,
      );
      yPosition -= 15;
      drawText(`Payment Method: ${data.paymentMethod}`, 50, yPosition);
      yPosition -= 30;

      drawText("_________________", 50, yPosition);
      drawText("_________________", width - 150, yPosition);
      yPosition -= 15;
      drawText("Seller Signature", 50, yPosition, { size: 9 });
      drawText("Buyer Signature", width - 150, yPosition, { size: 9 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const filename = `buy-letter-${
        data.registrationNumber
      }-${Date.now()}.pdf`;
      const saveRes = await fileSaveService.savePdfToDefaultDir(
        filename,
        pdfBytes,
        "buy",
      );

      return {
        success: true,
        blob,
        buffer: pdfBytes,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      console.error("Error generating PDF offline:", error);
      return { success: false, error: error.message };
    }
  }

  async generateSellLetterPDF(letterData) {
    if (networkService.getStatus()) {
      try {
        return await this.generateSellLetterPDFOnline(letterData);
      } catch (error) {
        console.log("Online PDF generation failed, using offline:", error);
      }
    }

    return await this.generateSellLetterPDFOffline(letterData);
  }

  async generateSellLetterPDFOnline(letterData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/sell-letters/generate-pdf`,
        letterData,
        {
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const buffer = response.data;
      const blob = new Blob([buffer], { type: "application/pdf" });

      let saveRes = null;
      try {
        const filename = `sell-letter-${
          letterData.registrationNumber || letterData.registration || Date.now()
        }.pdf`;
        saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          buffer,
          "sell",
        );
      } catch (saveErr) {
        console.warn(
          "Silent save failed for sell letter:",
          saveErr?.message || saveErr,
        );
      }

      return {
        success: true,
        blob,
        buffer,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      throw error;
    }
  }

  async generateSellLetterPDFOffline(data) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      let yPosition = height - 50;

      const drawText = (text, x, y, options = {}) => {
        page.drawText(text, {
          x,
          y,
          size: options.size || 10,
          font: options.bold ? boldFont : font,
          color: rgb(0, 0, 0),
          ...options,
        });
      };

      drawText("VEHICLE SALE AGREEMENT", width / 2 - 100, yPosition, {
        bold: true,
        size: 14,
      });
      yPosition -= 30;

      drawText("VEHICLE DETAILS", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(
        `Vehicle: ${data.vehicleName} ${data.vehicleModel}`,
        50,
        yPosition,
      );
      yPosition -= 15;
      drawText(`Registration: ${data.registrationNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Chassis No: ${data.chassisNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Engine No: ${data.engineNumber}`, 50, yPosition);
      yPosition -= 20;

      drawText("BUYER DETAILS", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Name: ${data.buyerName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Address: ${data.buyerAddress}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Phone: ${data.buyerPhone}`, 50, yPosition);
      yPosition -= 20;

      drawText("SALE INFORMATION", 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Sale Amount: ₹${data.saleAmount}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Date: ${this.formatDate(data.saleDate)}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Payment Method: ${data.paymentMethod}`, 50, yPosition);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const filename = `sell-letter-${
        data.registrationNumber
      }-${Date.now()}.pdf`;
      const saveRes = await fileSaveService.savePdfToDefaultDir(
        filename,
        pdfBytes,
        "sell",
      );

      return {
        success: true,
        blob,
        buffer: pdfBytes,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      console.error("Error generating sell letter PDF offline:", error);
      return { success: false, error: error.message };
    }
  }

  async generateServiceBillPDF(billData) {
    if (networkService.getStatus()) {
      try {
        return await this.generateServiceBillPDFOnline(billData);
      } catch (error) {
        console.log("Online PDF generation failed, using offline:", error);
      }
    }

    return await this.generateServiceBillPDFOffline(billData);
  }

  async generateServiceBillPDFOnline(billData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/service-bills/generate-pdf`,
        billData,
        {
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const buffer = response.data;
      const blob = new Blob([buffer], { type: "application/pdf" });

      let saveRes = null;
      try {
        const filename = `service-bill-${
          billData._id || billData.registrationNumber || Date.now()
        }.pdf`;
        saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          buffer,
          "service",
        );
      } catch (saveErr) {
        console.warn(
          "Silent save failed for service bill:",
          saveErr?.message || saveErr,
        );
      }

      return {
        success: true,
        blob,
        buffer,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      throw error;
    }
  }

  async generateServiceBillPDFOffline(serviceBill) {
    try {
      if (!serviceBill || typeof serviceBill !== "object") {
        throw new Error("Invalid serviceBill parameter: must be an object");
      }
      if (
        !serviceBill.serviceItems ||
        !Array.isArray(serviceBill.serviceItems)
      ) {
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
          return { ...item, quantity, rate, amount };
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

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let logoImage = null;
      try {
        if (logo) {
          logoImage = await this._embedImageByUrl(pdfDoc, logo);
        }
      } catch (logoError) {
        console.warn(
          "Logo not found, continuing without logo:",
          logoError?.message || logoError,
        );
      }
      console.debug(
        "PDFService: service logo url=",
        logo,
        "embedded=",
        !!logoImage,
      );

      const addWatermark = (page) => {
        if (logoImage) {
          page.drawImage(logoImage, {
            x: 280,
            y: 200,
            width: 450,
            height: 400,
            opacity: 0.4,
            rotate: degrees(45),
          });
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
        currentPage.drawImage(logoImage, {
          x: 50,
          y: 740,
          width: 170,
          height: 140,
        });
      }

      currentPage.drawText("UDAYAM-BR-26-0028550", {
        x: 400,
        y: 800,
        size: 14,
        color: rgb(0.8, 0.8, 0.8),
        font: fontBold,
      });

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
        `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;

      currentPage.drawText(`Invoice Number: ${invoiceNumber}`, {
        x: 50,
        y: 720,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });

      const currentDate =
        serviceBill.date || serviceBill.createdAt
          ? new Date(serviceBill.date || serviceBill.createdAt)
          : new Date();

      const formatTime12Hour = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0",
        )} ${ampm}`;
      };

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

      currentPage.drawLine({
        start: { x: 50, y: 710 },
        end: { x: 545, y: 710 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

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

        customerY = 600;
      } else {
        customerY = 690;
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
          value: serviceBill.vehicleType
            ? serviceBill.vehicleType.toUpperCase()
            : "N/A",
        },
        { label: "Brand:", value: serviceBill.vehicleBrand || "N/A" },
        { label: "Model:", value: serviceBill.vehicleModel || "N/A" },
        { label: "Reg No:", value: serviceBill.registrationNumber || "N/A" },
        {
          label: "KM:",
          value:
            serviceBill.kmReading !== undefined &&
            serviceBill.kmReading !== null
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
          value: serviceBill.serviceType
            ? serviceBill.serviceType.toUpperCase()
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

      serviceBill.serviceItems.forEach((item, index) => {
        if (!item || typeof item !== "object") return;

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

        const description = item.description || "";
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
      currentPage.drawText(serviceBill.totalAmount.toFixed(2), {
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
        currentPage.drawText(serviceBill.taxAmount.toFixed(2), {
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
          ((serviceBill.discountPercentage || 0) / 100) *
          serviceBill.totalAmount;
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
      currentPage.drawText(serviceBill.advancePaid.toFixed(2), {
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
      currentPage.drawText(serviceBill.balanceDue.toFixed(2), {
        x: 450,
        y: sectionY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
      sectionY -= 20;

      currentPage.drawText("GRAND TOTAL:", {
        x: 350,
        y: sectionY,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });
      currentPage.drawText(serviceBill.grandTotal.toFixed(2), {
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
      currentPage.drawText(
        (serviceBill.paymentMethod || "CASH").toUpperCase(),
        {
          x: 150,
          y: sectionY,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        },
      );
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

      const wrapTextByWidth = (text, maxWidth, font, size) => {
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
            if (currentLine) lines.push(currentLine);
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
      };

      const labelX = 50;
      const contentX = 150;
      const rightMargin = 545;
      const contentWidth = rightMargin - contentX;
      const fontSize = 9;
      const titleSize = 10;
      const lineHeight = 12;

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
        (issuesLines.length > 0
          ? (issuesLines.length + 1) * lineHeight + 8
          : 0) +
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
      }

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
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const filename = `service-bill-${
        serviceBill._id || serviceBill.registrationNumber
      }-${Date.now()}.pdf`;
      const saveRes = await fileSaveService.savePdfToDefaultDir(
        filename,
        pdfBytes,
        "service",
      );

      return {
        success: true,
        blob,
        buffer: pdfBytes,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      console.error("Error generating service bill PDF offline:", error);
      return { success: false, error: error.message };
    }
  }

  async generateAdvanceBillPDF(billData) {
    if (networkService.getStatus()) {
      try {
        return await this.generateAdvanceBillPDFOnline(billData);
      } catch (error) {
        console.log("Online PDF generation failed, using offline:", error);
      }
    }
    return await this.generateAdvanceBillPDFOffline(billData);
  }

  async generateAdvanceBillPDFOnline(billData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/advance-bills/generate-pdf`,
        billData,
        {
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const buffer = response.data;
      const blob = new Blob([buffer], { type: "application/pdf" });

      let saveRes = null;
      try {
        const filename = `advance-bill-${
          billData._id || billData.registrationNumber || Date.now()
        }.pdf`;
        saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          buffer,
          "advance",
        );
      } catch (saveErr) {
        console.warn(
          "Silent save failed for advance bill:",
          saveErr?.message || saveErr,
        );
      }

      return {
        success: true,
        blob,
        buffer,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      throw error;
    }
  }

  async generateAdvanceBillPDFOffline(advanceBill) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const formatKm = (val) => {
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

      const formatRupeeWithSymbol = (val) => `Rs.${formatRupee(val)}`;

      const formatTime12Hour = (date) => {
        if (!date) return "";
        const d = date instanceof Date ? date : new Date(date);
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0",
        )} ${ampm}`;
      };

      let logoImage = null;
      try {
        if (logoBack) {
          logoImage = await this._embedImageByUrl(pdfDoc, logoBack);
        }
      } catch (logoError) {
        console.warn("Logo not found:", logoError?.message || logoError);
      }
      console.debug(
        "PDFService: advance logo url=",
        logoBack,
        "embedded=",
        !!logoImage,
      );

      const pageWidth = 595;

      page.drawRectangle({
        x: 0,
        y: 780,
        width: pageWidth,
        height: 80,
        color: rgb(0.047, 0.098, 0.196),
      });

      if (logoImage) {
        page.drawImage(logoImage, {
          x: 50,
          y: 744,
          width: 160,
          height: 130,
        });

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
      const istDate = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000);

      page.drawText(
        `Date: ${istDate.toLocaleDateString("en-IN")} Time: ${formatTime12Hour(
          istDate,
        )}`,
        {
          x: 400,
          y: 720,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        },
      );

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
        opacity: 0.6,
      });

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
        opacity: 0.6,
      });

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
        opacity: 0.6,
      });

      const serviceY = vehicleY - 140;
      page.drawText("ADVANCE PAYMENT DATES", {
        x: 50,
        y: serviceY,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      page.drawText("Advance Payment Date:", {
        x: 60,
        y: serviceY - 25,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(
        new Date(advanceBill.serviceDate || Date.now()).toLocaleDateString(
          "en-IN",
        ),
        {
          x: 180,
          y: serviceY - 25,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        },
      );

      page.drawText("Delivery Date:", {
        x: 350,
        y: serviceY - 25,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: fontBold,
      });

      page.drawText(
        new Date(
          advanceBill.deliveryDate || Date.now() + 86400000,
        ).toLocaleDateString("en-IN"),
        {
          x: 420,
          y: serviceY - 25,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        },
      );

      page.drawRectangle({
        x: 0,
        y: 415,
        width: 595,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.6,
      });

      const paymentY = serviceY - 50;
      page.drawText("PAYMENT INFORMATION", {
        x: 50,
        y: paymentY,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: fontBold,
      });

      const totalAmount = parseFloat(advanceBill.totalAmount) || 0;
      const advancePaid = parseFloat(advanceBill.advancePaid) || 0;
      const grandTotal =
        advanceBill.grandTotal !== undefined && advanceBill.grandTotal !== null
          ? parseFloat(advanceBill.grandTotal) || totalAmount
          : totalAmount;
      const balanceDue =
        advanceBill.balanceDue !== undefined && advanceBill.balanceDue !== null
          ? parseFloat(advanceBill.balanceDue) || grandTotal - advancePaid
          : grandTotal - advancePaid;

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
        opacity: 0.6,
      });

      let termsY = 250;

      if (advanceBill.note && advanceBill.note.trim()) {
        const noteY = 290;
        page.drawText("NOTE", {
          x: 50,
          y: noteY,
          size: 12,
          color: rgb(0.047, 0.098, 0.196),
          font: fontBold,
        });

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

        termsY = noteY - 20 - noteLines.length * 12 - 20;

        page.drawRectangle({
          x: 0,
          y: termsY - 5,
          width: 595,
          height: 20,
          color: rgb(0.9, 0.9, 0.9),
          opacity: 0.6,
        });

        page.drawText("TERMS AND CONDITIONS", {
          x: 50,
          y: termsY,
          size: 15,
          color: rgb(0.047, 0.098, 0.196),
          font: fontBold,
        });
      } else {
        page.drawRectangle({
          x: 0,
          y: termsY + 20,
          width: 595,
          height: 20,
          color: rgb(0.9, 0.9, 0.9),
          opacity: 0.6,
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
        "8. Paper Work (Insaurance, Pollution etc.) will be charged separately.",
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
        },
      );

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const filename = `advance-bill-${
        advanceBill._id || advanceBill.registrationNumber
      }-${Date.now()}.pdf`;
      const saveRes = await fileSaveService.savePdfToDefaultDir(
        filename,
        pdfBytes,
        "advance",
      );

      return {
        success: true,
        blob,
        buffer: pdfBytes,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      console.error("Error generating advance bill PDF offline:", error);
      return { success: false, error: error.message };
    }
  }

  downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async generateLetterHeadPDF(letterData, previewOnly = false) {
    return await this.generateLetterHeadPDFOffline(letterData, previewOnly);
  }

  sanitizeTextForPDF(text) {
    if (!text) return "";

    return String(text)
      .replace(/₹/g, "Rs. ")
      .replace(/[^\x00-\xFF]/g, ""); // eslint-disable-line no-control-regex
  }

  async generateLetterHeadPDFOffline(letterData, previewOnly = false) {
    try {
      const pdfDoc = await PDFDocument.create();

      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      let logoImage = null;
      try {
        if (logo) {
          logoImage = await this._embedImageByUrl(pdfDoc, logo);
        }
      } catch (logoError) {
        console.warn("Logo not found:", logoError);
      }

      const headerFontSize = 14;
      const contentFontSize = 12;

      const createPage = (isFirstPage = false) => {
        const p = pdfDoc.addPage([595, 842]);

        if (logoImage) {
          p.drawImage(logoImage, {
            x: 280,
            y: 200,
            width: 450,
            height: 400,
            opacity: 0.1,
            rotate: degrees(45),
          });
        }

        if (isFirstPage) {
          p.drawRectangle({
            x: 0,
            y: 780,
            width: 595,
            height: 120,
            color: rgb(0.047, 0.098, 0.196),
          });

          if (logoImage) {
            p.drawImage(logoImage, {
              x: 50,
              y: 740,
              width: 170,
              height: 140,
            });
          }

          p.drawText("UDAYAM-BR-26-0028550", {
            x: 400,
            y: 800,
            size: 14,
            color: rgb(0.8, 0.8, 0.8),
            font: fontBold,
          });

          p.drawRectangle({
            x: 0,
            y: 750,
            width: 595,
            height: 30,
            color: rgb(0.9, 0.9, 0.9),
          });

          p.drawText("LETTER HEAD", {
            x: 240,
            y: 758,
            size: 18,
            color: rgb(0.047, 0.098, 0.196),
            font: fontBold,
          });
        }
        return p;
      };

      let currentPage = createPage(true);
      let yPosition = 700;

      const sanitizedData = {
        ...letterData,
        to: this.sanitizeTextForPDF(letterData.to),
        subject: this.sanitizeTextForPDF(letterData.subject),
        message: this.sanitizeTextForPDF(letterData.message),
        recipientName: this.sanitizeTextForPDF(letterData.recipientName),
      };

      const checkPageBreak = (neededSpace = 20) => {
        if (yPosition < 50 + neededSpace) {
          currentPage = createPage(false);
          yPosition = 750;
        }
      };

      checkPageBreak(20);
      currentPage.drawText(`Date: ${this.formatDate(sanitizedData.date)}`, {
        x: 450,
        y: yPosition,
        size: headerFontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 40;

      checkPageBreak(20);
      currentPage.drawText("To,", {
        x: 50,
        y: yPosition,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      const toLines = sanitizedData.to.split("\n");
      for (const line of toLines) {
        checkPageBreak(20);
        currentPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: headerFontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
      }

      yPosition -= 20;

      checkPageBreak(20);
      currentPage.drawText("Subject:", {
        x: 50,
        y: yPosition,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      currentPage.drawText(sanitizedData.subject, {
        x: 120,
        y: yPosition,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 40;

      const message = sanitizedData.message || "";
      const maxWidth = 500;

      const paragraphs = message.split("\n");

      for (const paragraph of paragraphs) {
        const words = paragraph.split(" ");
        let line = "";

        for (const word of words) {
          const testLine = line + word + " ";
          const textWidth = font.widthOfTextAtSize(testLine, contentFontSize);

          if (textWidth > maxWidth) {
            checkPageBreak(13);
            currentPage.drawText(line, {
              x: 50,
              y: yPosition,
              size: contentFontSize,
              font: font,
            });
            line = word + " ";
            yPosition -= 13;
          } else {
            line = testLine;
          }
        }

        checkPageBreak(13);
        currentPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: contentFontSize,
          font: font,
        });
        yPosition -= 20;
      }

      checkPageBreak(100);
      yPosition -= 30;

      // Signature section with lines
      currentPage.drawLine({
        start: { x: 70, y: yPosition },
        end: { x: 250, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      currentPage.drawLine({
        start: { x: 345, y: yPosition },
        end: { x: 525, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      currentPage.drawText("Recipient Signature", {
        x: 120,
        y: yPosition - 20,
        size: 11,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      currentPage.drawText("Authorized Signatory", {
        x: 385,
        y: yPosition - 20,
        size: 11,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pages = pdfDoc.getPages();

      pages.forEach((p, index) => {
        const pageNumber = index + 1;
        const footerY = 40;

        p.drawLine({
          start: { x: 20, y: footerY + 15 },
          end: { x: 575, y: footerY + 15 },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });

        p.drawText(
          "Address: Pillar num.53, Bailey Rd, Samanpura, Raja Bazar, Indrapuri, Patna, Bihar 800014",
          {
            x: 120,
            y: footerY,
            size: 9,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
          },
        );

        p.drawText("Phone: +91 72800 12222", {
          x: 250,
          y: footerY - 12,
          size: 9,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });

        // Add page number in bottom right corner
        p.drawText(`${pageNumber}`, {
          x: 560,
          y: footerY,
          size: 10,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      // Only save to file system if not preview mode
      let saveRes = null;
      if (!previewOnly) {
        const filename = `letter-head-${Date.now()}.pdf`;
        saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          pdfBytes,
          "letter",
        );
      }

      return {
        success: true,
        blob,
        buffer: pdfBytes,
        saved: !!(saveRes && saveRes.success),
        savedPath: saveRes?.path || null,
      };
    } catch (error) {
      console.error("Error generating Letter Head PDF:", error);
      return { success: false, error: error.message };
    }
  }
}

const pdfServiceInstance = new PDFService();
export default pdfServiceInstance;
