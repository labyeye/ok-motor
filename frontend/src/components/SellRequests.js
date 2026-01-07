import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  Bike,
  Settings,
  Menu,
  X,
  RefreshCw,
  Image,
} from "lucide-react";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3500";

const SellRequests = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Sell Requests");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`${API_BASE}/api/sell-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load sell requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    fetchRequests();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openDetails = (req) => setSelected(req);
  const closeDetails = () => setSelected(null);

  const updateStatus = async (id, status) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token") || "";
      const res = await axios.patch(
        `${API_BASE}/api/sell-request/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequests((prev) =>
        prev.map((p) => (p._id === id ? res.data.data : p))
      );
      if (selected && selected._id === id) setSelected(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    if (actualPath) navigate(actualPath);
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
      name: 'Gallery',
      icon: Image,
      path: '/gallery/manage',
    },
    {
      name: "Vehicle History",
      icon: Bike,
      path: "/bike-history",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "72px" : undefined,
      }}
    >
      <div style={{ ...styles.topBar, display: isMobile && !isSidebarOpen ? "block" : "none" }}>
        <div
          style={{ ...styles.hamburgerMenu, display: isMobile && !isSidebarOpen ? "block" : "none" }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
      </div>

      {isSidebarOpen && isMobile && <div style={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)}></div>}

      {}
      <div
        style={{
          ...styles.sidebar,
          ...(isMobile
            ? {
                transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
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
            style={{ width: "160px", display: "block", marginBottom: 8 }}
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
                    setExpandedMenus((prev) => ({
                      ...prev,
                      [item.name]: !prev[item.name],
                    }));
                  } else {
                    handleMenuClick(item.name, item.path);
                  }
                }}
              >
                <div style={styles.menuItemContent}>
                  <item.icon size={18} style={styles.menuIcon} />
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
                      onClick={() => handleMenuClick(subItem.name, subItem.path)}
                    >
                      {subItem.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div
            style={styles.logoutButton}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={18} style={styles.menuIcon} />
            <span style={styles.menuText}>Logout</span>
          </div>
        </nav>
      </div>

      {}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 style={styles.pageTitle}>Sell Requests</h1>
                <p style={styles.pageSubtitle}>
                  Manage incoming sell form submissions
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="card" style={{ padding: 16 }}>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <div>
                <p style={{ color: "red" }}>{error}</p>
                <button onClick={fetchRequests}>Retry</button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 900,
                  }}
                >
                  <thead style={{ background: "#f1f5f9" }}>
                    <tr>
                      <th style={th}>Date</th>
                      <th style={th}>Name</th>
                      <th style={th}>Phone</th>
                      <th style={th}>Email</th>
                      <th style={th}>Vehicle</th>
                      <th style={th}>Price</th>
                      <th style={th}>Images</th>
                      <th style={th}>Status</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id} style={tr}>
                        <td style={td}>
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td style={td}>{r.name}</td>
                        <td style={td}>{r.phone}</td>
                        <td style={td}>{r.email}</td>
                        <td style={td}>{`${r.brand || ""} ${r.model || ""} ${
                          r.year || ""
                        }`}</td>
                        <td style={td}>{r.price ? `₹${r.price}` : "-"}</td>
                        <td style={td}>
                          {r.images?.length ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              {r.images.slice(0, 3).map((img) => (
                                <img
                                  key={img.fileId}
                                  src={img.url}
                                  alt={img.name || "img"}
                                  style={{
                                    width: 80,
                                    height: 56,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    border: "1px solid #e6e6e6",
                                  }}
                                />
                              ))}
                              {r.images.length > 3 && (
                                <span>+{r.images.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td style={td}>
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              background:
                                r.status === "Approved"
                                  ? "#ecfccb"
                                  : r.status === "Rejected"
                                  ? "#fee2e2"
                                  : "#f1f5f9",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => openDetails(r)}
                            style={{ marginRight: 8 }}
                          >
                            View
                          </button>
                          <select
                            value={r.status}
                            onChange={(e) =>
                              updateStatus(r._id, e.target.value)
                            }
                            disabled={updating}
                            style={{ marginLeft: 8 }}
                          >
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div style={modalStyle} onClick={closeDetails}>
              <div style={modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>Sell Request Details</h3>
                <p>
                  <strong>Name:</strong> {selected.name}
                </p>
                <p>
                  <strong>Phone:</strong> {selected.phone}
                </p>
                <p>
                  <strong>Email:</strong> {selected.email}
                </p>
                <p>
                  <strong>Vehicle:</strong>{" "}
                  {`${selected.brand || ""} ${selected.model || ""} ${
                    selected.year || ""
                  }`}
                </p>
                <p>
                  <strong>Price:</strong>{" "}
                  {selected.price ? `₹${selected.price}` : "-"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.images?.map((img) => (
                    <a
                      key={img.fileId}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={img.url}
                        alt={img.name || "img"}
                        style={{
                          width: 180,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    </a>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <strong>Status:</strong>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected._id, e.target.value)}
                    disabled={updating}
                    style={{ marginLeft: 8 }}
                  >
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={closeDetails}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const th = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e6eef6",
  fontSize: 14,
  color: "#0f172a",
};
const td = {
  padding: 12,
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
  fontSize: 13,
};
const tr = { background: "#fff" };
const modalStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};
const modalContent = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  maxWidth: 900,
  width: "92%",
  maxHeight: "86%",
  overflowY: "auto",
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
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
    overflow: "auto",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid #1e293b",
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    padding: "0.75rem",
    background: "#ffffff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
    zIndex: 20,
  },
  hamburgerMenu: {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
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
  nav: { padding: "16px 0" },
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
    backgroundColor: "#1e293b",
    borderRight: "3px solid #3b82f6",
    color: "#ffffff",
  },
  menuItemContent: { display: "flex", alignItems: "center" },
  menuIcon: { marginRight: "12px", color: "#94a3b8" },
  menuText: { fontSize: "0.9375rem", fontWeight: "500" },
  submenu: { backgroundColor: "#1a2536" },
  submenuItem: {
    padding: "10px 24px 10px 64px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "0.875rem",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#f87171",
    marginTop: "16px",
    borderTop: "1px solid #1e293b",
  },
  mainContent: { flex: 1, overflow: "auto" },
  contentPadding: { padding: "32px" },
  header: { marginBottom: "24px" },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  pageSubtitle: { color: "#6b7280", marginTop: "8px", margin: "8px 0 0 0" },
};

export default SellRequests;
