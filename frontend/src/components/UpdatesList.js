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
  Megaphone,
  Menu,
  X,
  Shield,
  ImageIcon
} from "lucide-react";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";
import logoheader from "../images/okmotor.png";
import ConfirmModal from "./ConfirmModal";

const UpdatesList = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Updates List");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
    <div className="updates-container">
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

      {/* Mobile Top Bar */}
      <div className="top-bar">
        <div
          className="hamburger-menu"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
        <img src={logoheader} alt="logo" className="top-bar-logo" />
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="sidebar-header">
          <img src={logo} alt="logo" className="brand-logo" />
          <p className="sidebar-subtitle">Welcome, {user?.name || "User"}</p>
        </div>
        <nav className="nav">
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                className={`menu-item ${activeMenu === item.name ? "active" : ""}`}
                onClick={() => {
                  if (item.submenu) toggleMenu(item.name);
                  else
                    handleMenuClick(
                      item.name,
                      typeof item.path === "function"
                        ? item.path(user?.role)
                        : item.path,
                    );
                }}
              >
                <div className="menu-item-content">
                  <item.icon size={20} className="menu-icon" />
                  <span className="menu-text">{item.name}</span>
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
                  className={`submenu${expandedMenus[item.name] ? " submenu-open" : " submenu-closed"}`}
                  style={{
                    maxHeight: expandedMenus[item.name] ? `${item.submenu.length * 48}px` : "0px",
                    opacity: expandedMenus[item.name] ? 1 : 0,
                    transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
                    overflow: "hidden",
                  }}
                >
                  {item.submenu.map((si) => (
                    <div
                      key={si.name}
                      className="submenu-item"
                      onClick={() => handleMenuClick(si.name, si.path)}
                    >
                      {si.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="logout-button" onClick={handleLogout}>
            <LogOut size={20} className="menu-icon" />
            <span className="menu-text">Logout</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="updates-main-content">
        <div className="content-padding">
          <div className="updates-header">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h1 className="updates-page-title">Updates</h1>
                <p className="updates-page-subtitle">
                  Manage site updates, images and visibility
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => fetchUpdates()}
                  className="updates-btn-secondary"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button
                  onClick={() => navigate("/updates/create")}
                  className="updates-btn-primary"
                >
                  Create Update
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          {!isMobile && (
            <div className="updates-table-wrapper">
              <table className="updates-table">
                <thead>
                  <tr>
                    <th className="updates-th">Title</th>
                    <th className="updates-th">Poster</th>
                    <th className="updates-th">Short Description</th>
                    <th className="updates-th">Status</th>
                    <th className="updates-th">Created</th>
                    <th className="updates-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.map((u) => (
                    <tr key={u._id} className="updates-tr">
                      <td className="updates-td">{u.title}</td>
                      <td className="updates-td">
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
                      <td className="updates-td">{u.shortDescription}</td>
                      <td className="updates-td">
                        <span
                          className={`updates-badge ${u.status === "Active" ? "updates-badge-active" : "updates-badge-inactive"}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="updates-td">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="updates-td">
                        <button
                          onClick={() => setViewItem(u)}
                          className="updates-action-btn"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/updates/edit/${u._id}`)}
                          className="updates-action-btn"
                          style={{ marginLeft: 6 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(u._id, u.status)}
                          className="updates-action-btn"
                          style={{ marginLeft: 6 }}
                        >
                          {u.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="updates-action-btn updates-action-btn-danger"
                          style={{ marginLeft: 6 }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <div className="updates-cards">
              {updates.map((u) => (
                <div key={u._id} className="updates-card">
                  {u.images && u.images[0] && (
                    <img src={u.images[0].url} alt={u.title} className="updates-card-img" />
                  )}
                  <div className="updates-card-body">
                    <div className="updates-card-top">
                      <div className="updates-card-title">{u.title}</div>
                      <span className={`updates-badge ${u.status === "Active" ? "updates-badge-active" : "updates-badge-inactive"}`}>
                        {u.status}
                      </span>
                    </div>
                    {u.shortDescription && (
                      <p className="updates-card-desc">{u.shortDescription}</p>
                    )}
                    <div className="updates-card-date">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="updates-card-actions">
                      <button onClick={() => setViewItem(u)} className="updates-card-btn">View</button>
                      <button onClick={() => navigate(`/updates/edit/${u._id}`)} className="updates-card-btn">Edit</button>
                      <button
                        onClick={() => toggleStatus(u._id, u.status)}
                        className={`updates-card-btn ${u.status === "Active" ? "updates-card-btn-toggle-deactivate" : "updates-card-btn-toggle-activate"}`}
                      >
                        {u.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleDelete(u._id)} className="updates-card-btn updates-card-btn-delete">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Modal */}
          {viewItem && (
            <div className="updates-modal-overlay" onClick={() => setViewItem(null)}>
              <div className="updates-modal" onClick={(e) => e.stopPropagation()}>
                <div className="updates-modal-header">
                  <h3 className="updates-modal-title">{viewItem.title}</h3>
                  <button className="updates-modal-close" onClick={() => setViewItem(null)}>
                    <X size={20} />
                  </button>
                </div>
                <p className="updates-modal-desc">{viewItem.shortDescription}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(viewItem.images || []).map((im, idx) => (
                    <img
                      key={idx}
                      src={im.url}
                      alt={viewItem.title}
                      style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 6 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .updates-container {
          display: flex;
          min-height: 100vh;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #EBF4F6;
        }

        /* ── TOP BAR ── */
        .top-bar {
          padding: 0.5rem 1rem;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1rem;
        }
        .top-bar-logo {
          display: none;
          margin: 0;
          padding: 0;
          line-height: 0;
        }
        .hamburger-menu {
          display: none;
        }

        /* ── SIDEBAR OVERLAY ── */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 14;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 280px;
          background: #071952;
          color: #f8fafc;
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          border-right: 1px solid rgba(255,255,255,0.1);
          z-index: 10;
          transition: transform 0.3s ease;
          overflow: hidden;
        }
        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          text-align: center;
          flex: 0 0 auto;
        }
        .brand-logo {
          width: 100%;
          height: 8rem;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .sidebar-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0;
        }
        .nav {
          padding: 1rem 0;
          flex: 1 1 auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          color: #e2e8f0;
          transition: all 0.3s ease;
        }
        .menu-item:hover { background: rgba(255,255,255,0.05); }
        .menu-item.active {
          background: rgba(8,131,149,0.2);
          border-right: 3px solid #088395;
          color: #ffffff;
        }
        .menu-item-content { display: flex; align-items: center; }
        .menu-icon { margin-right: 12px; color: #94a3b8; }
        .menu-text { font-size: 0.9375rem; font-weight: 500; }
        .submenu { background: #1a2536; }
        .submenu-item {
          padding: 0.625rem 1.5rem 0.625rem 4rem;
          cursor: pointer;
          color: #cbd5e1;
          font-size: 0.875rem;
        }
        .submenu-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .logout-button {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          color: #f87171;
          margin-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        /* ── MAIN CONTENT ── */
        .updates-main-content { flex: 1; overflow: auto; }
        .content-padding { padding: 2rem; }
        .updates-header { margin-bottom: 1.5rem; }
        .updates-page-title { font-size: 1.875rem; font-weight: bold; color: #1f2937; margin: 0; }
        .updates-page-subtitle { color: #6b7280; margin-top: 8px; }
        .updates-btn-secondary {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .updates-btn-primary {
          background: #088395;
          color: #fff;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* ── TABLE ── */
        .updates-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .updates-table { width: 100%; border-collapse: collapse; }
        .updates-th {
          text-align: left;
          padding: 10px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
          background: #f1f5f9;
        }
        .updates-tr { border-top: 1px solid #e2e8f0; }
        .updates-td { padding: 10px 12px; font-size: 0.875rem; color: #334155; vertical-align: middle; }
        .updates-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .updates-badge-active { background: rgba(8,131,149,0.1); color: #071952; }
        .updates-badge-inactive { background: #fee2e2; color: #991b1b; }
        .updates-action-btn {
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          font-size: 0.78rem;
          color: #334155;
        }
        .updates-action-btn-danger { color: #991b1b; border-color: #fca5a5; }

        /* ── MODAL ── */
        .updates-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .updates-modal {
          background: #fff;
          padding: 20px;
          max-width: 800px;
          width: 90%;
          border-radius: 8px;
        }
        .updates-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .updates-modal-title { margin: 0; color: #1e293b; }
        .updates-modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .updates-modal-desc { color: #475569; margin-bottom: 12px; }

        /* ── MOBILE CARDS ── */
        .updates-cards { display: flex; flex-direction: column; gap: 12px; }
        .updates-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .updates-card-img { width: 100%; height: 160px; object-fit: cover; }
        .updates-card-body { padding: 14px; }
        .updates-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .updates-card-title { font-weight: 700; font-size: 1rem; color: #1e293b; flex: 1; padding-right: 8px; }
        .updates-card-desc { font-size: 0.82rem; color: #475569; margin: 0 0 10px 0; line-height: 1.4; }
        .updates-card-date { font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px; }
        .updates-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .updates-card-btn {
          flex: 1;
          min-width: 70px;
          padding: 8px 6px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.78rem;
          color: #1e293b;
          font-weight: 500;
        }
        .updates-card-btn-toggle-deactivate {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #c2410c;
        }
        .updates-card-btn-toggle-activate {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
        }
        .updates-card-btn-delete {
          background: #fee2e2;
          border: none;
          color: #991b1b;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .sidebar { width: 240px; }
        }

        @media (max-width: 768px) {
          .hamburger-menu {
            display: block;
            cursor: pointer;
            color: #ffffff;
            position: absolute;
            left: 1rem;
          }
          .top-bar {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            background-color: #071952;
            padding: 0 1rem;
            position: relative;
          }
          .top-bar-logo {
            display: block;
            width: 250px;
            height: auto;
            margin: -40px;
            padding: 0;
          }
          .sidebar-overlay { display: block; }
          .updates-container { flex-direction: column; }
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 15;
          }
          .sidebar.sidebar-open { transform: translateX(0); }
          .sidebar.sidebar-closed { transform: translateX(-100%); }
          .updates-main-content { padding-top: 60px; }
          .content-padding { padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default UpdatesList;
