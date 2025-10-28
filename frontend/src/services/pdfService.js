// src/services/pdfService.js
/**
 * PDF Service - Offline-capable PDF generation
 * Works both online (server-side) and offline (client-side)
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import networkService from './networkService';
import axios from 'axios';

class PDFService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  /**
   * Format Indian amount in words
   */
  formatIndianAmountInWords(amount) {
    if (isNaN(amount)) return "(Zero Rupees)";

    const num = parseFloat(amount);
    if (num === 0) return "(Zero Rupees)";

    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", 
                   "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
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

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Generate Buy Letter PDF (offline-capable)
   */
  async generateBuyLetterPDF(letterData) {
    if (networkService.getStatus()) {
      try {
        // Try online generation first
        return await this.generateBuyLetterPDFOnline(letterData);
      } catch (error) {
        console.log('Online PDF generation failed, using offline:', error);
      }
    }

    // Offline generation
    return await this.generateBuyLetterPDFOffline(letterData);
  }

  /**
   * Generate Buy Letter PDF online (via API)
   */
  async generateBuyLetterPDFOnline(letterData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/buy-letters/generate-pdf`,
        letterData,
        {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      return { success: true, blob, buffer: response.data };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate Buy Letter PDF offline (client-side)
   */
  async generateBuyLetterPDFOffline(data) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      let yPosition = height - 50;

      // Helper function to draw text
      const drawText = (text, x, y, options = {}) => {
        page.drawText(text, {
          x,
          y,
          size: options.size || 10,
          font: options.bold ? boldFont : font,
          color: rgb(0, 0, 0),
          ...options
        });
      };

      // Title
      drawText('VEHICLE PURCHASE AGREEMENT', width / 2 - 100, yPosition, { bold: true, size: 14 });
      yPosition -= 30;

      // Seller Information
      drawText('SELLER INFORMATION', 50, yPosition, { bold: true, size: 12 });
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
      drawText('VEHICLE INFORMATION', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Vehicle: ${data.vehicleName} ${data.vehicleModel}`, 50, yPosition);
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
      drawText('BUYER INFORMATION', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Name: ${data.buyerName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Father's Name: ${data.buyerFatherName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Address: ${data.buyerCurrentAddress}`, 50, yPosition);
      yPosition -= 15;

      yPosition -= 10;

      // Sale Details
      drawText('SALE DETAILS', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Sale Date: ${this.formatDate(data.saleDate)}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Sale Amount: ₹${data.saleAmount}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Amount in Words: ${this.formatIndianAmountInWords(data.saleAmount)}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Payment Method: ${data.paymentMethod}`, 50, yPosition);
      yPosition -= 30;

      // Signatures
      drawText('_________________', 50, yPosition);
      drawText('_________________', width - 150, yPosition);
      yPosition -= 15;
      drawText('Seller Signature', 50, yPosition, { size: 9 });
      drawText('Buyer Signature', width - 150, yPosition, { size: 9 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Save to Electron if available
      if (window.electronAPI) {
        const filename = `buy-letter-${data.registrationNumber}-${Date.now()}.pdf`;
        await window.electronAPI.savePDF(filename, pdfBytes);
      }

      return { success: true, blob, buffer: pdfBytes };
    } catch (error) {
      console.error('Error generating PDF offline:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Sell Letter PDF
   */
  async generateSellLetterPDF(letterData) {
    if (networkService.getStatus()) {
      try {
        return await this.generateSellLetterPDFOnline(letterData);
      } catch (error) {
        console.log('Online PDF generation failed, using offline:', error);
      }
    }

    return await this.generateSellLetterPDFOffline(letterData);
  }

  /**
   * Generate Sell Letter PDF online
   */
  async generateSellLetterPDFOnline(letterData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/sell-letters/generate-pdf`,
        letterData,
        {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      return { success: true, blob, buffer: response.data };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate Sell Letter PDF offline
   */
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
          x, y,
          size: options.size || 10,
          font: options.bold ? boldFont : font,
          color: rgb(0, 0, 0),
          ...options
        });
      };

      // Title
      drawText('VEHICLE SALE AGREEMENT', width / 2 - 100, yPosition, { bold: true, size: 14 });
      yPosition -= 30;

      // Vehicle Information
      drawText('VEHICLE DETAILS', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Vehicle: ${data.vehicleName} ${data.vehicleModel}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Registration: ${data.registrationNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Chassis No: ${data.chassisNumber}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Engine No: ${data.engineNumber}`, 50, yPosition);
      yPosition -= 20;

      // Buyer Information
      drawText('BUYER DETAILS', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Name: ${data.buyerName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Address: ${data.buyerAddress}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Phone: ${data.buyerPhone}`, 50, yPosition);
      yPosition -= 20;

      // Sale Details
      drawText('SALE INFORMATION', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Sale Amount: ₹${data.saleAmount}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Date: ${this.formatDate(data.saleDate)}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Payment Method: ${data.paymentMethod}`, 50, yPosition);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      if (window.electronAPI) {
        const filename = `sell-letter-${data.registrationNumber}-${Date.now()}.pdf`;
        await window.electronAPI.savePDF(filename, pdfBytes);
      }

      return { success: true, blob, buffer: pdfBytes };
    } catch (error) {
      console.error('Error generating sell letter PDF offline:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Service Bill PDF
   */
  async generateServiceBillPDF(billData) {
    if (networkService.getStatus()) {
      try {
        return await this.generateServiceBillPDFOnline(billData);
      } catch (error) {
        console.log('Online PDF generation failed, using offline:', error);
      }
    }

    return await this.generateServiceBillPDFOffline(billData);
  }

  /**
   * Generate Service Bill PDF online
   */
  async generateServiceBillPDFOnline(billData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/service-bills/generate-pdf`,
        billData,
        {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      return { success: true, blob, buffer: response.data };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate Service Bill PDF offline
   */
  async generateServiceBillPDFOffline(data) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      let yPosition = height - 50;

      const drawText = (text, x, y, options = {}) => {
        page.drawText(text, {
          x, y,
          size: options.size || 10,
          font: options.bold ? boldFont : font,
          color: rgb(0, 0, 0),
          ...options
        });
      };

      // Title
      drawText('SERVICE BILL', width / 2 - 50, yPosition, { bold: true, size: 16 });
      yPosition -= 30;

      // Customer Information
      drawText('CUSTOMER INFORMATION', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Name: ${data.customerName}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Phone: ${data.customerPhone}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Address: ${data.customerAddress}`, 50, yPosition);
      yPosition -= 20;

      // Vehicle Information
      drawText('VEHICLE INFORMATION', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;
      drawText(`Type: ${data.vehicleType}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Brand: ${data.vehicleBrand} ${data.vehicleModel}`, 50, yPosition);
      yPosition -= 15;
      drawText(`Registration: ${data.registrationNumber}`, 50, yPosition);
      yPosition -= 20;

      // Service Items
      drawText('SERVICE DETAILS', 50, yPosition, { bold: true, size: 12 });
      yPosition -= 20;

      if (data.serviceItems && data.serviceItems.length > 0) {
        data.serviceItems.forEach((item, index) => {
          drawText(`${index + 1}. ${item.description}`, 60, yPosition);
          yPosition -= 15;
          drawText(`   Qty: ${item.quantity} x ₹${item.rate} = ₹${item.amount}`, 60, yPosition);
          yPosition -= 15;
        });
      }

      yPosition -= 10;
      drawText(`Total Amount: ₹${data.totalAmount}`, 50, yPosition, { bold: true });
      yPosition -= 15;
      drawText(`Grand Total: ₹${data.grandTotal}`, 50, yPosition, { bold: true, size: 12 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      if (window.electronAPI) {
        const filename = `service-bill-${data.registrationNumber}-${Date.now()}.pdf`;
        await window.electronAPI.savePDF(filename, pdfBytes);
      }

      return { success: true, blob, buffer: pdfBytes };
    } catch (error) {
      console.error('Error generating service bill PDF offline:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download PDF blob
   */
  downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new PDFService();
