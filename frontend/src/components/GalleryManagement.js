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
  Upload,
  Trash2,
  Eye,
  EyeOff,
  X,
  Menu,
  Settings,
  Bike,
  ShipWheel,
  Megaphone,
  RefreshCw,

  Shield,
  ImageIcon
} from "lucide-react";
import AuthContext from "../context/AuthContext";

const API_BASE = "https://ok-motor-51l3.vercel.app";

const GalleryManagement = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Gallery Management");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchImages();
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/gallery/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setImages(response.data.images);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      alert("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const token = localStorage.getItem("token");

      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const resp = await axios.post(`${API_BASE}/api/gallery/upload`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (!resp.data?.success) {
        throw new Error(resp.data?.message || "Upload failed");
      }

      alert("Images uploaded successfully!");
      fetchImages();
    } catch (error) {
      console.error("Error uploading images:", error);
      alert(
        "Failed to upload images: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, fileId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/gallery/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Image deleted successfully!");
      fetchImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/api/gallery/${id}`,
        { isActive: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchImages();
    } catch (error) {
      console.error("Error updating image:", error);
      alert("Failed to update image");
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
      name: "PUC",
      icon: FileText,
      submenu: [
        { name: "Add PUC", path: "/puc/create" },
        { name: "PUC List", path: "/puc/history" },
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
      name: "Letter Head",
      icon: FileText,
      path: "/letter-head/create",
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

  return (
    <div style={styles.container}>
      {}
      <div
        style={{
          ...styles.sidebar,
          transform:
            isMobile && !isSidebarOpen ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>OK Motors</h2>
          {isMobile && (
            <X
              size={24}
              style={styles.closeSidebar}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <div>
                  <div
                    style={styles.menuItem}
                    onClick={() => toggleMenu(item.name)}
                  >
                    <div style={styles.menuItemLeft}>
                      <item.icon size={20} />
                      <span style={styles.menuText}>{item.name}</span>
                    </div>
                    {expandedMenus[item.name] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  {expandedMenus[item.name] && (
                    <div style={styles.submenu}>
                      {item.submenu.map((subItem) => (
                        <div
                          key={subItem.name}
                          style={{
                            ...styles.submenuItem,
                            ...(activeMenu === subItem.name
                              ? styles.activeMenuItem
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
              ) : (
                <div
                  style={{
                    ...styles.menuItem,
                    ...(activeMenu === item.name ? styles.activeMenuItem : {}),
                  }}
                  onClick={() => handleMenuClick(item.name, item.path)}
                >
                  <div style={styles.menuItemLeft}>
                    <item.icon size={20} />
                    <span style={styles.menuText}>{item.name}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={styles.menuItem} onClick={handleLogout}>
            <div style={styles.menuItemLeft}>
              <LogOut size={20} />
              <span style={styles.menuText}>Logout</span>
            </div>
          </div>
        </nav>
      </div>

      {}
      <div style={styles.mainContent}>
        {isMobile && (
          <div style={styles.mobileHeader}>
            <Menu
              size={24}
              onClick={() => setIsSidebarOpen(true)}
              style={styles.hamburgerIcon}
            />
            <h2>Gallery Management</h2>
          </div>
        )}

        <div style={styles.contentWrapper}>
          <div style={styles.header}>
            <h1 style={styles.title}>Gallery Management</h1>
            <div style={styles.uploadSection}>
              <input
                type="file"
                id="fileInput"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="fileInput" style={styles.uploadButton}>
                <Upload size={20} />
                <span>{uploading ? "Uploading..." : "Upload Images"}</span>
              </label>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading images...</div>
          ) : (
            <div style={styles.imageGrid}>
              {images.map((image) => (
                <div key={image._id} style={styles.imageCard}>
                  <div style={styles.imageWrapper}>
                    <img
                      src={image.imageUrl}
                      alt={image.altText}
                      style={styles.image}
                    />
                    {!image.isActive && (
                      <div style={styles.inactiveBadge}>Hidden</div>
                    )}
                  </div>
                  <div style={styles.imageActions}>
                    <button
                      style={styles.actionButton}
                      onClick={() =>
                        handleToggleActive(image._id, image.isActive)
                      }
                      title={image.isActive ? "Hide" : "Show"}
                    >
                      {image.isActive ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      onClick={() =>
                        handleDelete(image._id, image.imageKitFileId)
                      }
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div style={styles.imageInfo}>
                    <p style={styles.imageTitle}>{image.title}</p>
                    <p style={styles.imageDate}>
                      {new Date(image.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isMobile && isSidebarOpen && (
        <div style={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#EBF4F6",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#071952",
    color: "#f8fafc",
    position: "fixed",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
    transition: "transform 0.3s ease",
    zIndex: 1000,
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    margin: 0,
  },
  closeSidebar: {
    cursor: "pointer",
  },
  nav: {
    padding: "16px 0",
    flex: "1 1 auto",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  menuItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#cbd5e1",
  },
  menuItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  menuText: {
    fontSize: "0.9375rem",
    fontWeight: "500",
  },
  activeMenuItem: {
    backgroundColor: "rgba(8, 131, 149, 0.2)",
    borderRight: "3px solid #088395",
    color: "#ffffff",
  },
  submenu: {
    paddingLeft: 48,
    backgroundColor: "transparent",
  },
  submenuItem: {
    padding: "8px 0",
    color: "#94a3b8",
    cursor: "pointer",
  },
  mainContent: {
    marginLeft: "280px",
    flex: 1,
    padding: "24px",
  },
  mobileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  hamburgerIcon: {
    cursor: "pointer",
  },
  contentWrapper: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  uploadSection: {
    display: "flex",
    gap: "12px",
  },
  uploadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#088395",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  loading: {
    textAlign: "center",
    padding: "48px",
    color: "#64748b",
    fontSize: "16px",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  imageCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    transition: "box-shadow 0.2s",
  },
  imageWrapper: {
    position: "relative",
    paddingTop: "75%",
    backgroundColor: "#f1f5f9",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  inactiveBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "4px 12px",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    color: "white",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  imageActions: {
    display: "flex",
    gap: "8px",
    padding: "12px",
    borderTop: "1px solid #e2e8f0",
  },
  actionButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  imageInfo: {
    padding: "12px",
  },
  imageTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },
  imageDate: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
};

if (window.innerWidth <= 768) {
  styles.sidebar.width = "100%";
  styles.mainContent.marginLeft = "0";
}

export default GalleryManagement;
