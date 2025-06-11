// BuyLetterHistory.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  Bike,
  Trash2,
  X,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";

import AuthContext from "../context/AuthContext";

const EditBuyLetterModal = ({ letter, onClose, onSave }) => {
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
          <h2 style={modalStyles.title}>Edit Buy Letter</h2>
          <button onClick={onClose} style={modalStyles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Seller Information */}
          <div style={modalStyles.formSection}>
            <h2 style={modalStyles.sectionTitle}>Seller Information</h2>
            <div style={modalStyles.formGrid}>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>Seller Name</label>
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>
                  Seller Father's Name
                </label>
                <input
                  type="text"
                  name="sellerFatherName"
                  value={formData.sellerFatherName}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
              <div style={modalStyles.formField}>
                <label style={modalStyles.formLabel}>
                  Seller Current Address
                </label>
                <input
                  type="text"
                  name="sellerCurrentAddress"
                  value={formData.sellerCurrentAddress}
                  onChange={handleChange}
                  style={modalStyles.formInput}
                  required
                />
              </div>
            </div>
          </div>

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

const BuyLetterHistory = () => {
  const { user } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Buy Letter History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [buyLetters, setBuyLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingLetter, setEditingLetter] = useState(null);
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  useEffect(() => {
    const fetchBuyLetters = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://ok-motor.onrender.com/api/buy-letter?page=${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("API Response:", response.data);
        setBuyLetters(response.data.buyLetters);
        setTotalPages(response.data.pages);
      } catch (error) {
        console.error("Error details:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyLetters();
  }, [currentPage]);

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
    // Add the conditional check here
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

  const filteredLetters = buyLetters.filter(
    (letter) =>
      letter.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };
  const englishFieldPositions = {
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
    selleraadhar: { x: 403, y: 223, size: 10 },
    sellerpan: { x: 403, y: 207, size: 10 },
    selleraadharphone: { x: 426, y: 192, size: 10 },
    selleraadharphone2: { x: 490, y: 192, size: 10 },
    witnessname: { x: 400, y: 96, size: 10 },
    witnessphone: { x: 400, y: 80, size: 10 },
    note: { x: 60, y: 18, size: 10 },
    returnpersonname: { x: 332, y: 298, size: 10 },
  };

  const fieldPositions = {
    sellerName: { x: 34, y: 651, size: 11 },
    sellerFatherName: { x: 322, y: 651, size: 11 },
    sellerCurrentAddress: { x: 50, y: 629, size: 11 },
    vehicleName: { x: 233, y: 610, size: 11 },
    vehicleModel: { x: 372, y: 610, size: 11 },
    vehicleColor: { x: 531, y: 610, size: 11 },
    registrationNumber: { x: 142, y: 591, size: 11 },
    chassisNumber: { x: 289, y: 591, size: 11 },
    engineNumber: { x: 464, y: 591, size: 11 },
    vehiclekm: { x: 81, y: 573, size: 11 },
    buyerName: { x: 345, y: 573, size: 11 },
    buyerFatherName: { x: 55, y: 554, size: 11 },
    buyerCurrentAddress: { x: 249, y: 554, size: 11 },
    saleDate: { x: 103, y: 536, size: 11 },
    saleTime: { x: 200, y: 536, size: 11 },
    saleAmount: { x: 297, y: 536, size: 11 },
    todayDate: { x: 176, y: 517, size: 11 },
    todayTime: { x: 300, y: 517, size: 11 },
    sellerName1: { x: 26, y: 480, size: 11 },
    sellerFatherName1: { x: 292, y: 480, size: 11 },
    buyerName1: { x: 26, y: 442, size: 11 },
    buyerFatherName1: { x: 334, y: 442, size: 11 },
    todayDate1: { x: 95, y: 460, size: 11 },
    todayTime1: { x: 192, y: 460, size: 11 },
    dealername: { x: 256, y: 405, size: 11 },
    dealeraddress: { x: 27, y: 385, size: 11 },
    selleraadhar: { x: 393, y: 245, size: 10 },
    sellerpan: { x: 391, y: 225, size: 10 },
    selleraadharphone: { x: 405, y: 206, size: 10 },
    selleraadharphone2: { x: 455, y: 206, size: 10 },
    witnessname: { x: 390, y: 119, size: 10 },
    witnessphone: { x: 390, y: 105, size: 10 },
    returnpersonname: { x: 427, y: 350, size: 10 },
    note: { x: 60, y: 18, size: 10 },
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
      if (num === 0) return "";
      if (num < 10) return units[num];
      if (num < 20) return teens[num - 10];
      if (num < 100)
        return (
          tens[Math.floor(num / 10)] +
          (num % 10 !== 0 ? " " + units[num % 10] : "")
        );
      return (
        units[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 !== 0 ? " and " + convertLessThanThousand(num % 100) : "")
      );
    };

    const convert = (num) => {
      if (num === 0) return "Zero Rupees";
      let result = "";
      const crore = Math.floor(num / 10000000);
      if (crore > 0) {
        result += convertLessThanThousand(crore) + " Crore ";
        num %= 10000000;
      }
      const lakh = Math.floor(num / 100000);
      if (lakh > 0) {
        result += convertLessThanThousand(lakh) + " Lakh ";
        num %= 100000;
      }
      const thousand = Math.floor(num / 1000);
      if (thousand > 0) {
        result += convertLessThanThousand(thousand) + " Thousand ";
        num %= 1000;
      }
      const remainder = convertLessThanThousand(num);
      if (remainder) {
        result += remainder;
      }

      return result.trim() + " Only";
    };

    return convert(num);
  };

  const formatRupee = (val) => {
    const num = parseFloat(val);
    return isNaN(num)
      ? "0.00"
      : `Rs. ${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };

  const formatKm = (val) => {
    const num = parseFloat(val);
    return isNaN(num)
      ? "0.00"
      : new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
  };

  const formatAadhar = (val) =>
    val
      .replace(/\D/g, "")
      .match(/.{1,4}/g)
      ?.join("-") || "";

  const downloadHindiPDF = async (letter) => {
    try {
      const templateUrl = "/templates/buyletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Load and embed company logo (updated positioning)
      const logoUrl = logo1;
      const logoImageBytes = await fetch(logoUrl).then((res) =>
        res.arrayBuffer()
      );
      const logoImage = await pdfDoc.embedPng(logoImageBytes);

      // Get first page and add logo (matching BuyLetterPDF.js positioning)
      const firstPage = pdfDoc.getPages()[0];
      firstPage.drawImage(logoImage, {
        x: 200,
        y: 680,
        width: 205,
        height: 155,
        opacity: 0.9,
        rotate: degrees(0),
      });

      // Format all data for PDF
      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        sellerName1: letter.sellerName,
        sellerFatherName1: letter.sellerFatherName,
        buyerFatherName1: letter.buyerFatherName,
        buyerCurrentAddress1: letter.buyerCurrentAddress,
        todayDate1: formatDate(letter.todayDate),
        todayTime1: letter.todayTime,
        buyerCurrentAddress2: "PATNA BIHAR",
        saleDate: formatDate(letter.saleDate),
        todayDate: formatDate(letter.todayDate),
        todayDate1: formatDate(letter.todayDate),
        saleAmount: formatRupee(letter.saleAmount),
        vehiclekm: formatKm(letter.vehiclekm),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),
      };

      // Fill all form fields
      for (const [fieldName, position] of Object.entries(fieldPositions)) {
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
        saleAmountText.length * (fieldPositions.saleAmount.size / 2);
      const amountInWordsX =
        fieldPositions.saleAmount.x +
        saleAmountWidth +
        1.4 * (fieldPositions.saleAmount.size / 2);

      pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: fieldPositions.saleAmount.y,
        size: fieldPositions.saleAmount.size,
        color: rgb(0, 0, 0),
      });
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `buy_letter_${letter._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const downloadEnglishPDF = async (letter) => {
    try {
      const englishTemplateUrl = "/templates/englishbuyletter.pdf";
      const existingPdfBytes = await fetch(englishTemplateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const logoUrl = logo1;
      const logoImageBytes = await fetch(logoUrl).then((res) =>
        res.arrayBuffer()
      );
      const logoImage = await pdfDoc.embedPng(logoImageBytes);
      const firstPage = pdfDoc.getPages()[0];
      firstPage.drawImage(logoImage, {
        x: 200,
        y: 680,
        width: 205,
        height: 155,
        opacity: 0.9,
        rotate: degrees(0),
      });
      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        sellerName1: letter.sellerName,
        sellerFatherName1: letter.sellerFatherName,
        buyerFatherName1: letter.buyerFatherName,
        buyerCurrentAddress1: letter.buyerCurrentAddress,
        todayDate1: formatDate(letter.todayDate),
        todayTime1: letter.todayTime,
        buyerCurrentAddress2: "PATNA BIHAR",
        saleDate: formatDate(letter.saleDate),
        todayDate: formatDate(letter.todayDate),
        todayDate1: formatDate(letter.todayDate),
        saleAmount: formatRupee(letter.saleAmount),
        vehiclekm: formatKm(letter.vehiclekm),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),
      };
      for (const [fieldName, position] of Object.entries(
        englishFieldPositions
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
        saleAmountText.length * (englishFieldPositions.saleAmount.size / 2);
      const amountInWordsX =
        englishFieldPositions.saleAmount.x +
        saleAmountWidth +
        3 * (englishFieldPositions.saleAmount.size / 2);

      pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: englishFieldPositions.saleAmount.y,
        size: englishFieldPositions.saleAmount.size,
        color: rgb(0, 0, 0),
      });

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `buy_letter_english_${letter._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    }
  };
  const handleDownload = (letter) => {
    setSelectedLetter(letter);
    setShowLanguageModal(true);
  };
  const drawVehicleInvoice = async (page, pdfDoc, letter) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1;
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    // Header with logo
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

    // Divider line
    page.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Customer Information section
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
    page.drawText("Condition: " + (letter.vehicleCondition || "N/A"), {
      x: 60,
      y: 597,
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
        y: 570,
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
      let yPos = 555;

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

    // Terms and Conditions section
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

    // Seller Signature
    page.drawText("Seller Signature", {
      x: 110,
      y: 170,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 185 },
      end: { x: 250, y: 185 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Authorized Signatory", {
      x: 350,
      y: 170,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 185 },
      end: { x: 500, y: 185 },
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
      "OK MOTORS | Pillar num.53, Bailey Rd, Samanpura, Raja Bazar, Indrapuri, Patna, Bihar 800014",
      {
        x: 130,
        y: 30,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      }
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this buy letter?")) {
      try {
        await axios.delete(`https://ok-motor.onrender.com/api/buy-letter/${id}`);
        setBuyLetters(buyLetters.filter((letter) => letter._id !== id));
      } catch (error) {
        console.error("Error deleting buy letter:", error);
      }
    }
  };

  const handleEdit = (letter) => {
    setEditingLetter(letter);
  };

  const handleSaveEdit = async (updatedLetter) => {
    try {
      const response = await axios.put(
        `https://ok-motor.onrender.com/api/buy-letter/${updatedLetter._id}`,
        updatedLetter
      );
      setBuyLetters(
        buyLetters.map((letter) =>
          letter._id === updatedLetter._id ? response.data : letter
        )
      );
      setEditingLetter(null);
    } catch (error) {
      console.error("Error updating buy letter:", error);
    }
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
            <h1 style={styles.pageTitle}>Buy Letter History</h1>
            <p style={styles.pageSubtitle}>
              View and manage all your generated buy letters
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search buy letters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button
              style={styles.newLetterButton}
              onClick={() => navigate("/buy/create")}
            >
              <FileText size={16} style={styles.buttonIcon} />
              New Buy Letter
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No buy letters found</p>
            </div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Seller Name</th>
                      <th style={styles.tableHeader}>Vehicle</th>
                      <th style={styles.tableHeader}>Buyer Name</th>
                      <th style={styles.tableHeader}>Sale Amount</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLetters.map((letter) => (
                      <tr key={letter._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{letter.sellerName}</td>
                        <td style={styles.tableCell}>
                          {letter.vehicleName} ({letter.registrationNumber})
                        </td>
                        <td style={styles.tableCell}>{letter.buyerName}</td>
                        <td style={styles.tableCell}>₹{letter.saleAmount}</td>
                        <td style={styles.tableCell}>
                          {new Date(letter.createdAt).toLocaleDateString()}
                        </td>

                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleDownload(letter)}
                            style={styles.iconButton}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {/* Only show Edit and Delete buttons if user is not staff */}
                          {user?.role !== "staff" && (
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
      </div>
      {showLanguageModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h2 style={modalStyles.title}>Select PDF Language</h2>
              <button
                onClick={() => setShowLanguageModal(false)}
                style={modalStyles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ marginBottom: "24px", color: "#64748b" }}>
                Choose the language for your buy letter:
              </p>
              <div
                style={{ display: "flex", gap: "16px", marginBottom: "24px" }}
              >
                <button
                  onClick={() => {
                    downloadEnglishPDF(selectedLetter);
                    setShowLanguageModal(false);
                  }}
                  style={{
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
                  }}
                >
                  English PDF
                </button>
                <button
                  onClick={() => {
                    downloadHindiPDF(selectedLetter);
                    setShowLanguageModal(false);
                  }}
                  style={{
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
                  }}
                >
                  Hindi PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLetter && (
        <EditBuyLetterModal
          letter={editingLetter}
          onClose={() => setEditingLetter(null)}
          onSave={handleSaveEdit}
        />
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
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 40px",
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  },
  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    color: "#64748b",
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
    color: "#334155",
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
    color: "#334155",
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
    color: "#334155",
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
  pageInfo: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
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
      color: "#334155",
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
    color: "#334155",
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
    color: "#334155",
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

export default BuyLetterHistory;
