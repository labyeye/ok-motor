import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  Bike,
  LogOut,
} from "lucide-react";

const CreateStaff = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:2500/api/users",
        formData
      );
      setSuccess(true);
      setTimeout(() => {
        navigate("/staff/list");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create staff. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

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

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Admin Panel</h2>
          <p style={styles.sidebarSubtitle}>Welcome, Admin</p>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                style={styles.menuItem}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
              >
                <div style={styles.menuItemContent}>
                  <item.icon size={20} style={styles.menuIcon} />
                  <span style={styles.menuText}>{item.name}</span>
                </div>
                {item.submenu && <ChevronDown size={16} />}
              </div>
            </div>
          ))}

          <div
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            <LogOut size={20} style={styles.menuIcon} />
            <span style={styles.menuText}>Logout</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Create Staff Account</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details to create a new staff member
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.errorAlert}>{error}</div>}
            {success && (
              <div style={styles.successAlert}>
                Staff account created successfully!
              </div>
            )}

            <div style={styles.formSection}>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Mail style={styles.formIcon} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Lock style={styles.formIcon} />
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                    minLength="6"
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Users style={styles.formIcon} />
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Staff Account"}
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
  form: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "32px",
    border: "1px solid #e2e8f0",
  },
  formSection: {
    marginBottom: "40px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  formField: {
    marginBottom: "24px",
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
  formSelect: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
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
    marginTop: "32px",
  },
  submitButton: {
    padding: "12px 24px",
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
    ":disabled": {
      backgroundColor: "#93c5fd",
      cursor: "not-allowed",
    },
  },
  errorAlert: {
    padding: "12px 16px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "0.875rem",
  },
  successAlert: {
    padding: "12px 16px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "0.875rem",
  },
};

export default CreateStaff;
