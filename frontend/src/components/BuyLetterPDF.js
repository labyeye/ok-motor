import React, { useState, useCallback, useContext } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import {
  FileText,
  ArrowLeft,
  User,
  Car,
  Download,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  Bike,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
const BuyLetterForm = () => {
  const { user } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Create Buy Letter");
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    sellerName: "",
    sellerFatherName: "",
    sellerCurrentAddress: "",
    vehicleName: "",
    vehicleModel: "",
    vehicleColor: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    vehiclekm: "",
    vehicleCondition: "running",
    buyerName: "",
    buyerFatherName: "",
    buyerCurrentAddress: "",
    saleDate: new Date().toISOString().split("T")[0],
    saleTime: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    saleAmount: "",
    paymentMethod: "cash",
    todayDate: new Date().toISOString().split("T")[0],
    todayTime: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    todayDate1: "",
    todayTime1: "",
    sellerName1: "",
    sellerFatherName1: "",
    sellerCurrentAddress1: "",
    buyerName1: "OK MOTORS",
    buyerFatherName1: "",
    buyerName2: "OK MOTORS",
    buyerCurrentAddress2: "PATNA BIHAR",
    documentsVerified1: true,
    selleraadhar: "",
    sellerpan: "",
    selleraadharphone: "",
    buyernames: "OK MOTORS",
    buyerphone: "9876543210",
    note: "",
  });
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
    // If the time is already in HH:mm format (from the time input), just return it
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
      return timeString;
    }
    // Otherwise, try to parse it as a Date object
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const [previewMode, setPreviewMode] = useState(false);
  const saveBuyLetter = async () => {
    try {
      setIsSaving(true);
      const response = await axios.post(
        "https://ok-motor.onrender.com/api/buy-letter",
        formData
      );
      alert("Buy letter saved successfully!");
      return response.data;
    } catch (error) {
      console.error("Error saving buy letter:", error);
      let errorMessage = "Failed to save buy letter. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      alert(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveAndDownload = async () => {
    const savedLetter = await saveBuyLetter();
    if (savedLetter) {
      await fillAndDownloadPdf();
    }
  };
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
      if (name === "sellerName") {
        newData.sellerName1 = value;
      }
      if (name === "sellerFatherName") {
        newData.sellerFatherName1 = value;
      }
      if (name === "sellerCurrentAddress") {
        newData.sellerCurrentAddress1 = value;
      }
      if (name === "buyerFatherName") {
        newData.buyerFatherName1 = value;
      }
      if (name === "buyerCurrentAddress") {
        newData.buyerCurrentAddress1 = value;
      }
      if (name === "todayDate") {
        newData.todayDate1 = formatDate(value);
      }
      if (name === "todayTime") {
        newData.todayTime1 = value;
      }

      return newData;
    });
  }, []);

  // In the menuItems array (around line 250 in BuyLetterPDF.js)
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
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  const handleMenuClick = (menuName, path) => {
  setActiveMenu(menuName);
  // Handle both string paths and function paths
  const actualPath = typeof path === 'function' ? path(user?.role) : path;
  navigate(actualPath);
};
  const fieldPositions = {
    sellerName: { x: 45, y: 630, size: 11 },
    sellerFatherName: { x: 330, y: 630, size: 11 },
    sellerCurrentAddress: { x: 54, y: 608, size: 11 },
    vehicleName: { x: 313, y: 586, size: 11 },
    vehicleModel: { x: 430, y: 586, size: 11 },
    vehicleColor: { x: 527, y: 586, size: 11 },
    registrationNumber: { x: 140, y: 565, size: 11 },
    chassisNumber: { x: 285, y: 565, size: 11 },
    engineNumber: { x: 465, y: 565, size: 11 },
    vehiclekm: { x: 80, y: 546, size: 11 },
    buyerName: { x: 286, y: 546, size: 11 },
    buyerFatherName: { x: 61, y: 527, size: 11 },
    buyerCurrentAddress: { x: 250, y: 527, size: 11 },
    saleDate: { x: 105, y: 507, size: 11 },
    saleTime: { x: 215, y: 507, size: 11 },
    saleAmount: { x: 305, y: 507, size: 11 },
    todayDate: { x: 520, y: 507, size: 11 },
    todayTime: { x: 61, y: 490, size: 11 },
    sellerName1: { x: 312, y: 470, size: 11 },
    sellerFatherName1: { x: 56, y: 451, size: 11 },
    buyerName1: { x: 335, y: 432, size: 11 },
    buyerFatherName1: { x: 56, y: 412, size: 11 },
    todayDate1: { x: 445, y: 451, size: 11 },
    todayTime1: { x: 535, y: 451, size: 11 },
    buyerName2: { x: 50, y: 372, size: 11 },
    buyerCurrentAddress2: { x: 230, y: 372, size: 11 },
    selleraadhar: { x: 403, y: 215, size: 10 },
    sellerpan: { x: 400, y: 195, size: 10 },
    selleraadharphone: { x: 426, y: 177, size: 10 },
    buyernames: { x: 400, y: 87, size: 10 },
    buyerphone: { x: 400, y: 70, size: 10 },
    note: { x: 60, y: 18, size: 10 },
  };

  const generateBlankPDF = async () => {
    try {
      const templateUrl = "/templates/buyletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfBytes = await PDFDocument.load(existingPdfBytes);
      const pdfBlob = new Blob([await pdfBytes.save()], {
        type: "application/pdf",
      });
      saveAs(pdfBlob, "blank_buy_letter.pdf");
    } catch (error) {
      console.error("Error generating blank PDF:", error);
      alert("Failed to generate blank PDF. Please try again.");
    }
  };

  const fillAndDownloadPdf = async () => {
    try {
      const hasData = Object.values(formData).some(
        (value) => value !== "" && value !== null && value !== undefined
      );

      if (!hasData) {
        await generateBlankPDF();
        return;
      }

      const templateUrl = "/templates/buyletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];
      const formattedData = {
        ...formData,
        todayDate1: formatDate(formData.todayDate),
        todayTime1: formatTime(formData.todayTime),

      };
  
      for (const [fieldName, position] of Object.entries(fieldPositions)) {
        if (formattedData[fieldName]) {
          page.drawText(String(formattedData[fieldName]), {
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
        "filled_buy_letter.pdf"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (previewMode) {
    return (
      <div className="form-preview-container">
        <div className="form-preview-header">
          <button onClick={() => setPreviewMode(false)} className="back-button">
            <ArrowLeft className="button-icon" /> Back to Edit
          </button>
          <div className="preview-actions">
            <button onClick={fillAndDownloadPdf} className="download-button">
              <Download className="button-icon" /> Download PDF
            </button>
          </div>
        </div>
        <div className="pdf-preview">
          <p>PDF Preview would show here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>OK MOTORS</h2>
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
            <h1 style={styles.pageTitle}>Create Buy Letter</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details to generate a vehicle purchase agreement
            </p>
          </div>

          <form className="form" style={styles.form}>
            {/* Seller Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} /> Seller Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Name
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Father's Name
                  </label>
                  <input
                    type="text"
                    name="sellerFatherName"
                    value={formData.sellerFatherName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Current Address
                  </label>
                  <input
                    type="text"
                    name="sellerCurrentAddress"
                    value={formData.sellerCurrentAddress}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Aadhar Number
                  </label>
                  <input
                    type="number"
                    name="selleraadhar"
                    value={formData.selleraadhar}
                    onChange={handleChange}
                    style={styles.formInput}
                    max={12}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller PAN Number
                  </label>
                  <input
                    type="text"
                    name="sellerpan"
                    value={formData.sellerpan}
                    onChange={handleChange}
                    style={styles.formInput}
                    max={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Aadhar Linked Phone
                  </label>
                  <input
                    type="number"
                    name="selleraadharphone"
                    value={formData.selleraadharphone}
                    onChange={handleChange}
                    style={styles.formInput}
                    max={10}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} /> Vehicle Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    name="vehicleName"
                    value={formData.vehicleName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Color
                  </label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    max={11}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    max={18}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Engine Number
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    max={15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Kilometers
                  </label>
                  <input
                    type="number"
                    name="vehiclekm"
                    value={formData.vehiclekm}
                    onChange={handleChange}
                    style={styles.formInput}
                    max={6}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Condition
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

            {/* Buyer Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} /> Buyer Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    name="buyerName"
                    value={formData.buyerName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Father's Name
                  </label>
                  <input
                    type="text"
                    name="buyerFatherName"
                    value={formData.buyerFatherName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Current Address
                  </label>
                  <input
                    type="text"
                    name="buyerCurrentAddress"
                    value={formData.buyerCurrentAddress}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Business Name
                  </label>
                  <input
                    type="text"
                    name="buyernames"
                    value={formData.buyernames}
                    onChange={handleChange}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Phone
                  </label>
                  <input
                    type="number"
                    name="buyerphone"
                    value={formData.buyerphone}
                    onChange={handleChange}
                    style={styles.formInput}
                    readOnly
                    max={10}
                  />
                </div>
              </div>
            </div>

            {/* Sale Details */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <IndianRupee style={styles.sectionIcon} /> Sale Details
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Sale Date
                  </label>
                  <input
                    type="date"
                    name="saleDate"
                    value={formData.saleDate}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Clock style={styles.formIcon} />
                    Sale Time
                  </label>
                  <input
                    type="time"
                    name="saleTime"
                    value={formData.saleTime}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Sale Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="saleAmount"
                    value={formData.saleAmount}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bankTransfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Today's Date
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
                    Today's Time
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

            {/* Additional Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <FileText style={styles.sectionIcon} /> Additional Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formCheckboxField}>
                  <input
                    type="checkbox"
                    name="documentsVerified1"
                    checked={formData.documentsVerified1}
                    onChange={handleChange}
                    style={styles.formCheckbox}
                  />
                  <label style={styles.formCheckboxLabel}>
                    <CheckCircle style={styles.formIcon} />
                    All documents verified and satisfactory (Line 2)
                  </label>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Note
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    style={styles.formTextarea}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                style={styles.previewButton}
              >
                <FileText style={styles.buttonIcon} /> Preview
              </button>
              <button
                type="button"
                onClick={saveBuyLetter}
                style={styles.saveButton}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                style={styles.downloadButton}
              >
                <Download style={styles.buttonIcon} /> Save & Download
              </button>
            </div>
          </form>
        </div>
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

  // Form Styles
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

export default BuyLetterForm;
