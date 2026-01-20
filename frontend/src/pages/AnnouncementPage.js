import React, { useState, useContext, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  ShipWheel,
  Users,
  LogOut,
  Image,
  ChevronDown,
  ChevronRight,
  FileText,
  Bike,
  Settings,
  RefreshCw,
  Megaphone,
  Calendar,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import announcementService from "../services/announcementService";
import logo from "../images/company.png";

const AnnouncementPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Announcements");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManagement, setShowManagement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState({
    message: "",
    link: "",
    startDate: "",
    endDate: "",
    active: false,
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://ok-motor-51l3.vercel.app/api/announcements",
      );
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const data = await response.json();
      if (data.success) {
        const filteredAnnouncements = showManagement
          ? data.data
          : data.data.filter((ann) => ann.active === true);
        setAnnouncements(filteredAnnouncements);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await announcementService.update(editingAnnouncement._id, form, token);
      } else {
        await announcementService.create(form, token);
      }
      setForm({
        message: "",
        link: "",
        startDate: "",
        endDate: "",
        active: false,
      });
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert("Failed to save announcement");
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      message: announcement.message || "",
      link: announcement.link || "",
      startDate: announcement.startDate
        ? announcement.startDate.split("T")[0]
        : "",
      endDate: announcement.endDate ? announcement.endDate.split("T")[0] : "",
      active: announcement.active || false,
    });
    setShowManagement(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await announcementService.remove(id, token);
      fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("Failed to delete announcement");
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await announcementService.update(id, { active }, token);
      fetchAnnouncements();
    } catch (err) {
      console.error("Error updating announcement:", err);
      alert("Failed to update announcement");
    }
  };

  const isAnnouncementValid = (announcement) => {
    const now = new Date();
    const start = announcement.startDate
      ? new Date(announcement.startDate)
      : null;
    const end = announcement.endDate ? new Date(announcement.endDate) : null;

    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: (role) => (role === "admin" ? "/admin" : "/staff"),
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
    setExpandedMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    if (actualPath) navigate(actualPath);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div style={styles.container}>
      {/* Mobile Top Bar */}
      <div
        style={{
          ...styles.topBar,
          display: isMobile && !isSidebarOpen ? "block" : "none",
        }}
      >
        <div
          style={{
            ...styles.hamburgerMenu,
            display: isMobile && !isSidebarOpen ? "block" : "none",
          }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
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
        <div style={styles.sidebarHeader}>
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
            <div>
              <h1 style={styles.pageTitle}>
                {showManagement
                  ? "Manage Announcements"
                  : "Active Announcements"}
              </h1>
              <p style={styles.pageSubtitle}>
                {showManagement
                  ? "Create, edit, and manage all announcements"
                  : "View all active announcements currently displayed on the website"}
              </p>
            </div>
            <button
              style={styles.manageButton}
              onClick={() => {
                setShowManagement(!showManagement);
                setEditingAnnouncement(null);
                setForm({
                  message: "",
                  link: "",
                  startDate: "",
                  endDate: "",
                  active: false,
                });
              }}
            >
              {showManagement ? (
                <>
                  <XCircle size={18} />
                  Close Management
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Manage Announcements
                </>
              )}
            </button>
          </div>

          {/* Management Form */}
          {showManagement && (
            <div style={styles.managementPanel}>
              <h3 style={styles.formTitle}>
                {editingAnnouncement
                  ? "Edit Announcement"
                  : "Create New Announcement"}
              </h3>
              <form onSubmit={handleCreateOrUpdate} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Message *</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="Enter announcement message"
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      required
                      rows={3}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Link (optional)</label>
                    <input
                      style={styles.input}
                      type="url"
                      placeholder="https://example.com"
                      value={form.link}
                      onChange={(e) =>
                        setForm({ ...form, link: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) =>
                          setForm({ ...form, active: e.target.checked })
                        }
                        style={styles.checkbox}
                      />
                      <span>Active (show on website)</span>
                    </label>
                  </div>
                </div>
                <div style={styles.formActions}>
                  <button type="submit" style={styles.submitButton}>
                    {editingAnnouncement
                      ? "Update Announcement"
                      : "Create Announcement"}
                  </button>
                  {editingAnnouncement && (
                    <button
                      type="button"
                      style={styles.cancelButton}
                      onClick={() => {
                        setEditingAnnouncement(null);
                        setForm({
                          message: "",
                          link: "",
                          startDate: "",
                          endDate: "",
                          active: false,
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p>Loading announcements...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={styles.errorContainer}>
              <XCircle size={48} color="#dc2626" />
              <h3>Error Loading Announcements</h3>
              <p>{error}</p>
              <button style={styles.retryButton} onClick={fetchAnnouncements}>
                Retry
              </button>
            </div>
          )}

          {/* No Announcements */}
          {!loading &&
            !error &&
            announcements.length === 0 &&
            !showManagement && (
              <div style={styles.emptyContainer}>
                <Megaphone size={64} color="#9ca3af" />
                <h3 style={styles.emptyTitle}>No Active Announcements</h3>
                <p style={styles.emptySubtitle}>
                  There are currently no active announcements to display.
                </p>
              </div>
            )}

          {/* Announcements Grid */}
          {!loading && !error && announcements.length > 0 && (
            <div style={styles.grid}>
              {announcements.map((announcement) => {
                const isValid = isAnnouncementValid(announcement);
                return (
                  <div
                    key={announcement._id}
                    style={styles.card}
                    className="announcement-card"
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.badgeContainer}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(isValid
                              ? styles.badgeActive
                              : styles.badgeExpired),
                          }}
                        >
                          {isValid ? (
                            <>
                              <CheckCircle size={14} />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle size={14} />
                              Expired
                            </>
                          )}
                        </span>
                      </div>
                      <Megaphone size={24} color="#088395" />
                    </div>

                    <div style={styles.cardBody}>
                      <p style={styles.messageText}>{announcement.message}</p>

                      {announcement.link && (
                        <a
                          href={announcement.link}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Learn more →
                        </a>
                      )}
                    </div>

                    {/* Management Actions */}
                    <div style={styles.cardActions}>
                      <button
                        style={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(announcement);
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(announcement._id);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                      {showManagement && (
                        <label style={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={announcement.active}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleActive(announcement._id, e.target.checked);
                            }}
                          />
                          Active
                        </label>
                      )}
                    </div>

                    <div style={styles.cardFooter}>
                      <div style={styles.dateItem}>
                        <Calendar size={16} color="#6b7280" />
                        <span style={styles.dateLabel}>Start:</span>
                        <span style={styles.dateValue}>
                          {formatDate(announcement.startDate)}
                        </span>
                      </div>
                      <div style={styles.dateItem}>
                        <Calendar size={16} color="#6b7280" />
                        <span style={styles.dateLabel}>End:</span>
                        <span style={styles.dateValue}>
                          {formatDate(announcement.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
    minHeight: "100vh",
    backgroundColor: "#EBF4F6",
    fontFamily: "'Inter', sans-serif",
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "64px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 20,
  },
  hamburgerMenu: {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
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
    transition: "transform 0.3s ease",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
    backgroundColor: "rgba(26, 32, 44, 0.7)",
  },
  submenuItem: {
    padding: "10px 44px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
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
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.2s ease",
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
    marginTop: "8px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 0",
    color: "#64748b",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 0",
    color: "#64748b",
  },
  retryButton: {
    marginTop: "16px",
    padding: "10px 24px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 0",
  },
  emptyTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#374151",
    marginTop: "16px",
  },
  emptySubtitle: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginTop: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  badgeContainer: {
    display: "flex",
    gap: "8px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },
  badgeActive: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeExpired: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  cardBody: {
    marginBottom: "16px",
  },
  messageText: {
    fontSize: "1rem",
    color: "#1e293b",
    lineHeight: "1.6",
    marginBottom: "12px",
  },
  link: {
    display: "inline-block",
    fontSize: "0.875rem",
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "500",
  },
  cardFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  dateItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
  },
  dateLabel: {
    color: "#6b7280",
    fontWeight: "500",
  },
  dateValue: {
    color: "#1e293b",
  },
  manageButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  managementPanel: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
    border: "2px solid #e5e7eb",
  },
  formTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    transition: "border-color 0.2s ease",
  },
  textarea: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "border-color 0.2s ease",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  submitButton: {
    padding: "12px 24px",
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  cancelButton: {
    padding: "12px 24px",
    backgroundColor: "#6b7280",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
    marginTop: "16px",
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginLeft: "auto",
    fontSize: "13px",
    color: "#374151",
    cursor: "pointer",
  },
};

export default AnnouncementPage;
