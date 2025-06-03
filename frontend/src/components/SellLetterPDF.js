import React, { useState, useCallback, useContext } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import axios from "axios";
import {
  User,
  FileSignature,
  Car,
  Download,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Bike,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";

import AuthContext from "../context/AuthContext";

const SellLetterForm = () => {
  const { user } = useContext(AuthContext);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [savedLetterData, setSavedLetterData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("Create Sell Letter");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [previewPdf, setPreviewPdf] = useState(null);
  const [previewLanguage, setPreviewLanguage] = useState("hindi");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleName: "",
    vehicleModel: "",
    vehicleColor: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    vehiclekm: "",
    buyerName: "",
    buyerFatherName: "",
    buyerAddress: "",
    buyerPhone: "",
    buyerPhone2: "",
    buyerAadhar: "",
    buyerName1: "",
    buyerName2: "",
    vehicleCondition: "running",
    saleDate: new Date().toISOString().split("T")[0],
    saleTime: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    saleAmount: "",
    todayDate: new Date().toISOString().split("T")[0],
    todayTime: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    previousDate: new Date().toISOString().split("T")[0],
    previousTime: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    paymentMethod: "cash",
    sellerphone: "9876543210",
    selleraadhar: "764465626571",
    witnessName: "",
    witnessPhone: "",
    documentsVerified: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "buyerName") {
        newData.buyerName1 = value;
        newData.buyerName2 = value;
      }
      if (name === "todayDate") {
        newData.previousDate = value;
      }
      if (name === "todayTime") {
        newData.previousTime = value;
      }

      return newData;
    });
  }, []);

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
      name: "Staff",
      icon: Users,
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
    {
      name: "Bike History",
      icon: Bike,
      path: "/bike-history",
    },
  ];
  const handlePreview = async (language = "hindi") => {
    try {
      setIsSaving(true);
      const templateUrl =
        language === "hindi"
          ? "/templates/sellletter.pdf"
          : "/templates/englishsell.pdf";

      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const formattedData = {
        ...formData,
        buyerName1: formData.buyerName,
        buyerName2: formData.buyerName,
        saleAmount: formatRupee(formData.saleAmount) || "0",
        amountInWords: formatIndianAmountInWords(formData.saleAmount),
        vehiclekm: formatKm(formData.vehiclekm) || "0",
        saleDate: formatDate(formData.saleDate),
        saleTime: formatTime(formData.saleTime),
        todayDate: formatDate(formData.todayDate || new Date()),
        todayTime: formatTime(formData.todayTime || "12:00"),
        previousDate: formatDate(
          formData.previousDate || formData.todayDate || new Date()
        ),
        previousTime: formatTime(
          formData.previousTime || formData.todayTime || "12:00"
        ),
      };
      const saleAmountText = formattedData.saleAmount || "";

      const saleAmountWidth =
        saleAmountText.length * (englishFieldPositions.saleAmount.size / 2);
      const amountInWordsX =
        englishFieldPositions.saleAmount.x +
        saleAmountWidth +
        1 * (englishFieldPositions.saleAmount.size / 1);

      pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: englishFieldPositions.saleAmount.y,
        size: englishFieldPositions.saleAmount.size,
        color: rgb(0, 0, 0),
      });
      const positions =
        language === "hindi" ? hindiFieldPositions : englishFieldPositions;

      for (const [fieldName, position] of Object.entries(positions)) {
        if (fieldName === "buyerPhone" && formattedData.buyerPhone) {
          const combinedPhones = `${formattedData.buyerPhone}${
            formattedData.buyerPhone2 ? ` , ${formattedData.buyerPhone2}` : ""
          }`;
          pdfDoc.getPages()[0].drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPreviewPdf(url);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewAndDownload = async (language) => {
    setShowPreviewModal(false);
    if (language === "hindi") {
      await fillAndDownloadHindiPdf();
    } else {
      await fillAndDownloadEnglishPdf();
    }
  };
  const formatIndianAmountInWords = (amount) => {
    if (isNaN(amount)) return "(Zero Rupees)";

    const num = parseFloat(amount);
    if (num === 0) return "(Zero Rupees)";

    // Handle very small amounts that might cause recursion issues
    if (num < 1) return "(Less Than One Rupee)";

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

    const convertLessThanThousand = (num) => {
  if (typeof num !== "number" || isNaN(num) || num <= 0) return "";

  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    return (
      tens[Math.floor(num / 10)] +
      (num % 10 !== 0 ? " " + units[num % 10] : "")
    );
  }
  return (
    units[Math.floor(num / 100)] +
    " Hundred" +
    (num % 100 !== 0 ? " and " + convertLessThanThousand(num % 100) : "")
  );
};


    const convert = (num) => {
      if (num <= 0) return "Zero";

      let result = "";
      const crore = Math.floor(num / 10000000);
      if (crore > 0) {
        result += convertLessThanThousand(crore) + " Crore ";
        num = num % 10000000;
      }

      const lakh = Math.floor(num / 100000);
      if (lakh > 0) {
        result += convertLessThanThousand(lakh) + " Lakh ";
        num = num % 100000;
      }

      const thousand = Math.floor(num / 1000);
      if (thousand > 0) {
        result += convertLessThanThousand(thousand) + " Thousand ";
        num = num % 1000;
      }

      const remainder = convertLessThanThousand(num);
      if (remainder) {
        result += remainder;
      }

      return result.trim();
    };
    return `(${convert(num)} Only)`;
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };
  const formatKm = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num / 100);
  };

  const formatRupee = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : `${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num / 100)}`;
  };
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hour, minute] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };
  const saveToDatabase = async () => {
    try {
      setIsSaving(true);
      const requiredFields = [
        "vehicleName",
        "vehicleModel",
        "vehicleColor",
        "registrationNumber",
        "chassisNumber",
        "engineNumber",
        "vehiclekm",
        "buyerName",
        "buyerFatherName",
        "buyerAddress",
        "buyerPhone",
        "buyerPhone2",
        "buyerAadhar",
        "saleAmount",
        "selleraadhar",
        "sellerphone",
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        alert(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        setIsSaving(false);
        return false;
      }

      const response = await axios.post(
        "https://ok-motor.onrender.com/api/sell-letters",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        alert("Sell letter saved successfully!");
        return true;
      }
    } catch (error) {
      console.error("Error saving sell letter:", error);
      if (error.response) {
        // Handle server validation errors
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors)
            .map((err) => err.message)
            .join("\n");
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(error.response.data.message || "Failed to save sell letter.");
        }
      } else {
        alert("Failed to save sell letter. Please try again.");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveAndDownload = async () => {
    try {
      setIsSaving(true);

      // First check if a record with this registration number exists
      const existingLetter = await axios.get(
        `https://ok-motor.onrender.com/api/sell-letters/by-registration?registrationNumber=${formData.registrationNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (existingLetter.data && existingLetter.data.length > 0) {
        setSavedLetterData(existingLetter.data[0]);
        setShowLanguageModal(true);
      } else {
        const savedLetter = await saveToDatabase();
        if (savedLetter) {
          setSavedLetterData(savedLetter);
          setShowLanguageModal(true);
        }
      }
    } catch (error) {
      console.error("Error checking/saving sell letter:", error);
      let errorMessage = "Failed to process sell letter. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  const hindiFieldPositions = {
    vehicleName: { x: 303, y: 690, size: 11 },
    vehicleModel: { x: 39, y: 668, size: 11 },
    vehicleColor: { x: 453, y: 690, size: 11 },
    registrationNumber: { x: 295, y: 668, size: 11 },
    chassisNumber: { x: 432, y: 668, size: 11 },
    engineNumber: { x: 87, y: 646, size: 11 },
    vehiclekm: { x: 308, y: 646, size: 11 },
    buyerName: { x: 40, y: 623, size: 11 },
    buyerFatherName: { x: 278, y: 623, size: 11 },
    buyerAddress: { x: 65, y: 600, size: 11 },
    buyerName1: { x: 102, y: 489, size: 11 },
    buyerName2: { x: 102, y: 445, size: 11 },
    saleDate: { x: 78, y: 578, size: 11 },
    saleTime: { x: 180, y: 578, size: 11 },
    saleAmount: { x: 273, y: 578, size: 11 },
    todayDate: { x: 210, y: 556, size: 11 },
    todayTime: { x: 322, y: 556, size: 11 },
    previousDate: { x: 243, y: 511, size: 11 },
    previousTime: { x: 361, y: 511, size: 11 },
    buyerPhone: { x: 85, y: 209, size: 11 },
    buyerPhone2: { x: 85, y: 209, size: 11 },
    buyerAadhar: { x: 110, y: 191, size: 11 },
    witnessName: { x: 70, y: 105, size: 11 },
    witnessPhone: { x: 70, y: 87, size: 11 },
  };

  const englishFieldPositions = {
    vehicleName: { x: 300, y: 680, size: 11 },
    vehicleModel: { x: 109, y: 660, size: 11 },
    vehicleColor: { x: 463, y: 680, size: 11 },
    registrationNumber: { x: 375, y: 660, size: 11 },
    chassisNumber: { x: 70, y: 640, size: 11 },
    engineNumber: { x: 279, y: 640, size: 11 },
    vehiclekm: { x: 471, y: 640, size: 11 },
    buyerName: { x: 185, y: 619, size: 11 },
    buyerFatherName: { x: 445, y: 619, size: 11 },
    buyerAddress: { x: 123, y: 599, size: 11 },
    buyerName1: { x: 120, y: 517, size: 11 },
    buyerName2: { x: 286, y: 482, size: 11 },
    saleDate: { x: 70, y: 578, size: 11 },
    saleTime: { x: 181, y: 578, size: 11 },
    saleAmount: { x: 285, y: 578, size: 11 },
    todayDate: { x: 156, y: 557, size: 11 },
    todayTime: { x: 291, y: 557, size: 11 },
    previousDate: { x: 240, y: 538, size: 11 },
    previousTime: { x: 340, y: 538, size: 11 },
    buyerPhone: { x: 120, y: 233, size: 11 },
    buyerPhone2: { x: 120, y: 233, size: 11 },
    buyerAadhar: { x: 142, y: 213, size: 11 },
    witnessName: { x: 115, y: 91, size: 11 },
    witnessPhone: { x: 115, y: 75, size: 11 },
  };

  const drawVehicleInvoice = async (page, pdfDoc) => {
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
      y: 744,
      width: 160,
      height: 130,
    });

    page.drawImage(logoImage, {
      x: 180,
      y: 430,
      width: 260,
      height: 220,
      opacity: 0.3,
    });
    page.drawImage(logoImage, {
      x: 150,
      y: 200,
      width: 330,
      height: 260,
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

    page.drawText(`Date: ${formatDate(formData.todayDate)}`, {
      x: 400,
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

    page.drawText(`Name: ${formData.buyerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    const lineHeight2 = 12;

    const address = formData.buyerAddress || "N/A";
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

    page.drawText(`Phone: ${formData.buyerPhone || "N/A"}`, {
      x: 350,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`, ${formData.buyerPhone2 || "N/A"}`, {
      x: 440,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Aadhar: ${formData.buyerAadhar || "N/A"}`, {
      x: 350,
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
      formData.vehicleName || "N/A",
      formData.vehicleModel || "N/A",
      formData.vehicleColor || "N/A",
      formData.registrationNumber || "N/A",
      formData.chassisNumber || "N/A",
      formData.engineNumber || "N/A",
      formData.vehiclekm ? `${formatKm(formData.vehiclekm)} km` : "N/A",
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
      y: 505,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Sale Date: ${formatDate(formData.saleDate)}`, {
      x: 60,
      y: 485,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(
      `Sale Amount: Rs. ${formatRupee(formData.saleAmount) || "0"}`,
      {
        x: 200,
        y: 485,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawText(
      `Payment: ${
        formData.paymentMethod ? formData.paymentMethod.toUpperCase() : "CASH"
      }`,
      {
        x: 350,
        y: 485,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );
    page.drawText(
      `Amount in Words: ${
        formatIndianAmountInWords(formData.saleAmount) || "N/A"
      }`,
      {
        x: 60,
        y: 465,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );

    page.drawText(
      `Condition: ${
        formData.vehicleCondition === "running" ? "RUNNING" : "NOT RUNNING"
      }`,
      {
        x: 60,
        y: 596,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      }
    );
    page.drawText("GUARRANTEE & WARRANTY CERTIFICATE", {
      x: 175,
      y: 420,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText("TERMS & CONDITIONS", {
      x: 50,
      y: 390,
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
        formData.saleAmount
      )} from ${formData.buyerName}.`,
    ];

    terms.forEach((term, index) => {
      page.drawText(term, {
        x: 60,
        y: 370 - index * 15,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: font,
      });
    });

    // Seller Signature
    page.drawText("Seller Signature", {
      x: 100,
      y: 125,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 140 },
      end: { x: 250, y: 140 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Authorized Signatory", {
      x: 350,
      y: 125,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 140 },
      end: { x: 500, y: 140 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Footer
    page.drawLine({
      start: { x: 50, y: 80 },
      end: { x: 545, y: 80 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your business!", {
      x: 220,
      y: 60,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd, Samanpura, Raja Bazar, Indrapuri, Patna, Bihar 800014",
      {
        x: 130,
        y: 40,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );
  };
  const handleInput = (e) => {
    const { name, value } = e.target;
    e.target.value = value.toUpperCase();
    handleChange(e);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fillAndDownloadHindiPdf = async () => {
    try {
      const templateUrl = "/templates/sellletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      function formatTime(timeString) {
        if (!timeString) return "";
        return timeString.slice(0, 5);
      }
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const formattedLetter = {
        ...formData,
        buyerName1: formData.buyerName,
        buyerName2: formData.buyerName,
        saleAmount: formatRupee(formData.saleAmount),
        amountInWords: formatIndianAmountInWords(formData.saleAmount),
        vehiclekm: formatKm(formData.vehiclekm),
        saleDate: formatDate(formData.saleDate),
        saleTime: formatTime(formData.saleTime),
        todayDate: formatDate(formData.todayDate || new Date()),
        todayTime: formatTime(formData.todayTime || "12:00"),
        previousDate: formatDate(
          formData.previousDate || formData.todayDate || new Date()
        ),
        previousTime: formatTime(
          formData.previousTime || formData.todayTime || "12:00"
        ),
      };

      for (const [fieldName, position] of Object.entries(hindiFieldPositions)) {
        if (formattedLetter[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      saveAs(
        new Blob([pdfBytes], { type: "application/pdf" }),
        `vehicle_sale_agreement_hindi_${
          formData.registrationNumber || "document"
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating Hindi PDF:", error);
      alert("Failed to generate Hindi PDF. Please try again.");
    }
  };

  const fillAndDownloadEnglishPdf = async () => {
    try {
      const templateUrl = "/templates/englishsell.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      function formatTime(timeString) {
        if (!timeString) return "";
        return timeString.slice(0, 5);
      }
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const formattedLetter = {
        ...formData,
        buyerName1: formData.buyerName,
        buyerName2: formData.buyerName,
        saleAmount: formData.saleAmount,
        amountInWords: formatIndianAmountInWords(formData.saleAmount),
        vehiclekm: formData.vehiclekm,
        saleDate: formatDate(formData.saleDate),
        saleTime: formatTime(formData.saleTime),
        todayDate: formatDate(formData.todayDate || new Date()),
        todayTime: formatTime(formData.todayTime || "12:00"),
        previousDate: formatDate(
          formData.previousDate || formData.todayDate || new Date()
        ),
        previousTime: formatTime(
          formData.previousTime || formData.todayTime || "12:00"
        ),
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
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      saveAs(
        new Blob([pdfBytes], { type: "application/pdf" }),
        `vehicle_sale_agreement_english_${
          formData.registrationNumber || "document"
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <img
            src={logo}
            alt="logo"
            style={{ width: "12.5rem", height: "7.5rem", color: "#7c3aed" }}
          />
          <p style={styles.sidebarSubtitle}>Welcome, {user?.name}</p>
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
            <h1 style={styles.pageTitle}>Create Sell Letter</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details to generate a vehicle purchase agreement
            </p>
          </div>

          <form className="form" style={styles.form}>
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} /> Vehicle Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Brand || वाहन का ब्रांड
                  </label>
                  <input
                    type="text"
                    name="vehicleName"
                    value={formData.vehicleName}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={30}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Model || वाहन का मॉडल
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={30}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Color || वाहन का रंग
                  </label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={30}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Registration Number || रजिस्ट्रेशन नंबर
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={11}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Chassis Number || चासिस नंबर
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={18}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Engine Number || इंजन नंबर
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    maxLength={15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle KM || वाहन किलोमीटर
                  </label>
                  <input
                    type="text"
                    name="vehiclekm"
                    value={
                      formData.vehiclekm === ""
                        ? ""
                        : new Intl.NumberFormat("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formData.vehiclekm) / 100)
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        vehiclekm: rawValue,
                      }));
                    }}
                    style={styles.formInput}
                    placeholder="e.g. 36,000.00"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Condition || वाहन की स्थिति
                  </label>
                  <select
                    name="vehicleCondition"
                    value={formData.vehicleCondition}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="running">Running</option>
                    <option value="notRunning">Not Running</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seller Information Section - Updated */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} /> Buyer Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Name || खरीददार का नाम
                  </label>
                  <input
                    type="text"
                    name="buyerName"
                    value={formData.buyerName}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={30}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Father's Name || खरीददार के पिता का नाम
                  </label>
                  <input
                    type="text"
                    name="buyerFatherName"
                    value={formData.buyerFatherName}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={16}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Address || खरीददार का पता
                  </label>
                  <input
                    type="text"
                    name="buyerAddress"
                    value={formData.buyerAddress}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={100}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Phone || खरीददार का फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="buyerPhone"
                    value={formData.buyerPhone}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        buyerPhone: rawValue,
                      }));
                    }}
                    style={styles.formInput}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Alternate Phone || खरीददार का वैकल्पिक फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="buyerPhone2"
                    value={formData.buyerPhone2}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        buyerPhone2: rawValue,
                      }));
                    }}
                    style={styles.formInput}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Aadhar || खरीददार का आधार नंबर
                  </label>
                  <input
                    type="text"
                    name="buyerAadhar"
                    value={formData.buyerAadhar}
                    onChange={(e) => {
                      let value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                      let formatted = value.match(/.{1,4}/g)?.join("-") || "";
                      setFormData((prev) => ({
                        ...prev,
                        buyerAadhar: formatted,
                      }));
                    }}
                    style={styles.formInput}
                    placeholder="1234-5678-9012"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Witness Name || गवाह का नाम
                  </label>
                  <input
                    type="text"
                    name="witnessName"
                    value={formData.witnessName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    maxLength={30}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Witness Phone || गवाह का फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="witnessPhone"
                    value={formData.witnessPhone}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        witnessPhone: rawValue,
                      }));
                    }}
                    style={styles.formInput}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <IndianRupee style={styles.sectionIcon} /> Sale Details
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Sale Date || बिक्री की तिथि
                  </label>
                  <input
                    type="date"
                    name="saleDate"
                    value={formData.saleDate}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Clock style={styles.formIcon} />
                    Sale Time || बिक्री का समय
                  </label>
                  <input
                    type="time"
                    name="saleTime"
                    value={formData.saleTime}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Sale Amount (₹) || बिक्री की राशि (₹)
                  </label>
                  <input
                    type="text"
                    name="saleAmount"
                    value={
                      formData.saleAmount === ""
                        ? ""
                        : new Intl.NumberFormat("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formData.saleAmount) / 100)
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        saleAmount: rawValue,
                      }));
                    }}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Payment Method || भुगतान की विधि
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formSelect}
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Upi</option>
                    <option value="bankTransfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Today's Date || आज की तिथि
                  </label>
                  <input
                    type="date"
                    name="todayDate"
                    value={formData.todayDate}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Clock style={styles.formIcon} />
                    Today's Time || आज का समय
                  </label>
                  <input
                    type="time"
                    name="todayTime"
                    value={formData.todayTime}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {/* Legal Terms Section - Updated */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <FileSignature style={styles.sectionIcon} /> Legal Terms
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formCheckboxField}>
                  <input
                    type="checkbox"
                    name="documentsVerified"
                    checked={formData.documentsVerified}
                    onChange={handleChange}
                    style={styles.formCheckbox}
                  />
                  <label style={styles.formCheckboxLabel}>
                    <CheckCircle style={styles.formIcon} />
                    All documents verified and satisfactory || सभी दस्तावेज
                    सत्यापित और संतोषजनक
                  </label>
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <select
                  value={previewLanguage}
                  onChange={(e) => setPreviewLanguage(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="hindi">Hindi Preview</option>
                  <option value="english">English Preview</option>
                </select>
                <button
                  type="button"
                  onClick={() => handlePreview(previewLanguage)}
                  style={styles.previewButton}
                  disabled={isSaving}
                >
                  <FileText style={styles.buttonIcon} /> Preview
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                style={styles.downloadButton}
                disabled={isSaving}
              >
                <Download style={styles.buttonIcon} /> Save & Download
              </button>
            </div>
          </form>
        </div>
        {showLanguageModal && (
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
                    fillAndDownloadEnglishPdf();
                    setShowLanguageModal(false);
                  }}
                >
                  English PDF
                </button>
                <button
                  style={styles.hindiButton}
                  onClick={() => {
                    fillAndDownloadHindiPdf();
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
        {showPreviewModal && (
          <div style={styles.modalOverlay}>
            <div
              style={{
                ...styles.modalContent,
                maxWidth: "90%",
                width: "800px",
              }}
            >
              <h3 style={styles.modalTitle}>
                Document Preview -{" "}
                {previewLanguage === "hindi" ? "Hindi" : "English"}
              </h3>
              <div
                style={{ height: "70vh", width: "100%", marginBottom: "20px" }}
              >
                {previewPdf ? (
                  <iframe
                    src={previewPdf}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "1px solid #e2e8f0",
                    }}
                    title="PDF Preview"
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#64748b",
                    }}
                  >
                    Loading preview...
                  </div>
                )}
              </div>
              <div style={styles.modalButtons}>
                <button
                  style={styles.englishButton}
                  onClick={() => handlePreviewAndDownload("english")}
                >
                  Download English PDF
                </button>
                <button
                  style={styles.hindiButton}
                  onClick={() => handlePreviewAndDownload("hindi")}
                >
                  Download Hindi PDF
                </button>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowPreviewModal(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
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

  // Sidebar Styles
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
    borderBottom: "1px solid #334155",
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
      backgroundColor: "#334155",
    },
  },
  menuItemActive: {
    backgroundColor: "#334155",
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
    borderTop: "1px solid #334155",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#7f1d1d20",
    },
  },

  // Main Content Styles
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
  form: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "32px",
    border: "1px solid #e2e8f0",
  },
  formSection: {
    marginBottom: "40px",
    paddingBottom: "24px",
    borderBottom: "1px solid #e2e8f0",
    ":last-child": {
      borderBottom: "none",
      marginBottom: "0",
    },
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionIcon: {
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  formField: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#334155",
    marginBottom: "8px",
  },
  formIcon: {
    width: "18px",
    height: "18px",
    color: "#64748b",
  },
  formInput: {
    width: "90%",
    padding: "10px 12px",
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

  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#059669",
    },
    ":disabled": {
      backgroundColor: "#6ee7b7",
      cursor: "not-allowed",
    },
  },
  formSelect: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "1em",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },
  formTextarea: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    minHeight: "80px",
    resize: "vertical",
    transition: "all 0.2s ease",
    backgroundColor: "#f8fafc",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },
  formCheckboxField: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  formCheckbox: {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
  },
  formCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#334155",
    cursor: "pointer",
  },

  // Action Buttons
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "32px",
  },
  previewButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#f1f5f9",
      borderColor: "#94a3b8",
    },
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
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
  buttonIcon: {
    width: "16px",
    height: "16px",
  },

  // Preview Mode Styles
  formPreviewContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "32px",
  },
  formPreviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  previewActions: {
    display: "flex",
    gap: "16px",
  },
  pdfPreview: {
    minHeight: "500px",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
};

export default SellLetterForm;
