import { useEffect, useState, useContext } from "react";
import axios from "axios";
import config from "../config/environment";
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
  RefreshCw,
  Image,
  Megaphone,
} from "lucide-react";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";
import ConfirmModal from "./ConfirmModal";

const UpdatesList = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Updates List");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [, setIsSidebarOpen] = useState(false);
  const [, setIsMobile] = useState(window.innerWidth <= 768);

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const navigate = useNavigate();

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
      icon: Image,
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    fetchUpdates();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.API_BASE_URL}/updates/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpdates(res.data.data || []);
    } catch (err) {
      console.error("Fetch updates error", err);
      setError(err.response?.data?.message || "Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (menuName) =>
    setExpandedMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    if (path) navigate(path);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);

  const handleDelete = (id) => {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${config.API_BASE_URL}/updates/${confirmTargetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUpdates();
    } catch (err) {
      alert("Failed to delete");
    } finally {
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };

  const toggleStatus = async (id, current) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${config.API_BASE_URL}/updates/${id}`,
        { status: current === "Active" ? "Inactive" : "Active" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchUpdates();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading updates...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div style={styles.container}>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Update"
        message="Are you sure you want to delete this update? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
        }}
      />
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <img
            src={logo}
            alt="logo"
            style={{ width: "10.5rem", height: "10.5rem" }}
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
                  if (item.submenu) toggleMenu(item.name);
                  else handleMenuClick(item.name, item.path);
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
                  {item.submenu.map((si) => (
                    <div
                      key={si.name}
                      style={styles.submenuItem}
                      onClick={() => handleMenuClick(si.name, si.path)}
                    >
                      {si.name}
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
                <h1 style={styles.pageTitle}>Updates</h1>
                <p style={styles.pageSubtitle}>
                  Manage site updates, images and visibility
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => fetchUpdates()}
                  style={styles.headerButton}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button
                  onClick={() => navigate("/updates/create")}
                  style={styles.headerPrimary}
                >
                  Create Update
                </button>
              </div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>Title</th>
                <th style={{ padding: 8 }}>Poster</th>
                <th style={{ textAlign: "left", padding: 8 }}>
                  Short Description
                </th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Created</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => (
                <tr key={u._id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{u.title}</td>
                  <td style={{ padding: 8 }}>
                    {u.images && u.images[0] ? (
                      <img
                        src={u.images[0].url}
                        alt={u.title}
                        style={{
                          width: 80,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ padding: 8 }}>{u.shortDescription}</td>
                  <td style={{ padding: 8 }}>{u.status}</td>
                  <td style={{ padding: 8 }}>
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => setViewItem(u)}>View</button>
                    <button
                      onClick={() => navigate(`/updates/edit/${u._id}`)}
                      style={{ marginLeft: 6 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(u._id, u.status)}
                      style={{ marginLeft: 6 }}
                    >
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      style={{ marginLeft: 6, color: "red" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {viewItem && (
            <div style={styles.modalOverlay} onClick={() => setViewItem(null)}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>{viewItem.title}</h3>
                <p>{viewItem.shortDescription}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(viewItem.images || []).map((im, idx) => (
                    <img
                      key={idx}
                      src={im.url}
                      alt={viewItem.title}
                      style={{
                        width: 160,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setViewItem(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#EBF4F6",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#071952",
    color: "#f8fafc",
    position: "sticky",
    top: 0,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    flex: "0 0 auto",
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
  },
  menuItemActive: {
    backgroundColor: "rgba(8, 131, 149, 0.2)",
    borderRight: "3px solid #088395",
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
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  mainContent: { flex: 1, overflow: "auto" },
  contentPadding: { padding: "32px" },
  header: { marginBottom: "24px" },
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: { color: "#6b7280", marginTop: "8px" },
  headerButton: {
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  headerPrimary: {
    backgroundColor: "#088395",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#fff",
    padding: 20,
    maxWidth: 800,
    width: "90%",
    borderRadius: 8,
  },
};

export default UpdatesList;
