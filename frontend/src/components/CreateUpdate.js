import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
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
  Image,
  Menu,
  X,
  Settings,
  RefreshCw,
} from "lucide-react";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";

const CreateUpdate = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    if (id) fetchExisting();
    return () => window.removeEventListener("resize", handleResize);
  }, [id]);

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
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
    { name: "Gallery", icon: Image, path: "/gallery/manage" },
    { name: "Vehicle History", icon: Bike, path: "/bike-history" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const fetchExisting = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:2500/api/updates/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = res.data.data.find((u) => u._id === id);
      if (found) {
        setTitle(found.title);
        setShortDescription(found.shortDescription);
        setPreview(found.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch existing update", err);
    }
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    const p = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setPreview(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("title", title);
      fd.append("shortDescription", shortDescription);
      images.forEach((img) => fd.append("images", img));
      if (id) {
        await axios.put(`http://localhost:2500/api/updates/${id}`, fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post("http://localhost:2500/api/updates", fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      navigate("/updates");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
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
                      style={styles.submenuItem}
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
                <h1 style={styles.pageTitle}>
                  {id ? "Edit Update" : "Create Update"}
                </h1>
                <p style={styles.pageSubtitle}>
                  Create or modify updates published on the website
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => navigate("/updates")}
                  style={styles.headerButton}
                >
                  Back
                </button>
                <button onClick={handleSubmit} style={styles.headerPrimary}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ maxWidth: 900 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Short Description
              </label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
                rows={4}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Images (you can add multiple)
              </label>
              <input type="file" accept="image/*" multiple onChange={onFiles} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {preview.map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: 120,
                    height: 90,
                    overflow: "hidden",
                    borderRadius: 6,
                    border: "1px solid #eee",
                  }}
                >
                  <img
                    src={p.url || p}
                    alt={p.name || "preview"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
              {/* also show existing images (from url strings) */}
              {preview.length === 0 &&
                preview !== null &&
                Array.isArray(preview) &&
                preview.filter(Boolean).length === 0 && (
                  <div style={{ color: "#6b7280" }}>No images selected</div>
                )}
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#3b82f6",
                  color: "#fff",
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/updates")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              >
                Cancel
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
    height: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    position: "sticky",
    top: 0,
    height: "100vh",
    backgroundImage: "linear-gradient(to bottom, #1e293b, #0f172a)",
  },
  sidebarHeader: { padding: "24px", borderBottom: "1px solid #1e293b" },
  nav: { padding: "16px 0" },
  menuItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#cbd5e1",
  },
  menuItemActive: { backgroundColor: "rgba(255,255,255,0.03)", color: "#fff" },
  menuItemContent: { display: "flex", alignItems: "center" },
  menuIcon: { marginRight: "12px", color: "#94a3b8" },
  menuText: { fontSize: "0.9375rem", fontWeight: "500" },
  submenu: { paddingLeft: 48, backgroundColor: "transparent" },
  submenuItem: { padding: "8px 0", color: "#94a3b8", cursor: "pointer" },
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
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
};

export default CreateUpdate;
