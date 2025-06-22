import React, { useState, useEffect, useContext } from "react";
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
  Search,
  Download,
  Edit,
  Trash2,
  X,
  Bike,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import logo from "../images/company.png";

const AdvanceHistory = () => {
  const { user } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Advance History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [advanceBills, setAdvanceBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://ok-motor.onrender.com/api/advance-bills?page=${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setAdvanceBills(response.data.data || response.data);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching advance bills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
    const simulateProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setDownloadProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  
  const DownloadProgressModal = ({ progress, onClose }) => {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <h2 style={modalStyles.title}>Generating PDF</h2>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <div style={progressStyles.progressContainer}>
              <div
                style={{
                  ...progressStyles.progressBar,
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            <p style={progressStyles.progressText}>{progress}% Complete</p>
            {progress === 100 && (
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      width: "80%",
      maxWidth: "800px",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 24px",
      borderBottom: "1px solid #e2e8f0",
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: "600",
      margin: 0,
      color: "#1e293b",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#64748b",
      ":hover": {
        color: "#334155",
      },
    },
    form: {
      padding: "24px",
    },
    formSection: {
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e2e8f0",
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "16px",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "16px",
    },
    formField: {
      marginBottom: "16px",
    },
    formLabel: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#334155",
      marginBottom: "8px",
    },
    formInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "4px",
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
    formActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "16px",
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #e2e8f0",
    },
    saveButton: {
      padding: "8px 16px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      ":hover": {
        backgroundColor: "#2563eb",
      },
    },
    cancelButton: {
      padding: "8px 16px",
      backgroundColor: "#e2e8f0",
      color: "#334155",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      ":hover": {
        backgroundColor: "#cbd5e1",
      },
    },
  };

  const progressStyles = {
    progressContainer: {
      width: "100%",
      height: "20px",
      backgroundColor: "#e2e8f0",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "8px",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#3b82f6",
      transition: "width 0.3s ease",
    },
    progressText: {
      fontSize: "0.875rem",
      color: "#64748b",
    },
  };

  const filteredBills = searchTerm
    ? advanceBills.filter((bill) =>
        bill.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : advanceBills;

  const handleDownload = async (billId) => {
    try {
          setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate progress
    await simulateProgress();
      const response = await axios.get(
        `https://ok-motor.onrender.com/api/advance-bills/${billId}/download`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `advance-bill-${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this advance bill?")) {
      try {
        await axios.delete(`https://ok-motor.onrender.com/api/advance-bills/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAdvanceBills(advanceBills.filter((bill) => bill._id !== id));
      } catch (error) {
        console.error("Error deleting advance bill:", error);
      }
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
    {
      name: "Vehicle History",
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
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
         <div style={styles.sidebarHeader}>
          <img
            src={logo}
            alt="logo"
            style={{
              width: "100%",
              maxWidth: "25rem",
              height: "13rem",
              objectFit: "cover", // match CSS
              objectPosition: "center",
              display: "block",
              margin: "0 auto 1rem auto",
            }}
          />
          <p style={styles.sidebarSubtitle}>Welcome, OK MOTORS</p>
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
            <h1 style={styles.pageTitle}>Advance History</h1>
            <p style={styles.pageSubtitle}>
              View and manage all your advance bills
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by registration number or customer name..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
            </div>
            <button
              style={styles.newBillButton}
              onClick={() => navigate("/advance/create")}
            >
              <FileText size={16} style={styles.buttonIcon} />
              New Advance Bill
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Customer</th>
                      <th style={styles.tableHeader}>Vehicle</th>
                      <th style={styles.tableHeader}>Reg No.</th>
                      <th style={styles.tableHeader}>Total Amount</th>
                      <th style={styles.tableHeader}>Advance Paid</th>
                      <th style={styles.tableHeader}>Balance Due</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map((bill) => (
                      <tr key={bill._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{bill.customerName}</td>
                        <td style={styles.tableCell}>
                          {bill.vehicleBrand} {bill.vehicleModel}
                        </td>
                        <td style={styles.tableCell}>{bill.registrationNumber}</td>
                         <td style={styles.tableCell}>
                          ₹
                          {new Intl.NumberFormat("en-IN").format(
                            bill.grandTotal
                          )}
                        </td>
                         <td style={styles.tableCell}>
                          ₹
                          {new Intl.NumberFormat("en-IN").format(
                            bill.advancePaid
                          )}
                        </td>
                         <td style={styles.tableCell}>
                          ₹
                          {new Intl.NumberFormat("en-IN").format(
                            bill.balanceDue
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {formatDate(bill.createdAt)}
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleDownload(bill._id)}
                            style={styles.iconButton}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => handleDelete(bill._id)}
                              style={styles.iconButton}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.pagination}>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  Previous
                </button>
                <span style={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {isDownloading && (
        <DownloadProgressModal
          progress={downloadProgress}
          onClose={() => setIsDownloading(false)}
        />
      )}
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
  searchContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  searchInputContainer: {
    position: "relative",
    width: "300px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 40px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  },
  newBillButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
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
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontSize: "0.875rem",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    ":hover": {
      backgroundColor: "#f8fafc",
    },
  },
  tableCell: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "#334155",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPartial: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  statusPending: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "8px",
    margin: "0 4px",
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "#f1f5f9",
      color: "#3b82f6",
    },
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
  },
  paginationButton: {
    padding: "8px 16px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#cbd5e1",
    },
    ":disabled": {
      opacity: "0.5",
      cursor: "not-allowed",
    },
  },
  pageInfo: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    color: "#64748b",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
  },
  emptyIcon: {
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  emptyText: {
    color: "#64748b",
    fontSize: "1rem",
    margin: 0,
  },
};

export default AdvanceHistory;
