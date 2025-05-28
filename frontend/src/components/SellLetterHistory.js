// SellLetterHistory.js
import React, { useState, useEffect, useContext } from "react";

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
  Trash2,
  X,
  Bike,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PDFDocument, rgb,StandardFonts } from "pdf-lib";
import logo from '../images/company.png';

import AuthContext from "../context/AuthContext";

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
  const { user } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Sell Letter History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [sellLetters, setSellLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingLetter, setEditingLetter] = useState(null);
  const navigate = useNavigate();
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
      try {
        setLoading(true);
        const response = await axios.get(
          `https://ok-motor.onrender.com/api/sell-letters/my-letters?page=${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setSellLetters(response.data);
        // Note: You'll need to update your backend to return pagination info
        // For now, we'll assume all letters are loaded at once
        setTotalPages(1);
      } catch (error) {
        console.error("Error fetching sell letters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellLetters();
  }, [currentPage]);

  const filteredLetters = sellLetters.filter(
    (letter) =>
      letter.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      letter.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (letter) => {
    try {
      const templateUrl = "/templates/sellletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Create vehicle invoice page
      const invoicePage = pdfDoc.addPage([595, 842]); // A4 size
      
      // Draw vehicle invoice content
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);
  
      // Format dates properly
      function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
  
      function formatTime(timeString) {
        if (!timeString) return "";
        return timeString.slice(0, 5); // Just get HH:MM
      }
  
      const formattedLetter = {
        ...letter,
        buyerName1: letter.buyerName, // For signature placeholders
        buyerName2: letter.buyerName, // For signature placeholders
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime(letter.saleTime),
        todayDate: formatDate(letter.todayDate || new Date()),
        todayTime: formatTime(letter.todayTime || "12:00"),
        previousDate: formatDate(
          letter.previousDate || letter.todayDate || new Date()
        ),
        previousTime: formatTime(
          letter.previousTime || letter.todayTime || "12:00"
        ),
        sellerphone: letter.sellerphone || "9876543210", // default if empty
        selleraadhar: letter.selleraadhar || "764465626571", // default if empty
      };
  
      // Field positions - should match SellLetterPDF.js
      const fieldPositions = {
        vehicleName: { x: 339, y: 702, size: 11 },
        vehicleModel: { x: 207, y: 682, size: 11 },
        vehicleColor: { x: 97, y: 682, size: 11 },
        registrationNumber: { x: 436, y: 682, size: 11 },
        chassisNumber: { x: 151, y: 662, size: 11 },
        engineNumber: { x: 362, y: 662, size: 11 },
        vehiclekm: { x: 160, y: 642, size: 11 },
        buyerName: { x: 75, y: 624, size: 11 },
        buyerFatherName: { x: 275, y: 624, size: 11 },
        buyerAddress: { x: 100, y: 604, size: 11 },
        buyerName1: { x: 252, y: 509, size: 11 },
        buyerName2: { x: 364, y: 470, size: 11 },
        saleDate: { x: 235, y: 584, size: 11 },
        saleTime: { x: 370, y: 584, size: 11 },
        saleAmount: { x: 460, y: 584, size: 11 },
        todayDate: { x: 260, y: 564, size: 11 },
        todayTime: { x: 420, y: 564, size: 11 },
        previousDate: { x: 373, y: 526, size: 11 },
        previousTime: { x: 482, y: 526, size: 11 },
        buyerPhone: { x: 110, y: 208, size: 11 },
        buyerAadhar: { x: 145, y: 190, size: 11 },
      };
  
      for (const [fieldName, position] of Object.entries(fieldPositions)) {
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
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sell_letter_${letter._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };
  
  // Add this function to the SellLetterHistory component
  const drawVehicleInvoice = async (page, pdfDoc, letter) => {
    // Embed fonts first
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo; // Use your imported logo
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
      color: rgb(0.047, 0.098, 0.196), // Dark blue
    });
    
    // Draw dealership header
    page.drawImage(logoImage, {
      x: 50,
      y: 800, // Adjust position as needed
      width: 100, // Adjust width as needed
      height: 50, // Adjust height as needed
    });
  
    // Draw tagline
    page.drawText("UDAYAM-BR-26-0028550", {
      x: 50,
      y: 790,
      size: 10,
      color: rgb(1, 1, 1),
      font: font,
    });
  
    // Draw address and contact info
    page.drawText("123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5", {
      x: 50,
      y: 770,
      size: 8,
      color: rgb(0.8, 0.8, 0.8),
      font: font,
    });
  
    // Invoice header with accent color
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
      color: rgb(0.047, 0.098, 0.196), // Dark blue
      font: boldFont,
    });
  
    // Invoice details section
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    
    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
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
  
    page.drawText(`Name: ${letter.buyerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Address: ${letter.buyerAddress || "N/A"}`, {
      x: 60,
      y: 650,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Phone: ${letter.buyerPhone || "N/A"}`, {
      x: 350,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Aadhar: ${letter.buyerAadhar || "N/A"}`, {
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
  
    const vehicleHeaders = ["Make", "Model", "Color", "Reg No", "Chassis", "Engine", "KM"];
    const vehicleHeaderPositions = [60, 120, 180, 240, 300, 380, 460];
    
    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: vehicleHeaderPositions[index],
        y: 596,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: boldFont,
      });
    });
  
    // Vehicle details row
    const vehicleValues = [
      letter.vehicleName || "N/A",
      letter.vehicleModel || "N/A", 
      letter.vehicleColor || "N/A",
      letter.registrationNumber || "N/A",
      letter.chassisNumber || "N/A",
      letter.engineNumber || "N/A",
      letter.vehiclekm ? `${letter.vehiclekm} km` : "N/A"
    ];
  
    vehicleValues.forEach((value, index) => {
      const truncatedValue = value.length > 12 ? value.substring(0, 12) + "..." : value;
      page.drawText(truncatedValue, {
        x: vehicleHeaderPositions[index],
        y: 575,
        size: 8,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });
  
    // Sale Information section
    page.drawText("SALE INFORMATION", {
      x: 50,
      y: 550,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
  
    page.drawText(`Sale Date: ${formatDate(letter.saleDate)}`, {
      x: 60,
      y: 530,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Sale Amount: Rs. ${letter.saleAmount || "0"}`, {
      x: 200,
      y: 530,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Payment: CASH`, {
      x: 350,
      y: 530,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    page.drawText(`Condition: ${letter.vehicleCondition === "running" ? "RUNNING" : "NOT RUNNING"}`, {
      x: 60,
      y: 510,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
  
    // Terms and Conditions section
    page.drawText("TERMS & CONDITIONS", {
      x: 50,
      y: 470,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
  
    const terms = [
      "1. No refunds after invoice billing, except for transfer issues reported within 15 days.",
      "2. A 3-month guarantee is provided on the entire engine",
      "3. Engine warranty extends from 6 months to 1 year for performance defects",
      "4. Clutch plate is not covered under any guarantee or warranty",
      "5. Monthly servicing during the 3-month guarantee is mandatory",
      "6. First 3 services are free, with minimal charges for oil and parts (excluding engine)",
      "7. Buyer must submit photocopies of the sell letter and transfer challan",
      "8. Defects must be reported within 24 hours of purchase to avoid repair charges",
      "9. Delay in transfer beyond 15 days incurs Rs. 7.5/day penalty",
      "10. Customer signature confirms acceptance of all terms",
    ];
  
    terms.forEach((term, index) => {
      page.drawText(term, {
        x: 60,
        y: 450 - index * 15,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
        font: font,
      });
    });
  
    // Signatures section
    page.drawLine({
      start: { x: 50, y: 295 },
      end: { x: 545, y: 295 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
  
    // Seller Signature
    page.drawText("Seller Signature", {
      x: 100,
      y: 275,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });
  
    page.drawLine({
      start: { x: 100, y: 270 },
      end: { x: 250, y: 270 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });
  
    // Buyer Signature (OK Motors)
    page.drawText("Authorized Signatory", {
      x: 350,
      y: 275,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });
  
    
  
    page.drawLine({
      start: { x: 350, y: 270 },
      end: { x: 500, y: 270 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });
  
    // Footer
    page.drawLine({
      start: { x: 50, y: 100 },
      end: { x: 545, y: 100 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
  
    page.drawText("Thank you for your business!", {
      x: 220,
      y: 80,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
  
    page.drawText("OK MOTORS | 123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210", {
      x: 180,
      y: 60,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
      font: font,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sell letter?")) {
      try {
        await axios.delete(`https://ok-motor.onrender.com/api/sell-letters/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setSellLetters(sellLetters.filter((letter) => letter._id !== id));
      } catch (error) {
        console.error("Error deleting sell letter:", error);
      }
    }
  };

  const handleEdit = (letter) => {
    setEditingLetter(letter);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };
  const handleSaveEdit = async (updatedLetter) => {
    try {
      const response = await axios.put(
        `https://ok-motor.onrender.com/api/sell-letters/${updatedLetter._id}`,
        updatedLetter,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      name: "Bike History",
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
  const actualPath = typeof path === 'function' ? path(user?.role) : path;
  navigate(actualPath);
};

  return (
    <div style={styles.container}>
      {/* Sidebar - same as SellLetterForm */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
           <img src={logo} alt="logo" style={{width: '12.5rem', height: '7.5rem', color: '#7c3aed'}} />
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
                      <th style={styles.tableHeader}>Vehicle</th>
                      <th style={styles.tableHeader}>Reg No.</th>
                      <th style={styles.tableHeader}>Buyer</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLetters.map((letter) => (
                      <tr key={letter._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          {letter.vehicleName} ({letter.vehicleModel})
                        </td>
                        <td style={styles.tableCell}>
                          {letter.registrationNumber}
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
    color: "#334155",
    fontSize: "0.875rem",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
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
};

export default SellLetterHistory;
