import React, { useState, useCallback } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import axios from "axios";
import {
  FileText,
  ArrowLeft,
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
  Bike
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock AuthContext for demo
const AuthContext = {
  user: { name: "John Admin" },
  logout: () => console.log("Logged out"),
};

const SellLetterForm = () => {
  const { user, logout } = AuthContext;
  const [activeMenu, setActiveMenu] = useState("Create Sell Letter");
  const [expandedMenus, setExpandedMenus] = useState({});
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
    buyerAadhar: "",
    buyerName1: "",
    buyerName2: "",
    vehicleCondition: "running",
    saleDate: new Date().toISOString().split("T")[0],
    saleTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    saleAmount: "",
    todayDate: new Date().toISOString().split("T")[0],
    todayTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    previousDate: new Date().toISOString().split("T")[0],
    previousTime: "",
    paymentMethod: "cash",
    sellerphone: "9876543210",
    selleraadhar: "764465626571",
    documentsVerified: true,
  });

  const [previewMode, setPreviewMode] = useState(false);
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
      path: "/admin",
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

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
    console.log("Navigate to:", path);
  };
  const saveToDatabase = async () => {
    try {
      setIsSaving(true);

      // Check if required fields are empty
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
        "http://localhost:2500/api/sell-letters",
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
    const savedSuccessfully = await saveToDatabase();
    if (savedSuccessfully) {
      await fillAndDownloadPdf();
    }
  };
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

  const fillAndDownloadPdf = async () => {
    try {
      const templateUrl = "/templates/sellletter.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];

      // Draw all fields
      for (const [fieldName, position] of Object.entries(fieldPositions)) {
        if (formData[fieldName] !== undefined && formData[fieldName] !== null) {
          // Handle boolean fields (like documentsVerified) differently
          const valueToDraw =
            typeof formData[fieldName] === "boolean"
              ? formData[fieldName]
                ? "Yes"
                : "No"
              : String(formData[fieldName]);

          page.drawText(valueToDraw, {
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
        "filled_sell_letter.pdf"
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
          <h2 style={styles.sidebarTitle}>Admin Panel</h2>
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
                    maxLength={11}
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
                    maxLength={18}
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
                    maxLength={15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle KM
                  </label>
                  <input
                    type="number"
                    name="vehiclekm"
                    value={formData.vehiclekm}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    maxLength={6}
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

            {/* Seller Information Section - Updated */}
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
                    Buyer Address
                  </label>
                  <input
                    type="text"
                    name="buyerAddress"
                    value={formData.buyerAddress}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Phone
                  </label>
                  <input
                    type="number"
                    name="buyerPhone"
                    value={formData.buyerPhone}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Aadhar
                  </label>
                  <input
                    type="number"
                    name="buyerAadhar"
                    value={formData.buyerAadhar}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            {/* Sale Details Section - Updated */}
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
                    All documents verified and satisfactory
                  </label>
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
                onClick={saveToDatabase}
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
