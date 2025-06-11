// ServiceHistory.js
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


const ServiceHistory = () => {
  const { user } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Service History");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [serviceBills, setServiceBills] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [sellHistory, setSellHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showVehicleHistory, setShowVehicleHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch service bills
        const serviceResponse = await axios.get(
          `https://ok-motor.onrender.com/api/service-bills?page=${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setServiceBills(serviceResponse.data.data || serviceResponse.data);
        setTotalPages(serviceResponse.data.totalPages || 1);

        // Fetch purchase history (if needed)
        const purchaseResponse = await axios.get(
          `https://ok-motor.onrender.com/api/buy-letters`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setPurchaseHistory(purchaseResponse.data.data || purchaseResponse.data);

        // Fetch sell history (if needed)
        const sellResponse = await axios.get(
          `https://ok-motor.onrender.com/api/sell-letters`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setSellHistory(sellResponse.data.data || sellResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    // If the search term is a registration number and has at least 3 characters
    if (term.length >= 3) {
      setShowVehicleHistory(true);
    } else {
      setShowVehicleHistory(false);
    }
  };

  const getFilteredData = () => {
    if (!searchTerm) return { purchase: [], sell: [], service: [] };

    const lowerSearchTerm = searchTerm.toLowerCase();

    return {
      purchase: purchaseHistory.filter((item) =>
        item.registrationNumber?.toLowerCase().includes(lowerSearchTerm)
      ),
      sell: sellHistory.filter((item) =>
        item.registrationNumber?.toLowerCase().includes(lowerSearchTerm)
      ),
      service: serviceBills.filter((item) =>
        item.registrationNumber?.toLowerCase().includes(lowerSearchTerm)
      ),
    };
  };

  const filteredData = getFilteredData();

  const handleDownload = async (billId) => {
    try {
      const response = await axios.get(
        `https://ok-motor.onrender.com/api/service-bills/${billId}/download`,
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
      link.setAttribute("download", `service-bill-${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service bill?")) {
      try {
        await axios.delete(`https://ok-motor.onrender.com/api/service-bills/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setServiceBills(serviceBills.filter((bill) => bill._id !== id));
      } catch (error) {
        console.error("Error deleting service bill:", error);
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
            style={{ width: "7.5rem", height: "7.5rem", color: "#7c3aed" }}
          />
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
            <h1 style={styles.pageTitle}>Service History</h1>
            <p style={styles.pageSubtitle}>
              {showVehicleHistory
                ? `Showing history for vehicle: ${searchTerm}`
                : "View and manage all your service bills"}
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by registration number..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
            </div>
            <button
              style={styles.newBillButton}
              onClick={() => navigate("/service/create")}
            >
              <FileText size={16} style={styles.buttonIcon} />
              New Service Bill
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading data...</p>
            </div>
          ) : showVehicleHistory ? (
            <>
              {/* 1. Purchase History Table - Always shown with heading */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
                  Purchase History
                </h3>
                {filteredData.purchase.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Seller</th>
                          <th style={styles.tableHeader}>Vehicle</th>
                          <th style={styles.tableHeader}>Reg No.</th>
                          <th style={styles.tableHeader}>Purchase Date</th>
                          <th style={styles.tableHeader}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.purchase.map((item) => (
                          <tr key={item._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{item.sellerName}</td>
                            <td style={styles.tableCell}>
                              {item.vehicleBrand} {item.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>{item.registrationNumber}</td>
                            <td style={styles.tableCell}>
                              {new Date(item.purchaseDate).toLocaleDateString()}
                            </td>
                            <td style={styles.tableCell}>
                              ₹{item.purchaseAmount?.toFixed(2) || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#64748b' }}>No purchase records found</p>
                )}
              </div>
          
              {/* 2. Sell History Table - Always shown with heading */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
                  Sell History
                </h3>
                {filteredData.sell.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Buyer</th>
                          <th style={styles.tableHeader}>Vehicle</th>
                          <th style={styles.tableHeader}>Reg No.</th>
                          <th style={styles.tableHeader}>Sell Date</th>
                          <th style={styles.tableHeader}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.sell.map((item) => (
                          <tr key={item._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{item.buyerName}</td>
                            <td style={styles.tableCell}>
                              {item.vehicleBrand} {item.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>{item.registrationNumber}</td>
                            <td style={styles.tableCell}>
                              {new Date(item.sellDate).toLocaleDateString()}
                            </td>
                            <td style={styles.tableCell}>
                              ₹{item.sellAmount?.toFixed(2) || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#64748b' }}>No sell records found</p>
                )}
              </div>
          
              {/* 3. Service History Table - Always shown with heading */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
                  Service History
                </h3>
                {filteredData.service.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Customer</th>
                          <th style={styles.tableHeader}>Vehicle</th>
                          <th style={styles.tableHeader}>Reg No.</th>
                          <th style={styles.tableHeader}>Amount</th>
                          <th style={styles.tableHeader}>Date</th>
                          <th style={styles.tableHeader}>Status</th>
                          <th style={styles.tableHeader}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.service.map((bill) => (
                          <tr key={bill._id} style={styles.tableRow}>
                            <td style={styles.tableCell}>{bill.customerName}</td>
                            <td style={styles.tableCell}>
                              {bill.vehicleBrand} {bill.vehicleModel}
                            </td>
                            <td style={styles.tableCell}>{bill.registrationNumber}</td>
                            <td style={styles.tableCell}>
                              ₹{bill.grandTotal?.toFixed(2) || 0}
                            </td>
                            <td style={styles.tableCell}>
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </td>
                            <td style={styles.tableCell}>
                              <span
                                style={{
                                  ...styles.statusBadge,
                                  ...(bill.paymentStatus === "paid"
                                    ? styles.statusPaid
                                    : bill.paymentStatus === "partial"
                                    ? styles.statusPartial
                                    : styles.statusPending),
                                }}
                              >
                                {bill.paymentStatus}
                              </span>
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
                ) : (
                  <p style={{ color: '#64748b' }}>No service records found</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Customer</th>
                      <th style={styles.tableHeader}>Vehicle</th>
                      <th style={styles.tableHeader}>Reg No.</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceBills.map((bill) => (
                      <tr key={bill._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{bill.customerName}</td>
                        <td style={styles.tableCell}>
                          {bill.vehicleBrand} {bill.vehicleModel}
                        </td>
                        <td style={styles.tableCell}>
                          {bill.registrationNumber}
                        </td>
                        <td style={styles.tableCell}>
                          ₹{bill.grandTotal?.toFixed(2) || 0}
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(bill.paymentStatus === "paid"
                                ? styles.statusPaid
                                : bill.paymentStatus === "partial"
                                ? styles.statusPartial
                                : styles.statusPending),
                            }}
                          >
                            {bill.paymentStatus}
                          </span>
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

export default ServiceHistory;
