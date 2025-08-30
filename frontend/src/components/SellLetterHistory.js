
import React, { useState, useEffect, useContext } from "react";
import httpClient from "../utils/offlineHttpClient";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Download,
  Edit,
  Trash2,
  X,
  Bike,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";
import AuthContext from "../context/AuthContext";
import offlineManager from "../utils/offlineManager";

const OFFLINE_KEYS = { sell: "SellLetterOfflineQueue" };

const EditSellLetterModal = ({ letter, onClose, onSave }) => {
  const [formData, setFormData] = useState(letter);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Edit Sell Letter</h2>
          <button onClick={onClose} style={modalStyles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Vehicle Information */}
          <div style={modalStyles.formSection}>
            <h2 style={modalStyles.sectionTitle}>Vehicle Information</h2>
            <div style={modalStyles.formGrid}>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Vehicle Name</label>
                <input
                  type="text"
                  name="vehicleName"
                  value={formData.vehicleName}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Vehicle Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Vehicle Color</label>
                <input
                  type="text"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div style={modalStyles.formSection}>
            <h2 style={modalStyles.sectionTitle}>Buyer Information</h2>
            <div style={modalStyles.formGrid}>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Buyer Name</label>
                <input
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Buyer Phone</label>
                <input
                  type="text"
                  name="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Sale Amount</label>
                <input
                  type="number"
                  name="saleAmount"
                  value={formData.saleAmount}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
            </div>
          </div>

          <div style={modalStyles.formActions}>
            <button
              type="button"
              onClick={onClose}
              style={modalStyles.cancelButton}
            >
              Cancel
            </button>
            <button type="submit" style={modalStyles.saveButton}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SellLetterHistory = () => {
  const { user,logout } = useContext(AuthContext);

  const [activeMenu, setActiveMenu] = useState("Sell Letter History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [sellLetters, setSellLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingLetter, setEditingLetter] = useState(null);
  const navigate = useNavigate();
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

  // English template field positions - copied from SellLetterPDF
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
    buyerPhone2: { x: 176, y: 282, size: 11 },
    buyerAadhar: { x: 137, y: 263, size: 11 },
    witnessName: { x: 105, y: 135, size: 11 },
    witnessPhone: { x: 105, y: 116, size: 11 },
    note: { x: 70, y: 35, size: 10 },
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  useEffect(() => {
    const fetchSellLetters = async () => {
      setLoading(true);
      if (offlineManager.getOnlineStatus()) {
        try {
          const response = await httpClient.get(
            `https://ok-motor.onrender.com/api/sell-letters/my-letters?page=${currentPage}`,
            { headers: {} }
          );
          setSellLetters(response.data);
          offlineManager.saveToStorage(OFFLINE_KEYS.sell, response.data);
          // Save token for offline login
          const token = localStorage.getItem("token");
          if (token) {
            localStorage.setItem("offline_token", token);
          }
        } catch (error) {
          setSellLetters(offlineManager.loadFromStorage(OFFLINE_KEYS.sell, []));
        }
      } else {
        setSellLetters(offlineManager.loadFromStorage(OFFLINE_KEYS.sell, []));
      }
      setTotalPages(1);
      setLoading(false);
    };
    fetchSellLetters();
    window.addEventListener("online", fetchSellLetters);
    return () => window.removeEventListener("online", fetchSellLetters);
  }, [currentPage]);
  const formatTime12Hour = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };
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
  const formatKm = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
  };

  const formatRupee = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : `${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };
   const formatTime = (timeString) => {
  if (!timeString) return "";

  const [hour, minute] = timeString.split(":").map(Number);
  
  // Convert to 12-hour format with leading zeros and proper AM/PM
  const hours12 = hour % 12 || 12; // Convert 0 to 12 for 12-hour format
  const ampm = hour >= 12 ? "PM" : "AM";
  
  // Add leading zero to hours and minutes if needed
  const formattedHours = String(hours12).padStart(2, "0");
  const formattedMinutes = String(minute).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};
  const filteredLetters = sellLetters.filter(
    (letter) =>
      letter.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      letter.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (letter) => {
    setSelectedLetter(letter);
    setShowLanguageModal(true);
  };
  const DownloadProgressModal = ({ progress, onClose }) => {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <h2 style={modalStyles.title}>Generating PDF</h2>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <div style={progressStyles.progressContainer}>
              <div
                style={{
                  ...progressStyles.progressBar,
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            <p style={progressStyles.progressText}>{progress}% Complete</p>
            {progress === 100 && (
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const progressStyles = {
    progressContainer: {
      width: "100%",
      height: "20px",
      backgroundColor: "#e2e8f0",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "8px",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#3b82f6",
      transition: "width 0.3s ease",
    },
    progressText: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
  };
  const fillAndDownloadHindiPdf = async (letter) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      // Simulate progress
      await simulateProgress();
      const templateUrl = "/templates/sellletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Create vehicle invoice page
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);


      const formattedLetter = {
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
        amountInWords: formatIndianAmountInWords(letter.saleAmount), // Amount in words
        saleAmount: formatRupee(letter.saleAmount), // Formatted amount
        sellerphone: letter.sellerphone || "9876543210",
        selleraadhar: letter.selleraadhar || "764465626571",
      };

      // for (const [fieldName, position] of Object.entries(hindiFieldPositions)) {
      //   if (formattedLetter[fieldName]) {
      //     pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
      //       x: position.x,
      //       y: position.y,
      //       size: position.size,
      //       color: rgb(0, 0, 0),
      //     });
      //   }
      // }
      for (const [fieldName, position] of Object.entries(hindiFieldPositions)) {
        if (fieldName === "buyerPhone" && formattedLetter.buyerPhone) {
          const combinedPhones = `${formattedLetter.buyerPhone}${
            formattedLetter.buyerPhone2
              ? ` , ${formattedLetter.buyerPhone2}`
              : ""
          }`;
          pdfDoc.getPages()[0].drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        }
      }
      if (formattedLetter.saleAmount && formattedLetter.amountInWords) {
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const saleText = `${formattedLetter.saleAmount}`;
        const xBase = hindiFieldPositions.saleAmount.x;
        const yBase = hindiFieldPositions.saleAmount.y;

        // Draw Amount in Words right next to it
        const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
        page.drawText(formattedLetter.amountInWords, {
          x: xBase + saleTextWidth + 8, // 8px padding
          y: yBase,
          size: 10,
          color: rgb(0, 0, 0),
          font,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sell_letter_hindi_${letter._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating Hindi PDF:", error);
      alert("Failed to generate Hindi PDF. Please try again.");
    }
  };

  const fillAndDownloadEnglishPdf = async (letter) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      // Simulate progress
      await simulateProgress();
      const templateUrl = "/templates/englishsell.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Create vehicle invoice page
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      const formattedLetter = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime12Hour(letter.saleTime), // Use 12-hour format
    amountInWords: formatIndianAmountInWords(letter.saleAmount), // Amount in words
    saleAmount: formatRupee(letter.saleAmount), // Formatted amount
        todayTime: formatTime12Hour(letter.todayTime || "12:00"),
        previousDate: formatDate(
          letter.previousDate || letter.todayDate || new Date()
        ),
        previousTime: formatTime12Hour(
          letter.previousTime || letter.todayTime || "12:00"
        ),
        vehiclekm: formatKm(letter.vehiclekm), // Formatted KM
        saleAmount: formatRupee(letter.saleAmount), // Formatted amount
        amountInWords: formatIndianAmountInWords(letter.saleAmount), // Amount in words
        sellerphone: letter.sellerphone || "9876543210",
        selleraadhar: letter.selleraadhar || "764465626571",
      };

      // Fill sell letter fields
      for (const [fieldName, position] of Object.entries(
        englishFieldPositions
      )) {
        if (fieldName === "buyerPhone" && formattedLetter.buyerPhone) {
          const combinedPhones = `${formattedLetter.buyerPhone}${
            formattedLetter.buyerPhone2
              ? ` , ${formattedLetter.buyerPhone2}`
              : ""
          }`;
          pdfDoc.getPages()[0].drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        }
      }
      if (formattedLetter.saleAmount && formattedLetter.amountInWords) {
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const saleText = `${formattedLetter.saleAmount}`;
        const xBase = englishFieldPositions.saleAmount.x;
        const yBase = englishFieldPositions.saleAmount.y;

        // Draw Amount in Words right next to it
        const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
        page.drawText(formattedLetter.amountInWords, {
          x: xBase + saleTextWidth + 8, // 8px padding
          y: yBase,
          size: 10,
          color: rgb(0, 0, 0),
          font,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sell_letter_english_${letter._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    }
  };
  const drawVehicleInvoice = async (page, pdfDoc, letter) => {
    // Embed fonts first
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1; // Use your imported logo
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes); // or embedJpg if using JPEG

    // Header background
    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 80,
      color: rgb(0.047, 0.098, 0.196),
    });

    page.drawImage(logoImage, {
      x: 50,
      y: 743,
      width: 150,
      height: 120,
    });

    page.drawImage(logoImage, {
      x: 180,
      y: 430,
      width: 260,
      height: 220,
      opacity: 0.3,
    });
    page.drawImage(logoImage, {
      x: 180,
      y: 130,
      width: 260,
      height: 220,
      opacity: 0.3,
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 805,
      size: 18,
      color: rgb(1, 1, 1),
      font: font,
    });
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

    page.drawText(`Date: ${formatDate(letter.todayDate)}`, {
      x: 385,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`Time: ${formatTime(letter.saleTime)}`, {
      x: 470,
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

    page.drawText("CUSTOMER DETAILS", {
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
    const lineHeight2 = 12;

    const address = letter.buyerAddress || "N/A";
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

      page.drawText(text, {
        x: xPos,
        y: 650 - index * lineHeight2,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    page.drawText(`Phone: ${letter.buyerPhone || "N/A"}`, {
      x: 370,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`, ${letter.buyerPhone2 || "N/A"}`, {
      x: 460,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Aadhar: ${letter.buyerAadhar || "N/A"}`, {
      x: 370,
      y: 650,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    // Vehicle Information section
    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: 620,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    // Vehicle details table header
    page.drawRectangle({
      x: 50,
      y: 590,
      width: 495,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
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
        y: 571,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: boldFont,
      });
    });
    const lineHeight = 12;

    // Vehicle details row
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
      let yPos = 550;

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

      // Draw each line
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

    // Sale Information section
    page.drawText("SALE INFORMATION", {
      x: 50,
      y: 515,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Sale Date: ${formatDate(letter.saleDate)}`, {
      x: 60,
      y: 495,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Sale Amount: Rs. ${formatRupee(letter.saleAmount) || "0"}`, {
      x: 200,
      y: 495,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    const paymentMethodDisplay = {
      cash: "CASH",
      upi: "UPI",
      bankTransfer: "BANK TRANSFER",
      soldloan: "LOAN",
    };

    page.drawText(
      `Payment: ${paymentMethodDisplay[letter.paymentMethod] || "CASH"}`,
      {
        x: 350,
        y: 495,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );
    page.drawText(
      `Amount in Words: ${
        formatIndianAmountInWords(letter.saleAmount) || "N/A"
      }`,
      {
        x: 60,
        y: 475,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawText(
      `Condition: ${
        letter.vehicleCondition === "running" ? "RUNNING" : "NOT RUNNING"
      }`,
      {
        x: 60,
        y: 596,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawRectangle({
      x: 0,
      y: 360,
      width: 595,
      height: 60,
      color: rgb(0.047, 0.098, 0.196),
    });
    page.drawImage(logoImage, {
      x: 40,
      y: 345,
      width: 120,
      height: 90,
    });
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
      `10. OK MOTORS has recieved the money amount ${formatRupee(
        letter.saleAmount
      )} from ${letter.buyerName}.`,
      "11. It is compulsory to get the vehicle serviced after driving 1500-1800 km otherwise guarrantee will be expired ",
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

    // Seller Signature
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

    page.drawText("Authorized Signatory", {
      x: 360,
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

    // Footer
    page.drawLine({
      start: { x: 50, y: 55 },
      end: { x: 545, y: 55 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your business!", {
      x: 220,
      y: 35,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      {
        x: 160,
        y: 20,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sell letter?")) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert("You are not authenticated. Please login again.");
          logout();
          navigate('/login');
          return;
        }

        await httpClient.delete(
          `https://ok-motor.onrender.com/api/sell-letters/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSellLetters(sellLetters.filter((letter) => letter._id !== id));
      } catch (error) {
        console.error("Error deleting sell letter:", error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          alert("Your session has expired. Please login again.");
          logout();
          navigate('/login');
        } else if (error.response?.status === 403) {
          alert("You don't have permission to delete this item.");
        } else {
          alert(`Failed to delete: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      }
    }
  };

  const handleEdit = (letter) => {
    setEditingLetter(letter);
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const handleSaveEdit = async (updatedLetter) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("You are not authenticated. Please login again.");
        logout();
        navigate('/login');
        return;
      }

      const response = await httpClient.put(
        `https://ok-motor.onrender.com/api/sell-letters/${updatedLetter._id}`,
        updatedLetter,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSellLetters(
        sellLetters.map((letter) =>
          letter._id === updatedLetter._id ? response.data : letter
        )
      );
      setEditingLetter(null);
    } catch (error) {
      console.error("Error updating sell letter:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        logout();
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert("You don't have permission to edit this item.");
      } else {
        alert(`Failed to update: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      }
    }
  };
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: (userRole) => (userRole === "admin" ? "/admin" : "/staff"),
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
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    // Handle both string paths and function paths
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - same as SellLetterForm */}
      <div style={styles.sidebar}>
         <div style={styles.sidebarHeader}>
          <img
            src={logo}
            alt="logo"
            style={{
              width: "100%",
              maxWidth: "25rem",
              height: "13rem",
              objectFit: "cover", // match CSS
              objectPosition: "center",
              display: "block",
              margin: "0 auto 1rem auto",
            }}
          />
          <p style={styles.sidebarSubtitle}>Welcome, OK MOTORS</p>
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
                    // Pass the path as-is (could be string or function)
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

              {item.submenu && expandedMenus[item.name] && (
                <div style={styles.submenu}>
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

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Sell Letter History</h1>
            <p style={styles.pageSubtitle}>
              View and manage all your generated sell letters
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search sell letters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button
              style={styles.newLetterButton}
              onClick={() => navigate("/sell/create")}
            >
              <FileText size={16} style={styles.buttonIcon} />
              New Sell Letter
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading sell letters...</p>
              {/* You can add a spinner here */}
            </div>
          ) : filteredLetters.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={48} style={styles.emptyIcon} />
              <p style={styles.emptyText}>
                {searchTerm
                  ? "No matching sell letters found"
                  : "No sell letters created yet"}
              </p>
              <button
                style={styles.newLetterButton}
                onClick={() => navigate("/sell/create")}
              >
                Create Your First Sell Letter
              </button>
            </div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Buyer</th>
                      <th style={styles.tableHeader}>Vehicle Model</th>
                      <th style={styles.tableHeader}>Vehicle Reg No</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Created By</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLetters.map((letter) => (
                      <tr key={letter._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{letter.buyerName}</td>
                        <td style={styles.tableCell}>{letter.vehicleModel}</td>
                        <td style={styles.tableCell}>
                          {letter.registrationNumber}
                        </td>
                        <td style={styles.tableCell}>
                          ₹
                          {new Intl.NumberFormat("en-IN").format(
                            letter.saleAmount
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {formatDate(letter.createdAt)}
                        </td>
                        <td style={styles.tableCell}>
                          {letter.user && letter.user.role === 'admin' ? 'admin' : (letter.user && letter.user.name ? letter.user.name : '')}
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleDownload(letter)}
                            style={styles.iconButton}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {user?.role === "admin" && (
                            <>
                              <button
                                onClick={() => handleEdit(letter)}
                                style={styles.iconButton}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(letter._id)}
                                style={styles.iconButton}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.pagination}>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  Previous
                </button>
                <span style={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
        {showLanguageModal && selectedLetter && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Select PDF Language</h3>
              <p style={styles.modalText}>
                Choose the language for your sell letter:
              </p>
              <div style={styles.modalButtons}>
                <button
                  style={styles.englishButton}
                  onClick={() => {
                    fillAndDownloadEnglishPdf(selectedLetter);
                    setShowLanguageModal(false);
                  }}
                >
                  English PDF
                </button>
                <button
                  style={styles.hindiButton}
                  onClick={() => {
                    fillAndDownloadHindiPdf(selectedLetter);
                    setShowLanguageModal(false);
                  }}
                >
                  Hindi PDF
                </button>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowLanguageModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {isDownloading && (
          <DownloadProgressModal
            progress={downloadProgress}
            onClose={() => setIsDownloading(false)}
          />
        )}
        {editingLetter && (
          <EditSellLetterModal
            letter={editingLetter}
            onClose={() => setEditingLetter(null)}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
};
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "80%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: 0,
    color: "#1e293b",
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    ":hover": {
      color: "#1e293b",
    },
  },
  form: {
    padding: "24px",
  },
  formSection: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  },
  formField: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: "8px",
  },
  formInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
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
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  saveButton: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  cancelButton: {
    padding: "8px 16px",
    backgroundColor: "#e2e8f0",
    color: "#1e293b",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    ":hover": {
      backgroundColor: "#cbd5e1",
    },
  },
};
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    height: "100vh",
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
    backgroundColor: "#1a2536",
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
    width: "300px",
  },
  newLetterButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
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
  tableCell: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "#1e293b",
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "8px",
    margin: "0 4px",
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "#f1f5f9",
      color: "#3b82f6",
    },
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
  },
  paginationButton: {
    padding: "8px 16px",
    backgroundColor: "#e2e8f0",
    color: "#1e293b",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#cbd5e1",
    },
    ":disabled": {
      opacity: "0.5",
      cursor: "not-allowed",
    },
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
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
  emptyIcon: {
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  emptyText: {
    color: "#64748b",
    fontSize: "1rem",
    margin: 0,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },

  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    ":hover": {
      backgroundColor: "#f8fafc",
    },
  },
  vehicleInfo: {
    display: "flex",
    flexDirection: "column",
    "> strong": {
      marginBottom: "4px",
    },
    "> span": {
      fontSize: "0.75rem",
      color: "#64748b",
    },
  },
  buyerInfo: {
    display: "flex",
    flexDirection: "column",
    "> strong": {
      marginBottom: "4px",
    },
    "> span": {
      fontSize: "0.75rem",
      color: "#64748b",
    },
  },
  verifiedBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  unverifiedBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  viewButton: {
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

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "8px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#1e293b",
  },
  modalText: {
    marginBottom: "24px",
    color: "#64748b",
  },
  modalButtons: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
  },
  englishButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  hindiButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    ":hover": {
      backgroundColor: "#059669",
    },
  },
  modalCloseButton: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#e2e8f0",
    },
  },
};

export default SellLetterHistory;
