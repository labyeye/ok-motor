import { useState, useEffect, useContext } from "react";
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
  Target,
  RefreshCw,
  Bike,
  Facebook,
  Instagram,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import logo from "../images/company.png";
import logo1 from "../images/dash.png";
import AuthContext from "../context/AuthContext";
import axios from "axios";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminPage = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [dashboardData, setDashboardData] = useState({
    totalBuyLetters: 0,
    totalSellLetters: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    profit: 0,
    ownerName: user?.name || "",
    recentTransactions: {
      buy: [],
      sell: [],
      service: [],
      advance: [],
    },
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && activeMenu === "Dashboard") {
      fetchDashboardData();
    }
  }, [user, activeMenu]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const endpoint =
        user?.role === "admin"
          ? "https://ok-motor.onrender.com/api/dashboard/stats"
          : "https://ok-motor.onrender.com/api/dashboard/owner-stats";

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setDashboardData({
        ...response.data.data,
        ownerName: user?.name || "Admin",
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard data. Please try again."
      );
      if (err.response?.status === 401) {
        // Handle unauthorized error (token expired or invalid)
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-IN", options);
  };

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

  const monthlyChartData = {
    labels: dashboardData.monthlyData?.map((item) => item.month) || [],
    datasets: [
      {
        label: "Buy Amount",
        data: dashboardData.monthlyData?.map((item) => item.buyAmount) || [],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
      {
        label: "Sell Amount",
        data: dashboardData.monthlyData?.map((item) => item.sellAmount) || [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
    ],
  };

  const profitChartData = {
    labels: dashboardData.monthlyData?.map((item) => item.month) || [],
    datasets: [
      {
        label: "Profit",
        data: dashboardData.monthlyData?.map((item) => item.profit) || [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
    ],
  };

  const transactionTypeData = {
    labels: ["Buy", "Sell", "Service"],
    datasets: [
      {
        data: [
          dashboardData.totalBuyLetters || 0,
          dashboardData.totalSellLetters || 0,
          dashboardData.recentTransactions?.service?.length || 0,
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.7)",
        ],
        borderColor: [
          "rgba(37, 99, 235, 1)",
          "rgba(5, 150, 105, 1)",
          "rgba(217, 119, 6, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#ffffff",
        },
      },
      title: {
        display: true,
        color: "#ffffff",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    maintainAspectRatio: false,
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#ffffff",
        },
      },
      title: {
        display: true,
        color: "#ffffff",
      },
    },
    maintainAspectRatio: false,
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
    {
      name: "Staff",
      icon: Users,
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
    {
      name: "Vehicle History",
      icon: Bike,
      path: "/bike-history",
    },
  ];

  const DashboardCards = () => (
    <div className="cards-grid">
      {loading ? (
        Array(4)
          .fill()
          .map((_, index) => (
            <div
              key={index}
              className={`card shimmer ${
                ["blue", "green", "purple", "amber"][index]
              }`}
            >
              <div className="card-content">
                <div>
                  <p className="card-label">Loading...</p>
                  <p className="card-value">-</p>
                </div>
                <div className="card-icon">
                  {
                    [
                      <FileText />,
                      <TrendingUp />,
                      <ShoppingCart />,
                      <Target />,
                    ][index]
                  }
                </div>
              </div>
            </div>
          ))
      ) : error ? (
        <div className="card error-card">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="card blue">
            <div className="card-content">
              <div>
                <p className="card-label">Total Buy Letters</p>
                <p className="card-value">{dashboardData.totalBuyLetters}</p>
              </div>
              <div className="card-icon">
                <FileText />
              </div>
            </div>
          </div>

          <div className="card green">
            <div className="card-content">
              <div>
                <p className="card-label">Total Sell Letters</p>
                <p className="card-value">{dashboardData.totalSellLetters}</p>
              </div>
              <div className="card-icon">
                <TrendingUp />
              </div>
            </div>
          </div>

          <div className="card purple">
            <div className="card-content">
              <div>
                <p className="card-label">Total Purchase Value</p>
                <p className="card-value currency">
                  {formatCurrency(dashboardData.totalBuyValue)}
                </p>
              </div>
              <div className="card-icon">
                <ShoppingCart />
              </div>
            </div>
          </div>

          <div className="card amber">
            <div className="card-content">
              <div>
                <p className="card-label">Total Profit</p>
                <p
                  className={`card-value currency ${
                    dashboardData.profit >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatCurrency(dashboardData.profit)}
                </p>
              </div>
              <div className="card-icon">
                <Target />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const RevenueCard = () => (
    <div className="revenue-card">
      <h3 className="revenue-title">Business Revenue Overview</h3>
      {loading ? (
        <div className="revenue-grid">
          {Array(3)
            .fill()
            .map((_, index) => (
              <div key={index} className="revenue-item shimmer">
                <p className="revenue-label">Loading...</p>
                <p className="revenue-value">-</p>
              </div>
            ))}
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : (
        <div className="revenue-grid">
          <div className="revenue-item">
            <p className="revenue-label">Total Business Purchases</p>
            <p className="revenue-value negative">
              {formatCurrency(dashboardData.totalBuyValue)}
            </p>
          </div>
          <div className="revenue-item">
            <p className="revenue-label">Total Business Sales</p>
            <p className="revenue-value positive">
              {formatCurrency(dashboardData.totalSellValue)}
            </p>
          </div>
          <div className="revenue-item">
            <p className="revenue-label">Net Profit/Loss</p>
            <p
              className={`revenue-value ${
                dashboardData.profit >= 0 ? "positive" : "negative"
              }`}
            >
              {formatCurrency(dashboardData.profit)}
              {dashboardData.totalBuyValue > 0 && (
                <span className="profit-percentage">
                  {dashboardData.profit >= 0 ? "Profit" : "Loss"}:{" "}
                  {Math.abs(
                    (dashboardData.profit / dashboardData.totalBuyValue) * 100
                  ).toFixed(2)}
                  %
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const ChartsSection = () => {
    if (loading) {
      return (
        <div className="charts-container">
          {Array(3)
            .fill()
            .map((_, index) => (
              <div key={index} className="chart-card shimmer">
                <h3 className="chart-title">Loading...</h3>
                <div className="chart-wrapper">
                  <RefreshCw className="spinner" />
                </div>
              </div>
            ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="charts-container">
          <div className="chart-card error">
            <p>{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="charts-container">
        <div className="chart-card">
          <h3 className="chart-title">Monthly Transactions</h3>
          <div className="chart-wrapper">
            {dashboardData.monthlyData?.length > 0 ? (
              <Bar data={monthlyChartData} options={chartOptions} />
            ) : (
              <p className="no-data">No transaction data available</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Monthly Profit</h3>
          <div className="chart-wrapper">
            {dashboardData.monthlyData?.length > 0 ? (
              <Bar data={profitChartData} options={chartOptions} />
            ) : (
              <p className="no-data">No profit data available</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Transaction Types</h3>
          <div className="chart-wrapper">
            <Pie data={transactionTypeData} options={pieOptions} />
          </div>
        </div>
      </div>
    );
  };
  const RecentTransactions = () => {
    const renderTransactionList = (transactions) => {
      if (loading) {
        return Array(3)
          .fill()
          .map((_, index) => (
            <div key={index} className="transaction-item shimmer">
              <div className="transaction-info">
                <p className="transaction-bike">Loading...</p>
                <p className="transaction-customer">-</p>
              </div>
              <div className="transaction-details">
                <p className="transaction-date">-</p>
                <p className="transaction-amount">-</p>
              </div>
            </div>
          ));
      }

      if (error) {
        return <p className="error-message">{error}</p>;
      }

      if (!transactions || transactions.length === 0) {
        return <p className="no-data">No recent transactions</p>;
      }

      return transactions.map((transaction, index) => (
        <div key={index} className="transaction-item">
          <div className="transaction-info">
            <p className="transaction-bike">{transaction.vehicle || "-"}</p>
            <p className="transaction-customer">
              {transaction.name}{" "}
              {transaction.serviceType ? `(${transaction.serviceType})` : ""}
            </p>
          </div>
          <div className="transaction-details">
            <p className="transaction-date">{formatDate(transaction.date)}</p>
            <p className="transaction-amount">
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>
      ));
    };

    return (
      <div className="transactions-container">
        <div className="transaction-card">
          <h3 className="transaction-title">
            <ShoppingCart size={18} />
            Recent Purchases
          </h3>
          <div className="transaction-list">
            {renderTransactionList(dashboardData.recentTransactions?.buy)}
          </div>
        </div>

        <div className="transaction-card">
          <h3 className="transaction-title">
            <TrendingUp size={18} />
            Recent Sales
          </h3>
          <div className="transaction-list">
            {renderTransactionList(dashboardData.recentTransactions?.sell)}
          </div>
        </div>

        <div className="transaction-card">
          <h3 className="transaction-title">
            <Wrench size={18} />
            Recent Services
          </h3>
          <div className="transaction-list">
            {renderTransactionList(dashboardData.recentTransactions?.service)}
          </div>
        </div>

        <div className="transaction-card">
          <h3 className="transaction-title">
            <FileText size={18} />
            Recent Advances
          </h3>
          <div className="transaction-list">
            {renderTransactionList(dashboardData.recentTransactions?.advance)}
          </div>
        </div>
      </div>
    );
  };

  const QuickActions = () => (
    <div className="quick-actions-card">
      <h3 className="quick-actions-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        <button
          className="quick-action-button blue"
          onClick={() => navigate("/buy/create")}
        >
          <ShoppingCart size={24} />
          <p className="quick-action-title">Create Buy Letter</p>
          <p className="quick-action-subtitle">Add new purchase</p>
        </button>
        <button
          className="quick-action-button green"
          onClick={() => navigate("/sell/create")}
        >
          <TrendingUp size={24} />
          <p className="quick-action-title">Create Sell Letter</p>
          <p className="quick-action-subtitle">Record new sale</p>
        </button>
        <button
          className="quick-action-button purple"
          onClick={() => navigate("/service/create")}
        >
          <Wrench size={24} />
          <p className="quick-action-title">Service Bill</p>
          <p className="quick-action-subtitle">Create service record</p>
        </button>
        <button
          className="quick-action-button amber"
          onClick={() => navigate("/staff/create")}
        >
          <Users size={24} />
          <p className="quick-action-title">Add Staff</p>
          <p className="quick-action-subtitle">Register new staff</p>
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="logo" className="brand-logo" />
          <p className="sidebar-subtitle">Welcome, {user?.name || "User"}</p>
        </div>

        <nav className="nav">
          {menuItems.map((item) => (
            <div key={item.name}>
              <div
                className={`menu-item ${
                  activeMenu === item.name ? "active" : ""
                }`}
                onClick={() => {
                  if (item.submenu) {
                    toggleMenu(item.name);
                  } else {
                    handleMenuClick(item.name, item.path);
                  }
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

              {item.submenu && expandedMenus[item.name] && (
                <div className="submenu">
                  {item.submenu.map((subItem) => (
                    <div
                      key={subItem.name}
                      className="submenu-item"
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

          <div className="logout-button" onClick={handleLogout}>
            <LogOut size={20} className="menu-icon" />
            <span className="menu-text">Logout</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-padding">
          <div className="banner">
            <img src={logo1} alt="Company Logo" className="banner-logo" />
          </div>

          {activeMenu === "Dashboard" && (
            <>
              <DashboardCards />
              <RevenueCard />
              <RecentTransactions />
              <ChartsSection />

              {!loading && !error && <QuickActions />}
            </>
          )}

          {activeMenu !== "Dashboard" && (
            <div className="placeholder-card">
              <h2>{activeMenu}</h2>
              <p>
                This section is under development. Content for {activeMenu} will
                be implemented here.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f3f4f6;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: rgba(30, 41, 59, 0.9);
          backdrop-filter: blur(10px);
          color: #f8fafc;
          position: sticky;
          top: 0;
          height: 100vh;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 10;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .brand-logo {
          width: 100%;
          max-width: 25rem; /* Adjust as needed */
          height: 13rem; /* Adjust for height */
          object-fit: cover; /* or 'cover' if you want to crop edges */
          object-position: center; /* centers the image content */
          display: block;
          margin: 0 auto 1rem auto;
        }

        .sidebar-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0;
        }

        .nav {
          padding: 1rem 0;
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

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .menu-item.active {
          background: rgba(59, 130, 246, 0.2);
          border-right: 3px solid #3b82f6;
          color: #ffffff;
        }

        .menu-item-content {
          display: flex;
          align-items: center;
        }

        .menu-icon {
          margin-right: 0.75rem;
          color: #94a3b8;
        }

        .menu-item.active .menu-icon {
          color: #ffffff;
        }

        .menu-text {
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .submenu {
          background: rgba(26, 32, 44, 0.7);
        }

        .submenu-item {
          padding: 0.625rem 1.5rem 0.625rem 4rem;
          cursor: pointer;
          color: #cbd5e1;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .submenu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .logout-button {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          color: #f87171;
          margin-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          overflow-y: auto;
        }

        .content-padding {
          padding: 2rem;
        }

        .banner {
          background-color: #1e293b;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border-radius: 0.75rem;
        }

        .banner-logo {
          height: 490px;
          width: 1550px;
          object-fit: cover;
          margin-bottom: -0.5rem;
          margin-left: -1rem;
          margin-top: -0.5rem;
          margin-right: -1rem;
        }

        /* Dashboard Cards */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .card.blue {
          border-left: 4px solid #3b82f6;
        }

        .card.green {
          border-left: 4px solid #10b981;
        }

        .card.purple {
          border-left: 4px solid #8b5cf6;
        }

        .card.amber {
          border-left: 4px solid #f59e0b;
        }

        .card-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin: 0;
        }

        .card-value {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0.25rem 0 0 0;
        }

        .card-value.currency {
          font-size: 1.5rem;
        }

        .card-value.positive {
          color: #10b981;
        }

        .card-value.negative {
          color: #ef4444;
        }

        .card-icon {
          padding: 0.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card.blue .card-icon {
          background-color: #dbeafe;
        }

        .card.green .card-icon {
          background-color: #d1fae5;
        }

        .card.purple .card-icon {
          background-color: #ede9fe;
        }

        .card.amber .card-icon {
          background-color: #fef3c7;
        }

        /* Revenue Card */
        .revenue-card {
          background: rgba(30, 41, 59, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .revenue-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem 0;
        }

        .revenue-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .revenue-item {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
          transition: transform 0.2s;
        }

        .revenue-item:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.15);
        }

        .revenue-label {
          font-size: 0.875rem;
          color: #e2e8f0;
          margin: 0;
        }

        .revenue-value {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.25rem 0 0 0;
        }

        .revenue-value.positive {
          color: #10b981;
        }

        .revenue-value.negative {
          color: #ef4444;
        }

        .profit-percentage {
          font-size: 0.875rem;
          display: block;
          margin-top: 0.25rem;
        }

        /* Charts */
        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: rgba(30, 41, 59, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem 0;
        }

        .chart-wrapper {
          height: 300px;
          width: 100%;
        }

        .no-data {
          color: #ffffff;
          text-align: center;
          padding: 1.25rem;
          opacity: 0.7;
        }

        /* Transactions */
        .transactions-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .transaction-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .transaction-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(249, 250, 251, 0.7);
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .transaction-item:hover {
          background: rgba(243, 244, 246, 0.9);
        }

        .transaction-info {
          display: flex;
          flex-direction: column;
        }

        .transaction-bike {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
          margin: 0;
        }

        .transaction-customer,
        .transaction-service {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0.125rem 0 0 0;
        }

        .transaction-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .transaction-date {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .transaction-amount {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
          margin: 0.125rem 0 0 0;
        }

        /* Social Media */
        .social-media-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .social-media-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .social-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .social-media-link {
          text-decoration: none;
        }

        .social-media-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(249, 250, 251, 0.7);
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .social-media-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          background: rgba(243, 244, 246, 0.9);
        }

        .social-media-item span {
          margin-top: 0.5rem;
          color: #1f2937;
          font-weight: 500;
        }

        /* Quick Actions */
        .quick-actions-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .quick-actions-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .quick-action-button {
          padding: 1rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: transform 0.2s;
          background: rgba(249, 250, 251, 0.7);
          display: flex;
          flex-direction: column;
        }

        .quick-action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .quick-action-button.blue {
          background: rgba(219, 234, 254, 0.7);
        }

        .quick-action-button.green {
          background: rgba(209, 250, 229, 0.7);
        }

        .quick-action-button.purple {
          background: rgba(237, 233, 254, 0.7);
        }

        .quick-action-button.amber {
          background: rgba(254, 243, 199, 0.7);
        }

        .quick-action-title {
          font-weight: 500;
          color: #1f2937;
          margin: 0.5rem 0 0 0;
        }

        .quick-action-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }

        /* Placeholder Card */
        .placeholder-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .placeholder-card h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .placeholder-card p {
          color: #6b7280;
          margin: 0;
        }

        /* Error States */
        .error-card {
          grid-column: 1 / -1;
          text-align: center;
          color: #ef4444;
        }

        .error-message {
          color: #ef4444;
          text-align: center;
        }

        .retry-button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          margin-top: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background-color: #2563eb;
        }

        /* Loading States */
        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive Styles */
        @media (max-width: 1024px) {
          .sidebar {
            width: 240px;
          }
        }

        @media (max-width: 768px) {
          .admin-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
          }

          .content-padding {
            padding: 1rem;
          }

          .banner-logo {
            height: 240px;
            width: 320px;
          }

          .charts-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .revenue-grid {
            grid-template-columns: 1fr;
          }

          .transactions-container {
            grid-template-columns: 1fr;
          }

          .social-media-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .banner-logo {
            height: 180px;
            width: 240px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
