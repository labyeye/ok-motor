import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  ShipWheel,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  RefreshCw,
  Megaphone,
  Image as ImageIcon,
  Bike,
  Menu,
  X,
  Shield,
  Save,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";

const InsuranceForm = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [editId, setEditId] = useState(null);
  const [, setIsFetching] = useState(false);

  const [activeMenu, setActiveMenu] = useState("Insurance");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    personName: "",
    personPhone: "",
    personEmail: "",
    vehicleModel: "",
    brand: "",
    year: "",
    regNo: "",
    insurancePolicyNo: "",
    insuranceCompany: "",
    insuranceExpiry: "",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    if (location.state && location.state.insuranceData) {
      const data = location.state.insuranceData;
      setEditId(data._id);
      setFormData({
        personName: data.personName || "",
        personPhone: data.personPhone || "",
        personEmail: data.personEmail || data.email || "",
        vehicleModel: data.vehicleModel || "",
        brand: data.brand || "",
        year: data.year || "",
        regNo: data.regNo || "",
        insurancePolicyNo: data.insurancePolicyNo || "",
        insuranceCompany: data.insuranceCompany || "",
        insuranceExpiry: data.insuranceExpiry
          ? new Date(data.insuranceExpiry).toISOString().split("T")[0]
          : "",
      });
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegNoKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const reg = formData.regNo?.trim();
    if (!reg) return;

    try {
      setIsFetching(true);
      const token = localStorage.getItem("token");

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [vehicleRes, insuranceRes] = await Promise.all([
        axios
          .get(
            `${API_BASE_URL}/sell-letters/vehicle-details?registrationNumber=${encodeURIComponent(
              reg,
            )}`,
            { headers },
          )
          .catch(() => null),
        axios
          .get(`${API_BASE_URL}/insurance/vehicle/${encodeURIComponent(reg)}`, {
            headers,
          })
          .catch(() => null),
        axios
          .get(`${API_BASE_URL}/puc/vehicle/${encodeURIComponent(reg)}`, {
            headers,
          })
          .catch(() => null),
      ]);

      const vehicleData = vehicleRes?.data || {};
      const insData = insuranceRes?.data || {};

      setFormData((prev) => ({
        ...prev,

        personName:
          insData.personName || vehicleData.personName || prev.personName,
        personPhone:
          insData.personPhone || vehicleData.personPhone || prev.personPhone,
        personEmail:
          insData.personEmail || vehicleData.personEmail || prev.personEmail,

        vehicleModel:
          insData.vehicleModel || vehicleData.vehicleModel || prev.vehicleModel,
        brand: insData.brand || vehicleData.brand || prev.brand,
        year: insData.year || vehicleData.year || prev.year,

        insuranceCompany:
          insData.insuranceCompany ||
          vehicleData.insuranceCompany ||
          prev.insuranceCompany,
        insurancePolicyNo:
          insData.insurancePolicyNumber ||
          insData.insurancePolicyNo ||
          vehicleData.insurancePolicyNumber ||
          prev.insurancePolicyNo,
        insuranceExpiry: insData.insuranceExpiryDate
          ? new Date(insData.insuranceExpiryDate).toISOString().split("T")[0]
          : vehicleData.insuranceExpiryDate
            ? new Date(vehicleData.insuranceExpiryDate)
                .toISOString()
                .split("T")[0]
            : prev.insuranceExpiry,
      }));
    } catch (err) {
      console.error("Failed to fetch vehicle details:", err);
      alert(
        err.response?.data?.message || "No data found for this registration",
      );
    } finally {
      setIsFetching(false);
    }
  };

  const API_BASE_URL = "https://ok-motor-51l3.vercel.app/api";

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please login again.");
        logout();
        navigate("/login");
        return;
      }

      if (editId) {
        await axios.put(`${API_BASE_URL}/insurance/${editId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        alert("Insurance record updated successfully!");
        navigate("/insurance/history");
      } else {
        await axios.post(`${API_BASE_URL}/insurance`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        alert("Insurance record saved successfully!");
        setFormData({
          personName: "",
          personPhone: "",
          personEmail: "",
          vehicleModel: "",
          brand: "",
          year: "",
          regNo: "",
          insurancePolicyNo: "",
          insuranceCompany: "",
          insuranceExpiry: "",
        });
      }
    } catch (error) {
      console.error("Error saving insurance:", error);
      alert(error.response?.data?.message || "Failed to save insurance record");
    } finally {
      setIsSaving(false);
    }
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
      name: "Insurance",
      icon: Shield,
      submenu: [
        { name: "Add Insurance", path: "/insurance/create" },
        { name: "Insurance List", path: "/insurance/history" },
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#EBF4F6",
      fontFamily: "'Inter', sans-serif",
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
      transition: "transform 0.3s ease-in-out",
    },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 14,
    },
    topBar: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "60px",
      backgroundColor: "#fff",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      zIndex: 14,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
    },
    hamburgerMenu: {
      cursor: "pointer",
      color: "#1e293b",
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
      backgroundColor: "#051238",
      overflow: "hidden",
    },
    submenuItem: {
      padding: "10px 24px 10px 64px",
      cursor: "pointer",
      color: "#cbd5e1",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
    },
    submenuItemActive: {
      color: "#37B7C3",
      fontWeight: "500",
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
    },
    mainContent: {
      flex: 1,
      overflowY: "auto",
      height: "100vh",
      backgroundColor: "#ffffffff",
    },
    contentPadding: {
      padding: isMobile ? "24px 16px" : "32px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "16px",
    },
    titleGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#0f172a",
      margin: 0,
    },
    formCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      padding: isMobile ? "20px" : "32px",
      marginBottom: "32px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "24px",
      marginBottom: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    input: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
      color: "#1e293b",
      transition: "border-color 0.2s",
      width: "100%",
      boxSizing: "border-box",
    },
    button: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 24px",
      backgroundColor: "#088395",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      minWidth: "200px",
    },
    buttonDisabled: {
      backgroundColor: "#94a3b8",
      cursor: "not-allowed",
    },
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "60px" : "0",
      }}
    >
      {}
      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {}
      <div
        style={{
          ...styles.topBar,
          display: isMobile && !isSidebarOpen ? "flex" : "none",
        }}
      >
        <div
          style={styles.hamburgerMenu}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
      </div>

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
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
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
          <p
            className="sidebar-subtitle"
            style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: "4px" }}
          >
            Welcome, {user?.name || "User"}
          </p>
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
          {}
          <div style={styles.header}>
            <div style={styles.titleGroup}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={24} />
              </div>
              <h1 style={styles.title}>
                {editId ? "Edit Insurance Record" : "Add New Insurance"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSave} style={styles.formCard}>
            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Person Name</label>
                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Person Phone</label>
                <input
                  type="text"
                  name="personPhone"
                  value={formData.personPhone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="9876543210"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Person Email</label>
                <input
                  type="email"
                  name="personEmail"
                  value={formData.personEmail}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="name@example.com"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Vehicle Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Year</label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Registration Number</label>
                <input
                  type="text"
                  name="regNo"
                  value={formData.regNo}
                  onChange={handleChange}
                  onKeyDown={handleRegNoKeyDown}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Policy No</label>
                <input
                  type="text"
                  name="insurancePolicyNo"
                  value={formData.insurancePolicyNo}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Company</label>
                <input
                  type="text"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Expiry Date</label>
                <input
                  type="date"
                  name="insuranceExpiry"
                  value={formData.insuranceExpiry}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={isSaving}
                style={
                  isSaving
                    ? { ...styles.button, ...styles.buttonDisabled }
                    : styles.button
                }
              >
                {isSaving
                  ? "Saving..."
                  : editId
                    ? "Update Insurance Record"
                    : "Save Insurance Record"}
                {!isSaving && <Save size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsuranceForm;
