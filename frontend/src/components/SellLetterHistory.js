import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
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
  Download,
  Edit,
  Trash2,
  X,
  Bike,
  Menu,
  Settings,
  RefreshCw,
  Megaphone,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadPDFTemplate } from "../utils/pdfTemplateLoader";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";
import AuthContext from "../context/AuthContext";

const SellLetterHistory = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeMenu, setActiveMenu] = useState("Sell Letter History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [languageAction, setLanguageAction] = useState(null); // 'download' | 'preview'
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [chosenLanguage, setChosenLanguage] = useState(null); // 'hindi' | 'english'
  const [docSelections, setDocSelections] = useState({
    letter: true,
    invoice: true,
    vehicleRC: true,
    aadhaar: true,
    pan: true,
    vehicleKM: true,
    vehiclePhotos: true,
  });
  const [sellLetters, setSellLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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
    // If the value includes a time portion like '2024-05-01T00:00:00', strip it
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

  // Helper to get field label in readable format
  const getFieldLabel = (fieldName) => {
    const labels = {
      vehicleName: "Vehicle Name",
      vehicleModel: "Vehicle Model",
      vehicleColor: "Vehicle Color",
      registrationNumber: "Registration Number",
      chassisNumber: "Chassis Number",
      engineNumber: "Engine Number",
      vehiclekm: "Vehicle KM",
      vehicleCondition: "Vehicle Condition",
      pucIssueDate: "PUC Issue Date",
      pucExpiryDate: "PUC Expiry Date",
      pucStatus: "PUC Status",
      insuranceStatus: "Insurance Status",
      insuranceExpiryDate: "Insurance Expiry Date",
      insuranceCompany: "Insurance Company",
      insurancePolicyNumber: "Insurance Policy Number",
      buyerName: "Buyer Name",
      buyerFatherName: "Buyer Father Name",
      buyerAddress: "Buyer Address",
      buyerPhone: "Buyer Phone",
      buyerPhone2: "Buyer Phone 2",
      buyerEmail: "Buyer Email",
      buyerAadhar: "Buyer Aadhaar",
      saleDate: "Sale Date",
      saleTime: "Sale Time",
      saleAmount: "Sale Amount",
      paymentMethod: "Payment Method",
      todayDate: "Today's Date",
      todayTime: "Today's Time",
      previousDate: "Previous Date",
      previousTime: "Previous Time",
      witnessName: "Witness Name",
      witnessPhone: "Witness Phone",
      note: "Note",
    };
    return labels[fieldName] || fieldName;
  };

  // Function to detect and display changes
  const getChanges = (letter) => {
    if (!letter.previousVersionId || letter.version === 1) return null;

    const changes = [];
    const fieldsToCompare = [
      "vehicleName",
      "vehicleModel",
      "vehicleColor",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "vehiclekm",
      "vehicleCondition",
      "pucStatus",
      "insuranceStatus",
      "insuranceCompany",
      "insurancePolicyNumber",
      "buyerName",
      "buyerFatherName",
      "buyerAddress",
      "buyerPhone",
      "buyerPhone2",
      "buyerEmail",
      "buyerAadhar",
      "saleAmount",
      "paymentMethod",
      "witnessName",
      "witnessPhone",
      "note",
    ];

    // Check if we have previousVersion data populated
    if (letter.previousVersion) {
      fieldsToCompare.forEach((field) => {
        const oldValue = letter.previousVersion[field];
        const newValue = letter[field];

        if (oldValue !== newValue && (oldValue || newValue)) {
          changes.push({
            field: getFieldLabel(field),
            oldValue: oldValue || "(empty)",
            newValue: newValue || "(empty)",
          });
        }
      });

      // Check date fields
      const dateFields = [
        { old: "saleDate", new: "saleDate", label: "Sale Date" },
        { old: "todayDate", new: "todayDate", label: "Today's Date" },
        { old: "previousDate", new: "previousDate", label: "Previous Date" },
        { old: "pucIssueDate", new: "pucIssueDate", label: "PUC Issue Date" },
        {
          old: "pucExpiryDate",
          new: "pucExpiryDate",
          label: "PUC Expiry Date",
        },
        {
          old: "insuranceExpiryDate",
          new: "insuranceExpiryDate",
          label: "Insurance Expiry Date",
        },
      ];

      dateFields.forEach(({ old, new: newField, label }) => {
        const oldDate = letter.previousVersion[old]
          ? formatDate(letter.previousVersion[old])
          : "";
        const newDate = letter[newField] ? formatDate(letter[newField]) : "";
        if (oldDate !== newDate && (oldDate || newDate)) {
          changes.push({
            field: label,
            oldValue: oldDate || "(empty)",
            newValue: newDate || "(empty)",
          });
        }
      });

      // Check time fields
      const timeFields = ["saleTime", "todayTime", "previousTime"];
      timeFields.forEach((field) => {
        const oldValue = letter.previousVersion[field];
        const newValue = letter[field];
        if (oldValue !== newValue && (oldValue || newValue)) {
          changes.push({
            field: getFieldLabel(field),
            oldValue: oldValue || "(empty)",
            newValue: newValue || "(empty)",
          });
        }
      });

      // Check document changes
      const checkDocumentChange = (docPath, label) => {
        const getNestedValue = (obj, path) =>
          path.split(".").reduce((acc, part) => acc?.[part], obj);
        const oldDoc = getNestedValue(
          letter.previousVersion.documents,
          docPath,
        );
        const newDoc = getNestedValue(letter.documents, docPath);

        if (oldDoc !== newDoc) {
          if (!oldDoc && newDoc) {
            changes.push({
              field: label,
              oldValue: "Not uploaded",
              newValue: "Uploaded",
            });
          } else if (oldDoc && !newDoc) {
            changes.push({
              field: label,
              oldValue: "Uploaded",
              newValue: "Removed",
            });
          } else if (oldDoc && newDoc && oldDoc !== newDoc) {
            changes.push({
              field: label,
              oldValue: "Updated (old document)",
              newValue: "Updated (new document)",
            });
          }
        }
      };

      // Check all document types
      checkDocumentChange("vehicleRC.front", "Vehicle RC - Front");
      checkDocumentChange("vehicleRC.back", "Vehicle RC - Back");
      checkDocumentChange("aadhaar.front", "Aadhaar - Front");
      checkDocumentChange("aadhaar.back", "Aadhaar - Back");
      checkDocumentChange("pan", "PAN Card");
      checkDocumentChange("deliveryPhoto", "Delivery Photo") ||
        checkDocumentChange("vehicleKM", "Delivery Photo");

      // Check vehicle photos count
      const oldPhotosCount =
        letter.previousVersion.documents?.vehiclePhotos?.length || 0;
      const newPhotosCount = letter.documents?.vehiclePhotos?.length || 0;
      if (oldPhotosCount !== newPhotosCount) {
        changes.push({
          field: "Vehicle Photos",
          oldValue: `${oldPhotosCount} photo${oldPhotosCount !== 1 ? "s" : ""}`,
          newValue: `${newPhotosCount} photo${newPhotosCount !== 1 ? "s" : ""}`,
        });
      }
    }

    return changes.length > 0 ? changes : null;
  };
  useEffect(() => {
    const fetchSellLetters = async () => {
      setLoading(true);
      try {
        const isOnline = navigator.onLine;

        if (isOnline) {
          const response = await axios.get(
            `https://ok-motor-51l3.vercel.app/api/sell-letters/my-letters?page=${currentPage}`,
            { headers: {} },
          );
          setSellLetters(response.data);
        } else {
          console.log("Offline mode - loading sell letters from local storage");
          const offlineStorage = (await import("../services/offlineStorage"))
            .default;
          const result = await offlineStorage.find("sellLetters");

          if (result.success && result.data) {
            const sortedData = result.data.sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
            setSellLetters(sortedData);
          } else {
            setSellLetters([]);
          }
        }
      } catch (error) {
        console.error("Error fetching sell letters:", error);

        if (navigator.onLine) {
          console.log("Online fetch failed, trying offline fallback");
          try {
            const offlineStorage = (await import("../services/offlineStorage"))
              .default;
            const result = await offlineStorage.find("sellLetters");

            if (result.success && result.data) {
              const sortedData = result.data.sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
              );
              setSellLetters(sortedData);
            }
          } catch (offlineError) {
            console.error("Offline fallback also failed:", offlineError);
            setSellLetters([]);
          }
        } else {
          setSellLetters([]);
        }
      }
      setTotalPages(1);
      setLoading(false);
    };
    fetchSellLetters();
  }, [currentPage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
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

    const hours12 = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";

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
      letter.buyerName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDownload = (letter) => {
    setSelectedLetter(letter);
    setLanguageAction("download");
    setShowLanguageModal(true);
  };

  const handleViewLetter = async (letter, language = "english") => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Choose template based on language
      const templateName =
        language === "hindi" ? "sellletter.pdf" : "englishsell.pdf";
      const existingPdfBytes = await loadPDFTemplate(templateName);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedLetter = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime12Hour(letter.saleTime),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),
        saleAmount: formatRupee(letter.saleAmount),
        todayDate: formatDate(letter.todayDate),
        todayDate1: formatDate(letter.todayDate),
        todayTime: formatTime12Hour(letter.todayTime || "12:00"),
        todayTime1: formatTime12Hour(letter.todayTime || "12:00"),
        previousDate: formatDate(
          letter.previousDate || letter.todayDate || new Date(),
        ),
        previousTime: formatTime12Hour(
          letter.previousTime || letter.todayTime || "12:00",
        ),
        vehiclekm: formatKm(letter.vehiclekm),
        sellerphone: letter.sellerphone || "9876543210",
        selleraadhar: letter.selleraadhar || "764465626571",
      };

      // Helper: draw consistent header/footer on a page
      const drawHeaderFooter = async (pdfDoc, page) => {
        try {
          const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const logoUrl = logo1;
          const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
          const logoImg = await pdfDoc.embedPng(logoBytes);

          // Header
          page.drawRectangle({ x: 0, y: 780, width: 595, height: 80, color: rgb(0.047, 0.098, 0.196) });
          page.drawImage(logoImg, { x: 50, y: 743, width: 150, height: 120 });
          try { page.drawImage(logoImg, { x: 180, y: 430, width: 260, height: 220, opacity: 0.3 }); } catch (e) {}
          page.drawText("UDAYAM-BR-26-0028550", { x: 330, y: 805, size: 14, color: rgb(1, 1, 1), font: headerFont });
          page.drawText("GSTIN: 22ABCDE1234F1Z5", { x: 330, y: 785, size: 14, color: rgb(1, 1, 1), font: headerFont });

          // Footer - centered thank you + muted address line
          try {
            const thank = "Thank you for your business!";
            const addr = "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
            const thankW = headerFont.widthOfTextAtSize(thank, 12);
            const addrW = regularFont.widthOfTextAtSize(addr, 9);
            const centerXThank = (595 - thankW) / 2;
            const centerXAddr = (595 - addrW) / 2;

            page.drawLine({ start: { x: 20, y: 52 }, end: { x: 575, y: 52 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
            page.drawText(thank, { x: centerXThank, y: 40, size: 12, color: rgb(0, 0, 0), font: headerFont });
            page.drawText(addr, { x: centerXAddr, y: 26, size: 9, color: rgb(0.45, 0.45, 0.45), font: regularFont });
          } catch (e) {}
        } catch (err) {
          console.warn("Failed to draw header/footer:", err);
        }
      };

      const fieldPositions =
        language === "hindi" ? hindiFieldPositions : englishFieldPositions;
      // Add header/footer to all pages except the first (letter) page
      try {
        const pages = pdfDoc.getPages();
        for (let i = 1; i < pages.length; i++) {
          try {
            await drawHeaderFooter(pdfDoc, pages[i]);
          } catch (err) {}
        }
      } catch (e) {}

      for (const [fieldName, position] of Object.entries(fieldPositions)) {
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
        // Use the selected field positions so Hindi/English templates align correctly
        const xBase = fieldPositions.saleAmount.x;
        const yBase = fieldPositions.saleAmount.y;
        const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
        const offsetMultiplier = language === "hindi" ? 1.4 : 3;
        page.drawText(formattedLetter.amountInWords, {
          x:
            xBase +
            saleTextWidth +
            offsetMultiplier * (fieldPositions.saleAmount.size / 2),
          y: yBase,
          size: 10,
          color: rgb(0, 0, 0),
          font,
        });
      }

      // Add invoice page
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);

      // Add document pages if available
      if (letter.documents) {
        // Define addDocumentPages inline for preview
        const embedImageFromUrl = async (pdfDoc, url) => {
          try {
            const res = await fetch(url);
            const contentType = res.headers.get("content-type") || "";
            const bytes = await res.arrayBuffer();
            if (contentType.includes("png"))
              return await pdfDoc.embedPng(bytes);
            return await pdfDoc.embedJpg(bytes);
          } catch (err) {
            console.warn("Failed to embed image from", url, err);
            return null;
          }
        };

        const addDocumentPages = async (pdfDoc, documentsObj) => {
          if (!documentsObj) return;
          const items = [];
          const rcItems = []; 

          // Collect RC items
          if (documentsObj.vehicleRC) {
            if (documentsObj.vehicleRC.front)
              rcItems.push({
                title: "Vehicle RC - Front",
                url: documentsObj.vehicleRC.front,
              });
            if (documentsObj.vehicleRC.back)
              rcItems.push({
                title: "Vehicle RC - Back",
                url: documentsObj.vehicleRC.back,
              });
          }
          const singleAadhaarItem = [];
          if (documentsObj.aadhaar) {
            const uploadMode = documentsObj.aadhaarUploadMode || "separate";

            if (uploadMode === "single") {
              // Single file mode: render full-page separately
              if (documentsObj.aadhaar.front) {
                singleAadhaarItem.push({
                  title: "Aadhaar (Front and Back)",
                  url: documentsObj.aadhaar.front,
                });
              }
            } else {
              // Separate mode: show front and back separately in 2-per-page layout
              if (documentsObj.aadhaar.front)
                items.push({
                  title: "Aadhaar - Front",
                  url: documentsObj.aadhaar.front,
                });
              if (
                documentsObj.aadhaar.back &&
                documentsObj.aadhaar.back !== documentsObj.aadhaar.front
              )
                items.push({
                  title: "Aadhaar - Back",
                  url: documentsObj.aadhaar.back,
                });
            }
          }
          if (documentsObj.pan)
            items.push({ title: "PAN Card", url: documentsObj.pan });
          if (documentsObj.deliveryPhoto || documentsObj.vehicleKM)
            items.push({
              title: "Delivery Photo",
              url: documentsObj.deliveryPhoto || documentsObj.vehicleKM,
            });
          if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
            documentsObj.vehiclePhotos.forEach((u, i) =>
              items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
            );
          }

          // Create first page with RC items (compact 2-column layout)
          if (rcItems.length > 0) {
            const page = pdfDoc.addPage([595, 842]);
            try {
              await drawHeaderFooter(pdfDoc, page);
            } catch (e) {}
            const margin = 40;
            const colWidth = (595 - 3 * margin) / 2;
            const colGap = margin;
            const maxHeight = 250;

            for (let i = 0; i < rcItems.length; i++) {
              const item = rcItems[i];
              const xPos = margin + i * (colWidth + colGap);
              const yTop = 700;

              const titleFont = await pdfDoc.embedFont(
                StandardFonts.HelveticaBold,
              );
              page.drawText(item.title, {
                x: xPos,
                y: yTop,
                size: 10,
                font: titleFont,
              });

              const embedded = await embedImageFromUrl(pdfDoc, item.url);
              if (embedded) {
                const { width, height } = embedded.scale(1);
                let drawW = colWidth - 20;
                let drawH = (height / width) * drawW;

                if (drawH > maxHeight) {
                  drawH = maxHeight;
                  drawW = (width / height) * drawH;
                }

                const centeredX = xPos + (colWidth - drawW) / 2;
                const drawY = yTop - drawH - 15;

                page.drawImage(embedded, {
                  x: centeredX,
                  y: drawY,
                  width: drawW,
                  height: drawH,
                });
              }
            }
          }

          // Render single Aadhaar as full page
          if (singleAadhaarItem.length > 0) {
            const page = pdfDoc.addPage([595, 842]);
            try {
              await drawHeaderFooter(pdfDoc, page);
            } catch (e) {}
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const item = singleAadhaarItem[0];

            page.drawText(item.title, { x: 50, y: 753, size: 14, font });

            const embedded = await embedImageFromUrl(pdfDoc, item.url);
            if (embedded) {
              const pageWidth = 595;
              const pageHeight = 842;
              const margin = 50;
              const maxWidth = pageWidth - 2 * margin;
              const maxHeight = pageHeight - 150;

              const { width, height } = embedded.scale(1);
              let drawW = maxWidth;
              let drawH = (height / width) * drawW;

              if (drawH > maxHeight) {
                drawH = maxHeight;
                drawW = (width / height) * drawH;
              }

              const xPos = (pageWidth - drawW) / 2;
              const yPos = 750 - drawH;

              page.drawImage(embedded, {
                x: xPos,
                y: yPos,
                width: drawW,
                height: drawH,
              });
            }
          }

          // Add remaining documents (2 per page)
          for (let i = 0; i < items.length; i += 2) {
            const page = pdfDoc.addPage([595, 842]);
            try {
              await drawHeaderFooter(pdfDoc, page);
            } catch (e) {}
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const yPositions = [740, 390];

            for (let cell = 0; cell < 2; cell++) {
              const item = items[i + cell];
              if (!item) continue;
              const x = 50;
              const yTop = yPositions[cell];
              page.drawText(item.title, { x, y: yTop, size: 12, font });
              const embedded = await embedImageFromUrl(pdfDoc, item.url);
              if (embedded) {
                const cellMaxW = 500;
                const cellMaxH = 320;
                const { width, height } = embedded.scale(1);
                let drawW = cellMaxW;
                let drawH = (height / width) * drawW;
                if (drawH > cellMaxH) {
                  drawH = cellMaxH;
                  drawW = (width / height) * drawH;
                }
                const drawY = yTop - drawH - 10;
                page.drawImage(embedded, {
                  x,
                  y: drawY,
                  width: drawW,
                  height: drawH,
                });
              }
            }
          }
        };

        await addDocumentPages(pdfDoc, letter.documents);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      clearInterval(progressInterval);
      setDownloadProgress(100);
      setIsDownloading(false);

      setPreviewPdfUrl(url);
      setPreviewLetter(letter);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview. Please try again.");
      setIsDownloading(false);
    }
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
                  backgroundColor: "#088395",
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
      backgroundColor: "#088395",
      transition: "width 0.3s ease",
    },
    progressText: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
  };
  const fillAndDownloadHindiPdf = async (letter, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();

      // Start with empty PDF if letter is not selected, otherwise load template
      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("sellletter.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

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
            letter.previousDate || letter.todayDate || new Date(),
          ),
          previousTime: formatTime12Hour(
            letter.previousTime || letter.todayTime || "12:00",
          ),
          amountInWords: formatIndianAmountInWords(letter.saleAmount),
          saleAmount: formatRupee(letter.saleAmount),
          sellerphone: letter.sellerphone || "9876543210",
          selleraadhar: letter.selleraadhar || "764465626571",
        };
        for (const [fieldName, position] of Object.entries(
          hindiFieldPositions,
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
          } else if (
            fieldName !== "buyerPhone2" &&
            formattedLetter[fieldName]
          ) {
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
          const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
          page.drawText(formattedLetter.amountInWords, {
            x: xBase + saleTextWidth + 8,
            y: yBase,
            size: 10,
            color: rgb(0, 0, 0),
            font,
          });
        }
      } else {
        // Create empty PDF if letter is not selected
        pdfDoc = await PDFDocument.create();
      }

      // Insert document pages (Vehicle RC, Aadhaar, PAN, KM, Vehicle photos)
      const embedImageFromUrl = async (pdfDoc, url) => {
        try {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type") || "";
          const bytes = await res.arrayBuffer();
          if (contentType.includes("png")) return await pdfDoc.embedPng(bytes);
          return await pdfDoc.embedJpg(bytes);
        } catch (err) {
          console.warn("Failed to embed image from", url, err);
          return null;
        }
      };

      const addDocumentPages = async (pdfDoc, documentsObj) => {
        if (!documentsObj) return;
        const items = [];
        const rcItems = []; // Separate RC items

        // Collect RC items
        if (documentsObj.vehicleRC) {
          if (documentsObj.vehicleRC.front)
            rcItems.push({
              title: "Vehicle RC - Front",
              url: documentsObj.vehicleRC.front,
            });
          if (documentsObj.vehicleRC.back)
            rcItems.push({
              title: "Vehicle RC - Back",
              url: documentsObj.vehicleRC.back,
            });
        }

        // Collect Aadhaar documents based on upload mode
        const singleAadhaarItem = [];
        if (documentsObj.aadhaar) {
          const uploadMode = documentsObj.aadhaarUploadMode || "separate";

          if (uploadMode === "single") {
            // Single file mode: render full-page separately
            if (documentsObj.aadhaar.front) {
              singleAadhaarItem.push({
                title: "Aadhaar (Front and Back)",
                url: documentsObj.aadhaar.front,
              });
            }
          } else {
            // Separate mode: show front and back separately in 2-per-page layout
            if (documentsObj.aadhaar.front)
              items.push({
                title: "Aadhaar - Front",
                url: documentsObj.aadhaar.front,
              });
            if (
              documentsObj.aadhaar.back &&
              documentsObj.aadhaar.back !== documentsObj.aadhaar.front
            )
              items.push({
                title: "Aadhaar - Back",
                url: documentsObj.aadhaar.back,
              });
          }
        }
        if (documentsObj.pan)
          items.push({ title: "PAN Card", url: documentsObj.pan });
        if (documentsObj.deliveryPhoto || documentsObj.vehicleKM)
          items.push({
            title: "Delivery Photo",
            url: documentsObj.deliveryPhoto || documentsObj.vehicleKM,
          });
        if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
          documentsObj.vehiclePhotos.forEach((u, i) =>
            items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
          );
        }

        // Create first page with RC items (compact 2-column layout)
        if (rcItems.length > 0) {
          const page = pdfDoc.addPage([595, 842]);
          const margin = 40;
          const colWidth = (595 - 3 * margin) / 2;
          const colGap = margin;
          const maxHeight = 250;

          for (let i = 0; i < rcItems.length; i++) {
            const item = rcItems[i];
            const xPos = margin + i * (colWidth + colGap);
            const yTop = 700;

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x: xPos,
              y: yTop,
              size: 10,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(pdfDoc, item.url);
            if (embedded) {
              const { width, height } = embedded.scale(1);
              let drawW = colWidth - 20;
              let drawH = (height / width) * drawW;

              if (drawH > maxHeight) {
                drawH = maxHeight;
                drawW = (width / height) * drawH;
              }

              const centeredX = xPos + (colWidth - drawW) / 2;
              const drawY = yTop - drawH - 15;

              page.drawImage(embedded, {
                x: centeredX,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }

        // Render single Aadhaar as full page with header
        if (singleAadhaarItem.length > 0) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const item = singleAadhaarItem[0];

          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
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
                y: 400,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
            } catch (wmErr) {}
            page.drawText("UDAYAM-BR-26-0028550", {
              x: 330,
              y: 805,
              size: 18,
              color: rgb(1, 1, 1),
              font,
            });
            page.drawText("GSTIN: 22ABCDE1234F1Z5", {
              x: 330,
              y: 785,
              size: 18,
              color: rgb(1, 1, 1),
              font,
            });
            try {
              page.drawText(
                "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
                { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font },
              );
            } catch (e) {}
            page.drawRectangle({
              x: 0,
              y: 750,
              width: 595,
              height: 30,
              color: rgb(0.9, 0.9, 0.9),
            });
          } catch (err) {}

          page.drawText(item.title, { x: 50, y: 720, size: 14, font });

          const embedded = await embedImageFromUrl(pdfDoc, item.url);
          if (embedded) {
            const pageWidth = 595;
            const margin = 50;
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = 660;

            const { width, height } = embedded.scale(1);
            let drawW = maxWidth;
            let drawH = (height / width) * drawW;

            if (drawH > maxHeight) {
              drawH = maxHeight;
              drawW = (width / height) * drawH;
            }

            const xPos = (pageWidth - drawW) / 2;
            const yPos = 690 - drawH;

            page.drawImage(embedded, {
              x: xPos,
              y: yPos,
              width: drawW,
              height: drawH,
            });
          }
        }

        // Add remaining documents (2 per page)
        for (let i = 0; i < items.length; i += 2) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);

            // invoice-style header
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
              page.drawImage(logoImg, {
                x: 180,
                y: 130,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
            } catch (wmErr) {}
            page.drawText("UDAYAM-BR-26-0028550", {
              x: 330,
              y: 805,
              size: 14,
              color: rgb(1, 1, 1),
              font,
            });
            page.drawText("GSTIN: 22ABCDE1234F1Z5", {
              x: 330,
              y: 785,
              size: 14,
              color: rgb(1, 1, 1),
              font,
            });
            page.drawRectangle({
              x: 0,
              y: 750,
              width: 595,
              height: 30,
              color: rgb(0.9, 0.9, 0.9),
            });
          } catch (err) {
            // ignore header errors
          }

          const yPositions = [740, 390];

          for (let cell = 0; cell < 2; cell++) {
            const item = items[i + cell];
            if (!item) continue;

            const x = 50;
            const yTop = yPositions[cell];

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x,
              y: yTop,
              size: 12,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(pdfDoc, item.url);
            if (embedded) {
              const cellMaxW = 500;
              const cellMaxH = 320;
              const { width, height } = embedded.scale(1);
              let drawW = cellMaxW;
              let drawH = (height / width) * drawW;
              if (drawH > cellMaxH) {
                drawH = cellMaxH;
                drawW = (width / height) * drawH;
              }
              const drawY = yTop - drawH - 10;
              page.drawImage(embedded, {
                x,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }
      };

      await addDocumentPages(pdfDoc, documentsToInclude || letter.documents);

      // add invoice page as final page if selected
      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg =
        letter.registrationNumber ||
        letter.vehicle?.registrationNumber ||
        letter._id;
      link.setAttribute("download", `OKM-SELL-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating Hindi PDF:", error);
      alert("Failed to generate Hindi PDF. Please try again.");
    }
  };

  const fillAndDownloadEnglishPdf = async (
    letter,
    documentsToInclude = null,
  ) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      await simulateProgress();

      // Start with empty PDF if letter is not selected, otherwise load template
      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("englishsell.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        // we'll add document pages first, then invoice as the final page
        const formattedLetter = {
          ...letter,
          buyerName1: letter.buyerName,
          buyerName2: letter.buyerName,
          saleDate: formatDate(letter.saleDate),
          saleTime: formatTime12Hour(letter.saleTime),
          amountInWords: formatIndianAmountInWords(letter.saleAmount),
          saleAmount: formatRupee(letter.saleAmount),
          todayTime: formatTime12Hour(letter.todayTime || "12:00"),
          previousDate: formatDate(
            letter.previousDate || letter.todayDate || new Date(),
          ),
          previousTime: formatTime12Hour(
            letter.previousTime || letter.todayTime || "12:00",
          ),
          vehiclekm: formatKm(letter.vehiclekm),
          sellerphone: letter.sellerphone || "9876543210",
          selleraadhar: letter.selleraadhar || "764465626571",
        };

        for (const [fieldName, position] of Object.entries(
          englishFieldPositions,
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
          } else if (
            fieldName !== "buyerPhone2" &&
            formattedLetter[fieldName]
          ) {
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
          const saleTextWidth = font.widthOfTextAtSize(saleText, 11);
          const offsetMultiplier = 3; // English template spacing
          page.drawText(formattedLetter.amountInWords, {
            x:
              xBase +
              saleTextWidth +
              offsetMultiplier * (englishFieldPositions.saleAmount.size / 2),
            y: yBase,
            size: 10,
            color: rgb(0, 0, 0),
            font,
          });
        }
      } else {
        // Create empty PDF if letter is not selected
        pdfDoc = await PDFDocument.create();
      }

      // Insert document pages (packed 2x2)
      const embedImageFromUrl = async (pdfDoc, url) => {
        try {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type") || "";
          const bytes = await res.arrayBuffer();
          if (contentType.includes("png")) return await pdfDoc.embedPng(bytes);
          return await pdfDoc.embedJpg(bytes);
        } catch (err) {
          console.warn("Failed to embed image from", url, err);
          return null;
        }
      };

      const addDocumentPages = async (pdfDoc, documentsObj) => {
        if (!documentsObj) return;
        const items = [];
        const rcItems = []; // Separate RC items

        // Collect RC items
        if (documentsObj.vehicleRC) {
          if (documentsObj.vehicleRC.front)
            rcItems.push({
              title: "Vehicle RC - Front",
              url: documentsObj.vehicleRC.front,
            });
          if (documentsObj.vehicleRC.back)
            rcItems.push({
              title: "Vehicle RC - Back",
              url: documentsObj.vehicleRC.back,
            });
        }

        // Collect Aadhaar documents based on upload mode
        const singleAadhaarItem = [];
        if (documentsObj.aadhaar) {
          const uploadMode = documentsObj.aadhaarUploadMode || "separate";

          if (uploadMode === "single") {
            // Single file mode: render full-page separately
            if (documentsObj.aadhaar.front) {
              singleAadhaarItem.push({
                title: "Aadhaar (Front and Back)",
                url: documentsObj.aadhaar.front,
              });
            }
          } else {
            // Separate mode: show front and back separately in 2-per-page layout
            if (documentsObj.aadhaar.front)
              items.push({
                title: "Aadhaar - Front",
                url: documentsObj.aadhaar.front,
              });
            if (
              documentsObj.aadhaar.back &&
              documentsObj.aadhaar.back !== documentsObj.aadhaar.front
            )
              items.push({
                title: "Aadhaar - Back",
                url: documentsObj.aadhaar.back,
              });
          }
        }
        if (documentsObj.pan)
          items.push({ title: "PAN Card", url: documentsObj.pan });
        if (documentsObj.deliveryPhoto || documentsObj.vehicleKM)
          items.push({
            title: "Delivery Photo",
            url: documentsObj.deliveryPhoto || documentsObj.vehicleKM,
          });
        if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
          documentsObj.vehiclePhotos.forEach((u, i) =>
            items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
          );
        }

        // Create first page with RC items (compact 2-column layout)
        if (rcItems.length > 0) {
          const page = pdfDoc.addPage([595, 842]);
          const margin = 40;
          const colWidth = (595 - 3 * margin) / 2;
          const colGap = margin;
          const maxHeight = 250;

          for (let i = 0; i < rcItems.length; i++) {
            const item = rcItems[i];
            const xPos = margin + i * (colWidth + colGap);
            const yTop = 700;

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x: xPos,
              y: yTop,
              size: 10,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(pdfDoc, item.url);
            if (embedded) {
              const { width, height } = embedded.scale(1);
              let drawW = colWidth - 20;
              let drawH = (height / width) * drawW;

              if (drawH > maxHeight) {
                drawH = maxHeight;
                drawW = (width / height) * drawH;
              }

              const centeredX = xPos + (colWidth - drawW) / 2;
              const drawY = yTop - drawH - 15;

              page.drawImage(embedded, {
                x: centeredX,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }

        // Render single Aadhaar as full page with header
        if (singleAadhaarItem.length > 0) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const item = singleAadhaarItem[0];

          try {
            const logoBytes = await fetch(logo1).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);
            page.drawRectangle({
              x: 0,
              y: 780,
              width: 595,
              height: 80,
              color: rgb(0.047, 0.098, 0.196),
            });
            page.drawImage(logoImg, {
              x: 50,
              y: 792 - 60,
              width: 120,
              height: 60,
            });
            page.drawText("OK Motors", {
              x: 190,
              y: 815,
              size: 14,
              font,
              color: rgb(255, 255, 255),
            });
          } catch (err) {}

          page.drawText(item.title, { x: 50, y: 720, size: 14, font });

          const embedded = await embedImageFromUrl(pdfDoc, item.url);
          if (embedded) {
            const pageWidth = 595;
            const margin = 50;
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = 660;

            const { width, height } = embedded.scale(1);
            let drawW = maxWidth;
            let drawH = (height / width) * drawW;

            if (drawH > maxHeight) {
              drawH = maxHeight;
              drawW = (width / height) * drawH;
            }

            const xPos = (pageWidth - drawW) / 2;
            const yPos = 690 - drawH;

            page.drawImage(embedded, {
              x: xPos,
              y: yPos,
              width: drawW,
              height: drawH,
            });
          }
        }

        // Add remaining documents (2 per page)
        for (let i = 0; i < items.length; i += 2) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          try {
            const logoBytes = await fetch(logo1).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);
            page.drawRectangle({
              x: 0,
              y: 780,
              width: 595,
              height: 80,
              color: rgb(0.047, 0.098, 0.196),
            });
            page.drawImage(logoImg, {
              x: 50,
              y: 792 - 60,
              width: 120,
              height: 60,
            });
            page.drawText("OK Motors", {
              x: 190,
              y: 815,
              size: 14,
              font,
              color: rgb(255, 255, 255),
            });
          } catch (err) {
            // ignore header errors
          }

          const yPositions = [740, 390];

          for (let cell = 0; cell < 2; cell++) {
            const item = items[i + cell];
            if (!item) continue;

            const x = 50;
            const yTop = yPositions[cell];

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x,
              y: yTop,
              size: 12,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(pdfDoc, item.url);
            if (embedded) {
              const cellMaxW = 500;
              const cellMaxH = 320;
              const { width, height } = embedded.scale(1);
              let drawW = cellMaxW;
              let drawH = (height / width) * drawW;
              if (drawH > cellMaxH) {
                drawH = cellMaxH;
                drawW = (width / height) * drawH;
              }
              const drawY = yTop - drawH - 10;
              page.drawImage(embedded, {
                x,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }
      };

      await addDocumentPages(pdfDoc, documentsToInclude || letter.documents);

      // add invoice page as final page if selected
      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg =
        letter.registrationNumber ||
        letter.vehicle?.registrationNumber ||
        letter._id;
      link.setAttribute("download", `OKM-SELL-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    }
  };
  const drawVehicleInvoice = async (page, pdfDoc, letter) => {
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
    try {
      page.drawText(
        "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
        { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font: boldFont },
      );
    } catch (e) {}
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

    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: 620,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

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
      },
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
      },
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
      },
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

    try {
      page.drawText(
        "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
        { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font: boldFont },
      );
    } catch (e) {}

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
        letter.saleAmount,
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
      },
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sell letter?")) {
      try {
        const token = localStorage.getItem("token");
        const isOnline = navigator.onLine;

        if (isOnline) {
          if (!token) {
            alert("You are not authenticated. Please login again.");
            logout();
            navigate("/login");
            return;
          }

          await axios.delete(`https://ok-motor-51l3.vercel.app/api/sell-letters/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setSellLetters(sellLetters.filter((letter) => letter._id !== id));
          alert("Sell letter deleted successfully!");
        } else {
          const offlineStorage = (await import("../services/offlineStorage"))
            .default;
          const result = await offlineStorage.deleteById("sellLetters", id);

          if (result.success) {
            setSellLetters(sellLetters.filter((letter) => letter._id !== id));
            alert(
              "Sell letter deleted from offline storage. Will sync when online.",
            );
          } else {
            throw new Error(
              result.error || "Failed to delete from offline storage",
            );
          }
        }
      } catch (error) {
        console.error("Error deleting sell letter:", error);

        if (error.response?.status === 401) {
          alert("Your session has expired. Please login again.");
          logout();
          navigate("/login");
        } else if (error.response?.status === 403) {
          alert("You don't have permission to delete this item.");
        } else {
          alert(
            `Failed to delete: ${
              error.response?.data?.message || error.message || "Unknown error"
            }`,
          );
        }
      }
    }
  };

  const handleEdit = (letter) => {
    navigate("/sell/create", { state: { editLetter: letter } });
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
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
      name: "Announcements",
      icon: Megaphone,
      path: "/announcements",
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
    {
      name: "Staff",
      icon: Users,
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
    {
      name: "Gallery",
      icon: ImageIcon,
      path: "/gallery/manage",
    },
    {
      name: "Vehicle History",
      icon: Bike,
      path: "/bike-history",
    },
    {
      name: "Letter Head",
      icon: FileText,
      path: "/letter-head/create",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
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

      {}
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

      {}
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
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading sell letters...</p>
              {}
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
                      <th style={styles.tableHeader}>Vehicle</th>
                      <th style={styles.tableHeader}>Vehicle Reg No</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Created By</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLetters.map((letter) => {
                      const changes = getChanges(letter);
                      return (
                        <React.Fragment key={letter._id}>
                          <tr style={styles.tableRow}>
                            <td style={styles.tableCell}>
                              {letter.buyerName}
                              {letter.version > 1 && (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#ff9800",
                                    marginLeft: "6px",
                                    fontWeight: "600",
                                  }}
                                >
                                  (v{letter.version})
                                </span>
                              )}
                            </td>
                            <td style={styles.tableCell}>
                              {letter.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>
                              {`${letter.vehicleName || ""} ${
                                letter.vehicleModel || ""
                              }`.trim()}
                            </td>
                            <td style={styles.tableCell}>
                              {letter.registrationNumber}
                            </td>
                            <td style={styles.tableCell}>
                              ₹
                              {new Intl.NumberFormat("en-IN").format(
                                letter.saleAmount,
                              )}
                            </td>
                            <td style={styles.tableCell}>
                              {formatDate(letter.createdAt)}
                              {letter.editedAt && (
                                <div
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#64748b",
                                    marginTop: "2px",
                                  }}
                                >
                                  Edited: {formatDate(letter.editedAt)}
                                </div>
                              )}
                            </td>
                            <td style={styles.tableCell}>
                              {letter.user && letter.user.role === "admin"
                                ? "admin"
                                : letter.user && letter.user.name
                                  ? letter.user.name
                                  : ""}
                            </td>
                            <td style={styles.tableCell}>
                              <button
                                onClick={() => {
                                  setSelectedLetter(letter);
                                  setLanguageAction("preview");
                                  setShowLanguageModal(true);
                                }}
                                style={styles.iconButton}
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
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
                          {letter.version > 1 && (
                            <tr
                              style={{
                                backgroundColor:
                                  changes && changes.length > 0
                                    ? "#fff8e1"
                                    : "#f5f5f5",
                              }}
                            >
                              <td
                                colSpan="8"
                                style={{
                                  padding: "12px 16px",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <div style={{ fontSize: "0.85rem" }}>
                                  <div
                                    style={{
                                      fontWeight: "600",
                                      color:
                                        changes && changes.length > 0
                                          ? "#f57c00"
                                          : "#757575",
                                      marginBottom: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    <RefreshCw size={14} />
                                    Changes from previous version:
                                  </div>
                                  {changes && changes.length > 0 ? (
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                          "repeat(auto-fit, minmax(300px, 1fr))",
                                        gap: "8px",
                                      }}
                                    >
                                      {changes.map((change, idx) => (
                                        <div
                                          key={idx}
                                          style={{
                                            padding: "6px 10px",
                                            backgroundColor: "#ffffff",
                                            borderRadius: "4px",
                                            border: "1px solid #ffe0b2",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontWeight: "600",
                                              color: "#424242",
                                              marginBottom: "3px",
                                            }}
                                          >
                                            {change.field}:
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "0.8rem",
                                              color: "#e53935",
                                            }}
                                          >
                                            <span
                                              style={{
                                                textDecoration: "line-through",
                                              }}
                                            >
                                              {change.oldValue}
                                            </span>
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "0.8rem",
                                              color: "#43a047",
                                              fontWeight: "500",
                                            }}
                                          >
                                            → {change.newValue}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        padding: "8px 12px",
                                        backgroundColor: "#ffffff",
                                        borderRadius: "4px",
                                        border: "1px solid #e0e0e0",
                                        color: "#757575",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      No changes detected from previous version
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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
                    setChosenLanguage("english");
                    setShowLanguageModal(false);
                    if (languageAction === "download") {
                      // initialize selections based on available documents
                      setDocSelections({
                        vehicleRC: !!selectedLetter.documents?.vehicleRC,
                        aadhaar: !!selectedLetter.documents?.aadhaar,
                        pan: !!selectedLetter.documents?.pan,
                        vehicleKM: !!(
                          selectedLetter.documents?.deliveryPhoto ||
                          selectedLetter.documents?.vehicleKM
                        ),
                        vehiclePhotos: !!(
                          selectedLetter.documents?.vehiclePhotos &&
                          selectedLetter.documents.vehiclePhotos.length
                        ),
                        letter: true,
                        invoice: true,
                      });
                      setShowDocumentModal(true);
                    } else if (languageAction === "preview") {
                      handleViewLetter(selectedLetter, "english");
                      setLanguageAction(null);
                    }
                  }}
                >
                  English PDF
                </button>
                <button
                  style={styles.hindiButton}
                  onClick={() => {
                    setChosenLanguage("hindi");
                    setShowLanguageModal(false);
                    if (languageAction === "download") {
                      setDocSelections({
                        vehicleRC: !!selectedLetter.documents?.vehicleRC,
                        aadhaar: !!selectedLetter.documents?.aadhaar,
                        pan: !!selectedLetter.documents?.pan,
                        vehicleKM: !!(
                          selectedLetter.documents?.deliveryPhoto ||
                          selectedLetter.documents?.vehicleKM
                        ),
                        vehiclePhotos: !!(
                          selectedLetter.documents?.vehiclePhotos &&
                          selectedLetter.documents.vehiclePhotos.length
                        ),
                        letter: true,
                        invoice: true,
                      });
                      setShowDocumentModal(true);
                    } else if (languageAction === "preview") {
                      handleViewLetter(selectedLetter, "hindi");
                      setLanguageAction(null);
                    }
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
        {showDocumentModal && selectedLetter && (
          <div style={styles.modalOverlay}>
            <div
              style={{
                ...styles.modalContent,
                maxWidth: "500px",
                padding: 0,
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  Select Items to Include
                </h3>
                <p
                  style={{
                    margin: "6px 0 0 0",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
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
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Main Documents
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      backgroundColor: docSelections.letter
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.letter ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.letter}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          letter: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Sell Letter
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      backgroundColor: docSelections.invoice
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.invoice ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.invoice}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          invoice: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Invoice
                    </span>
                  </label>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Supporting Documents
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      backgroundColor: docSelections.vehicleRC
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehicleRC ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehicleRC}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehicleRC: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle RC (Front/Back)
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      backgroundColor: docSelections.aadhaar
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.aadhaar ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.aadhaar}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          aadhaar: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Aadhaar (Front/Back)
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      backgroundColor: docSelections.pan
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.pan ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.pan}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          pan: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      PAN Card
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      marginBottom: "8px",
                      backgroundColor: docSelections.vehicleKM
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehicleKM ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehicleKM}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehicleKM: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle KM Photo
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.vehiclePhotos
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehiclePhotos ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehiclePhotos}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehiclePhotos: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle Photos
                    </span>
                  </label>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "16px 24px",
                  borderTop: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <button
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setShowDocumentModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => {
                    const buildFilteredDocs = (docs = {}, sel = {}) => {
                      const out = {
                        letter: sel.letter,
                        invoice: sel.invoice,
                      };
                      if (sel.vehicleRC && docs.vehicleRC)
                        out.vehicleRC = docs.vehicleRC;
                      if (sel.aadhaar && docs.aadhaar) {
                        out.aadhaar = docs.aadhaar;
                        out.aadhaarUploadMode = docs.aadhaarUploadMode;
                      }
                      if (sel.pan && docs.pan) out.pan = docs.pan;
                      if (
                        sel.vehicleKM &&
                        (docs.deliveryPhoto || docs.vehicleKM)
                      )
                        out.deliveryPhoto =
                          docs.deliveryPhoto || docs.vehicleKM;
                      if (sel.vehiclePhotos && docs.vehiclePhotos)
                        out.vehiclePhotos = docs.vehiclePhotos;
                      return out;
                    };

                    const filtered = buildFilteredDocs(
                      selectedLetter.documents,
                      docSelections,
                    );

                    setShowDocumentModal(false);
                    // trigger PDF generation based on chosen language
                    if (chosenLanguage === "hindi") {
                      fillAndDownloadHindiPdf(selectedLetter, filtered);
                    } else {
                      fillAndDownloadEnglishPdf(selectedLetter, filtered);
                    }
                  }}
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
        {showPreviewModal && previewLetter && previewPdfUrl && (
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
              setShowPreviewModal(false);
              if (previewPdfUrl) {
                URL.revokeObjectURL(previewPdfUrl);
                setPreviewPdfUrl(null);
              }
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                maxWidth: "900px",
                width: "100%",
                maxHeight: "90vh",
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
                  Sell Letter Preview
                </h2>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    if (previewPdfUrl) {
                      URL.revokeObjectURL(previewPdfUrl);
                      setPreviewPdfUrl(null);
                    }
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
                  overflow: "auto",
                  WebkitOverflowScrolling: "touch",
                  backgroundColor: "#525659",
                }}
              >
                <object
                  data={previewPdfUrl}
                  type="application/pdf"
                  style={{
                    width: "100%",
                    height: "calc(100vh - 220px)",
                    border: "none",
                  }}
                  aria-label="Sell Letter PDF Preview"
                >
                  <iframe
                    src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: "100%",
                      height: "calc(100vh - 220px)",
                      border: "none",
                    }}
                    title="Sell Letter PDF Preview"
                  />
                </object>
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
                    setShowPreviewModal(false);
                    if (previewPdfUrl) {
                      URL.revokeObjectURL(previewPdfUrl);
                      setPreviewPdfUrl(null);
                    }
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
        {}
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
      borderColor: "#088395",
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
    backgroundColor: "#088395",
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
    backgroundColor: "#EBF4F6",
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
    backgroundColor: "#088395",
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
      color: "#088395",
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
    backgroundColor: "rgba(8, 131, 149, 0.1)",
    color: "#088395",
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
    backgroundColor: "#088395",
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
    backgroundColor: "#37B7C3",
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
