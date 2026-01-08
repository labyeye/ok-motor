import { useState, useEffect, useContext, useCallback, useRef } from "react";
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
  Search,
  FileText,
  Target,
  RefreshCw,
  Image as ImageIcon,
  Bike,
  Menu,
  X,
  Settings,
  Megaphone,
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
import BikeHistory from "../components/BikeHistory";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const historyInputRef = useRef(null);
  const [dashboardData, setDashboardData] = useState({
    totalBuyLetters: 0,
    totalSellLetters: 0,
    totalServices: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    totalServiceValue: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    profitPercentage: 0,
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
  const [freeServices, setFreeServices] = useState([]);
  const [freeServicesLoading, setFreeServicesLoading] = useState(true);
  const [freeSearch, setFreeSearch] = useState("");
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const endpoint =
        user?.role === "admin"
          ? "https://ok-motor-51l3.vercel.app/api/dashboard/stats"
          : "https://ok-motor-51l3.vercel.app/api/dashboard/owner-stats";

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
  }, [user, logout, navigate]);
  const fetchFreeServicesData = useCallback(async (search = "") => {
    try {
      setFreeServicesLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const endpoint = "https://ok-motor-51l3.vercel.app/api/dashboard/free-services";
      const params = { limit: 10 };
      if (search && String(search).trim() !== "") params.search = String(search).trim();

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // ensure dates are normalized on client
      const items = (response.data.data || []).map((row) => ({
        ...row,
        saleDate: row.saleDate || null,
        month1: row.month1 || null,
        month2: row.month2 || null,
        month3: row.month3 || null,
      }));

      // server already sorts and limits, but ensure consistent ordering
      items.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
      setFreeServices(items);
    } catch (err) {
      console.error("Error fetching free services data:", err);
    } finally {
      setFreeServicesLoading(false);
    }
  }, []);
  useEffect(() => {
    if (user && activeMenu === "Dashboard") {
      fetchDashboardData();
      // initial load with no search
      fetchFreeServicesData();
    }
  }, [user, activeMenu, fetchDashboardData, fetchFreeServicesData]);

  // Debounce free services search and fetch from server
  useEffect(() => {
    if (!user || activeMenu !== "Dashboard") return;

    const handle = setTimeout(() => {
      fetchFreeServicesData(freeSearch || "");
    }, 400);

    return () => clearTimeout(handle);
  }, [freeSearch, user, activeMenu, fetchFreeServicesData]);

  

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
        label: "Buy Amount (Expenses)",
        data: dashboardData.monthlyData?.map((item) => item.buyAmount) || [],
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgba(239, 68, 68, 1)",
      },
      {
        label: "Sell Amount (Revenue)",
        data: dashboardData.monthlyData?.map((item) => item.sellAmount) || [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgba(16, 185, 129, 1)",
      },
      {
        label: "Service Amount (Revenue)",
        data:
          dashboardData.monthlyData?.map((item) => item.serviceAmount) || [],
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderColor: "rgba(245, 158, 11, 1)",
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
          dashboardData.totalServices || 0,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.7)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
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
      icon: ImageIcon,
      path: "/gallery/manage",
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
                <p className="card-label">Total Services</p>
                <p className="card-value">{dashboardData.totalServices}</p>
              </div>
              <div className="card-icon">
                <Wrench />
              </div>
            </div>
          </div>

          <div className="card green">
            <div className="card-content">
              <div>
                <p className="card-label">Total Revenue</p>
                <p className="card-value currency positive">
                  {formatCurrency(dashboardData.totalRevenue)}
                </p>
              </div>
              <div className="card-icon">
                <TrendingUp />
              </div>
            </div>
          </div>

          <div className="card purple">
            <div className="card-content">
              <div>
                <p className="card-label">Total Expenses</p>
                <p className="card-value currency negative">
                  {formatCurrency(dashboardData.totalExpenses)}
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
                <p className="card-label">Net Profit</p>
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
          {Array(4)
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
            <p className="revenue-label">Total Revenue from Service</p>
            <p className="revenue-value positive">
              {formatCurrency(dashboardData.totalServiceValue)}
            </p>
            <small className="revenue-detail">
              {dashboardData.totalServices} services completed
            </small>
          </div>
          <div className="revenue-item">
            <p className="revenue-label">Total Revenue from Sales</p>
            <p className="revenue-value positive">
              {formatCurrency(dashboardData.totalSellValue)}
            </p>
            <small className="revenue-detail">
              {dashboardData.totalSellLetters} vehicles sold
            </small>
          </div>
          <div className="revenue-item">
            <p className="revenue-label">Total Expenses from Purchases</p>
            <p className="revenue-value negative">
              {formatCurrency(dashboardData.totalBuyValue)}
            </p>
            <small className="revenue-detail">
              {dashboardData.totalBuyLetters} vehicles purchased
            </small>
          </div>
          <div className="revenue-item">
            <p className="revenue-label">Net Profit/Loss</p>
            <p
              className={`revenue-value ${
                dashboardData.profit >= 0 ? "positive" : "negative"
              }`}
            >
              {formatCurrency(dashboardData.profit)}
            </p>
            <small className="revenue-detail">
              {dashboardData.profit >= 0 ? "Profit" : "Loss"}:{" "}
              {Math.abs(dashboardData.profitPercentage).toFixed(2)}%
            </small>
          </div>
        </div>
      )}

      {/* Additional Revenue Summary */}
      {!loading && !error && (
        <div className="revenue-summary">
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Total Revenue:</span>
              <span className="summary-value positive">
                {formatCurrency(dashboardData.totalRevenue)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Expenses:</span>
              <span className="summary-value negative">
                {formatCurrency(dashboardData.totalExpenses)}
              </span>
            </div>
          </div>
          <div className="summary-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Service Revenue:</span>
              <span className="breakdown-value positive">
                {formatCurrency(dashboardData.totalServiceValue)}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Sales Revenue:</span>
              <span className="breakdown-value positive">
                {formatCurrency(dashboardData.totalSellValue)}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Purchase Expenses:</span>
              <span className="breakdown-value negative">
                {formatCurrency(dashboardData.totalBuyValue)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ChartsSection = () => {
    if (loading) {
      return (
        <div className="charts-container">
          {Array(4)
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

        <div className="chart-card">
          <h3 className="chart-title">Revenue Breakdown</h3>
          <div className="chart-wrapper">
            <Pie
              data={{
                labels: [
                  "Service Revenue",
                  "Sales Revenue",
                  "Purchase Expenses",
                ],
                datasets: [
                  {
                    data: [
                      dashboardData.totalServiceValue || 0,
                      dashboardData.totalSellValue || 0,
                      dashboardData.totalBuyValue || 0,
                    ],
                    backgroundColor: [
                      "rgba(245, 158, 11, 0.7)",
                      "rgba(16, 185, 129, 0.7)",
                      "rgba(239, 68, 68, 0.7)",
                    ],
                    borderColor: [
                      "rgba(217, 119, 6, 1)",
                      "rgba(5, 150, 105, 1)",
                      "rgba(239, 68, 68, 1)",
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={pieOptions}
            />
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

  const FreeServicesTable = () => {
    const freeSearchRef = useRef(null);
    const normalize = (s = "") =>
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const q = normalize(freeSearch);
    const filtered = q
      ? freeServices.filter((row) => normalize(row.registrationNumber).includes(q))
      : freeServices;

    // prepare processed rows with reminder info and sort by urgency
    const processed = filtered.map((row) => {
      const months = [row.month1 || null, row.month2 || null, row.month3 || null];
      const used = row.usedCount || 0;
      const today = new Date();

      const pending = months
        .map((m, idx) => ({
          idx: idx + 1,
          date: m ? new Date(m) : new Date(new Date(row.saleDate).setMonth(new Date(row.saleDate).getMonth() + (idx + 1))),
        }))
        .filter((p) => p.idx > used);

      const pendingWithDays = pending.map((p) => {
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntil = Math.ceil((p.date - today) / msPerDay);
        return { ...p, daysUntil };
      });

      // pick next pending: sort pendingWithDays ascending (overdue negatives first)
      pendingWithDays.sort((a, b) => a.daysUntil - b.daysUntil);

      const nextPending = pendingWithDays.length > 0 ? pendingWithDays[0] : null;

      const reminderScore = nextPending ? nextPending.daysUntil : 999999;

      return { row, months, used, pendingWithDays, nextPending, reminderScore };
    });

    processed.sort((a, b) => a.reminderScore - b.reminderScore);

    const ordinal = (n) => {
      if (n === 1) return "1st";
      if (n === 2) return "2nd";
      if (n === 3) return "3rd";
      return `${n}th`;
    };

    return (
      <div className="free-services-card">
        <h3 className="card-title">Free Service Usage (Sold Vehicles)</h3>

        <div className="free-services-search">
          <div className="history-search-box" style={{ width: 320 }}>
              <Search size={18} className="history-search-icon" />
              <input
                ref={freeSearchRef}
                type="text"
                placeholder="Search by reg. number..."
                value={freeSearch}
                onChange={(e) => setFreeSearch(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                autoComplete="off"
                className="history-search-input"
              />
            </div>
        </div>

        {freeServicesLoading ? (
          <div className="table-loading">Loading free service data...</div>
        ) : filtered.length === 0 ? (
          <div className="no-data">No free service records available</div>
        ) : (
          <div className="table-wrapper">
            <table className="free-services-table">
              <thead>
                <tr>
                  <th>Sell Letter Date</th>
                  <th>Buyer Name</th>
                  <th>Registration Number</th>
                  <th>Vehicle Brand</th>
                  <th>Vehicle Model</th>
                  <th>Month 1 - Free Service</th>
                  <th>Month 2 - Free Service</th>
                  <th>Month 3 - Free Service</th>
                  <th>Used</th>
                  <th>Reminder</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((item, idx) => {
                  const { row, nextPending, used } = item;
                  return (
                    <tr
                      key={`${row.registrationNumber}-${idx}`}
                      onClick={() => {
                        if (row.registrationNumber) {
                          setHistoryQuery(row.registrationNumber);
                          setIsHistoryModalOpen(true);
                        }
                      }}
                    >
                      <td>{formatDate(row.saleDate)}</td>
                      <td>{row.buyerName || "-"}</td>
                      <td>{row.registrationNumber || "-"}</td>
                      <td>{row.vehicleBrand || "-"}</td>
                      <td>{row.vehicleModel || "-"}</td>
                      <td>{row.month1 ? formatDate(row.month1) : "-"}</td>
                      <td>{row.month2 ? formatDate(row.month2) : "-"}</td>
                      <td>{row.month3 ? formatDate(row.month3) : "-"}</td>
                      <td>{(row.usedCount || 0) + "/3"}</td>
                      <td>
                        {(() => {
                          if ((row.usedCount || 0) >= 3) return <span>All free services done</span>;
                          if (!nextPending) return <span>Pending</span>;

                          const days = nextPending.daysUntil;
                          const ord = ordinal(nextPending.idx);
                          if (days < 0) {
                            return (
                              <span style={{ color: "#ef4444" }}>
                                {ord} service overdue by {Math.abs(days)}d
                              </span>
                            );
                          }
                          if (days === 0) {
                            return <span style={{ color: "#f59e0b" }}>{ord} service due today</span>;
                          }
                          return <span style={{ color: "#10b981" }}>{ord} service due in {days}d</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // NOTE: removed automatic refocus when modal closes to avoid reopen loop
  // (closing modal previously focused the search input which re-opened the modal)

  return (
    <div className="admin-container">
      <div className="top-bar">
        <div
          className="hamburger-menu"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} /> : <Menu size={35} />}
        </div>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${
          isSidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
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

              {item.submenu && (
                <div
                  className={`submenu${
                    expandedMenus[item.name]
                      ? " submenu-open"
                      : " submenu-closed"
                  }`}
                  style={{
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
      <div className="main-content">
        <div className="content-padding">
          <div className="banner">
            <img src={logo1} alt="Company Logo" className="banner-logo" />
          </div>

          <div className="history-search-container">
            <div className="history-search-box">
              <Search size={18} className="history-search-icon" />
              <input
                type="text"
                placeholder="Search vehicles (reg. no, model, name)..."
                value={historyQuery}
                ref={historyInputRef}
                onFocus={() => setIsHistoryModalOpen(true)}
                onChange={(e) => {
                  setHistoryQuery(e.target.value);
                  if (!isHistoryModalOpen) setIsHistoryModalOpen(true);
                }}
                className="history-search-input"
              />
            </div>
          </div>

          {activeMenu === "Dashboard" && (
            <>
              <DashboardCards />
              <FreeServicesTable />
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

      {isHistoryModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="modal-close"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                <X />
              </button>
            </div>
            <BikeHistory externalSearchTerm={historyQuery} />
          </div>
        </div>
      )}

      <style>{`
      .top-bar{
        padding: 1rem;
        background: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
        .admin-container {
          display: flex;
          min-height: 100vh;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f3f4f6;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 14;
        }

        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block;
          }
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: #1E283A;
          color: #f8fafc;
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 10;
          transition: transform 0.3s ease;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
        }
        .submenu.submenu-open {
          max-height: 500px;
          opacity: 1;
        }
        .submenu.submenu-closed {
          max-height: 0;
          opacity: 0;
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
          height: 100%;
          width: 100%;
          object-fit: cover;
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

        .card-value.currency.positive {
          color: #10b981;
        }

        .card-value.currency.negative {
          color: #ef4444;
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
          background: #1e293b;
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

        .revenue-detail {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.25rem;
          display: block;
        }

        .revenue-summary {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #e2e8f0;
          margin-bottom: 0.5rem;
        }

        .summary-value {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .summary-value.positive {
          color: #10b981;
        }

        .summary-value.negative {
          color: #ef4444;
        }

        .summary-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .breakdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          padding: 0.75rem;
        }

        .breakdown-label {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.25rem;
          text-align: center;
        }

        .breakdown-value {
          font-size: 1rem;
          font-weight: 600;
        }

        .breakdown-value.positive {
          color: #10b981;
        }

        .breakdown-value.negative {
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
          background: #1e293b;
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
        .hamburger-menu {
          display: none;
        }

        .top-bar {
          display: none;
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 240px;
          }
        }

        @media (max-width: 768px) {
          .hamburger-menu {
            display: block;
          }

          .top-bar {
            display: block;
          }

          .sidebar-overlay {
            display: block;
          }

          .admin-container {
            flex-direction: column;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 15;
          }

          .sidebar.sidebar-open {
            transform: translateX(0);
          }

          .sidebar.sidebar-closed {
            transform: translateX(-100%);
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

        /* Free Services table */
        .free-services-card {
          background: rgba(255,255,255,0.95);
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 10px rgba(2,6,23,0.06);
        }

        .free-services-search {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 0.75rem;
        }

        .free-services-card .card-title {
          margin: 0 0 0.75rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .free-services-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .free-services-table th,
        .free-services-table td {
          padding: 0.5rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid #eef2f7;
        }

        .free-services-table thead th {
          color: #374151;
          font-weight: 600;
          background: transparent;
        }

        .free-services-table tbody tr:hover {
          background: #f8fafc;
          cursor: pointer;
        }

        .table-loading {
          padding: 1rem;
          color: #6b7280;
        }

        /* History search box */
        .history-search-container {
          display: flex;
          justify-content: center;
          margin: 1rem 0 1.5rem 0;
        }

        .history-search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 640px;
          max-width: 100%;
          background: #ffffff;
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 6px 18px rgba(16,24,40,0.08);
          border: 1px solid #e6edf3;
        }

        .history-search-icon {
          color: #64748b;
          flex: 0 0 24px;
        }

        .history-search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.95rem;
          padding: 6px 4px;
        }

        /* Modal styles for vehicle history */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          width: 100%;
          max-width: 1100px;
          max-height: 90vh;
          overflow: auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 1rem 1rem 2rem 1rem;
          box-shadow: 0 10px 30px rgba(2,6,23,0.2);
        }

        .modal-close {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
