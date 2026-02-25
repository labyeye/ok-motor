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
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import logoheader from "../images/okmotor.png";
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
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
  const [freeSearch] = useState("");
  const navigate = useNavigate();

  const [extraStats, setExtraStats] = useState({
    totalVehicles: 0,
    totalBikes: 0,
    totalSold: 0,
    insuranceExpiring: 0,
    pucExpiring: 0,
    month1Pending: 0,
    month2Pending: 0,
    month3Pending: 0,
  });

  const [incompleteBuyLetters, setIncompleteBuyLetters] = useState([]);
  const [incompleteSellLetters, setIncompleteSellLetters] = useState([]);
  const [incompleteLoading, setIncompleteLoading] = useState(false);

  const fetchVehicleStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE = "https://ok-motor-51l3.vercel.app";
      const res = await axios.get(`${API_BASE}/api/vehicles?limit=2000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vehicles = res.data.vehicles || [];

      // Fetch incomplete data
      fetchIncompleteLetters();

      // Fetch sell letters for accurate sold count
      const resSellLetters = await axios.get(
        `${API_BASE}/api/sell-letters?limit=2000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Handle array or object response structure
      const sellLetters = Array.isArray(resSellLetters.data)
        ? resSellLetters.data
        : resSellLetters.data.data || [];

      // Logic to count unique sell letters (handling edits/versions)
      const uniqueSaleIds = new Set();
      sellLetters.forEach((letter) => {
        // use originalDocumentId if available (it points to the first version), else use _id
        const saleId = letter.originalDocumentId || letter._id;
        uniqueSaleIds.add(saleId);
      });
      const totalSoldLetters = uniqueSaleIds.size;

      const totalVehicles = vehicles.length;
      const totalBikes = vehicles.filter((v) => {
        const name = (v.vehicleName || "").toLowerCase();
        const type = (v.vehicleType || "").toLowerCase();
        return (
          type.includes("bike") ||
          type.includes("scooter") ||
          type.includes("motorcycle") ||
          name.includes("bike") ||
          name.includes("scooter") ||
          name.includes("activa") ||
          name.includes("access") ||
          name.includes("honda") ||
          name.includes("hero")
        );
      }).length;

      // Use the sell letters count for "Total Sold" instead of vehicle status
      const totalSold = totalSoldLetters;

      const now = new Date();
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      let insuranceExpiring = 0;
      let pucExpiring = 0;

      sellLetters.forEach((v) => {
        if (v.insuranceExpiryDate) {
          const d = new Date(v.insuranceExpiryDate);
          if (d >= now && d <= sevenDays) insuranceExpiring++;
        }
        if (v.pucExpiryDate) {
          const d = new Date(v.pucExpiryDate);
          if (d >= now && d <= sevenDays) pucExpiring++;
        }
      });

      // Fetch standalone PUC records
      try {
        const resPUC = await axios.get(`${API_BASE}/api/puc?limit=2000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pucList = resPUC.data || [];
        pucList.forEach((p) => {
          if (p.pucExpiry) {
            const d = new Date(p.pucExpiry);
            if (d >= now && d <= sevenDays) pucExpiring++;
          }
        });
      } catch (err) {
        console.error("Error fetching puc stats", err);
      }

      // Fetch standalone Insurance records
      try {
        const resInsurance = await axios.get(
          `${API_BASE}/api/insurance?limit=2000`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const insuranceList = resInsurance.data || [];
        insuranceList.forEach((ins) => {
          if (ins.insuranceExpiry) {
            const d = new Date(ins.insuranceExpiry);
            if (d >= now && d <= sevenDays) insuranceExpiring++;
          }
        });
      } catch (err) {
        console.error("Error fetching insurance stats", err);
      }

      setExtraStats((prev) => ({
        ...prev,
        totalVehicles,
        totalBikes,
        totalSold,
        insuranceExpiring,
        pucExpiring,
      }));
    } catch (e) {
      console.error("Error fetching vehicle stats", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && activeMenu === "Dashboard") {
      fetchVehicleStats();
    }
  }, [user, activeMenu, fetchVehicleStats]);

  useEffect(() => {
    if (freeServices.length > 0) {
      let m1 = 0,
        m2 = 0,
        m3 = 0;
      freeServices.forEach((row) => {
        const used = row.usedCount || 0;
        if (used === 0) m1++;
        else if (used === 1) m2++;
        else if (used === 2) m3++;
      });
      setExtraStats((prev) => ({
        ...prev,
        month1Pending: m1,
        month2Pending: m2,
        month3Pending: m3,
      }));
    }
  }, [freeServices]);

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
          "Failed to load dashboard data. Please try again.",
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

      const endpoint =
        "https://ok-motor-51l3.vercel.app/api/dashboard/free-services";
      const params = { limit: 2000 };
      if (search && String(search).trim() !== "")
        params.search = String(search).trim();

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
      // Filter out records before Dec 2025
      const cutoffDate = new Date("2025-12-01");
      const filteredItems = items.filter((row) => {
        if (!row.saleDate) return false;
        return new Date(row.saleDate) >= cutoffDate;
      });

      filteredItems.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
      setFreeServices(filteredItems);
    } catch (err) {
      console.error("Error fetching free services data:", err);
    } finally {
      setFreeServicesLoading(false);
    }
  }, []);

  const fetchIncompleteLetters = useCallback(async () => {
    setIncompleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = "https://ok-motor-51l3.vercel.app";

      // Fetch all buy letters
      const buyRes = await axios.get(`${API_BASE}/api/buy-letter?limit=2000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const buyLetters = buyRes.data.buyLetters || [];

      // Fetch all sell letters
      const sellRes = await axios.get(
        `${API_BASE}/api/sell-letters?limit=2000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const sellLetters = Array.isArray(sellRes.data)
        ? sellRes.data
        : sellRes.data.data || [];

      // Check for missing fields in Buy Letters
      const incompleteBuy = buyLetters
        .map((letter) => {
          const missingFields = [];

          // Check required text fields
          if (!letter.sellerName || !letter.sellerName.trim())
            missingFields.push("Seller Name");
          if (!letter.sellerFatherName || !letter.sellerFatherName.trim())
            missingFields.push("Seller Father Name");
          if (
            !letter.sellerCurrentAddress ||
            !letter.sellerCurrentAddress.trim()
          )
            missingFields.push("Seller Address");
          if (!letter.vehicleName || !letter.vehicleName.trim())
            missingFields.push("Vehicle Name");
          if (!letter.registrationNumber || !letter.registrationNumber.trim())
            missingFields.push("Registration Number");
          if (!letter.buyerName || !letter.buyerName.trim())
            missingFields.push("Buyer Name");
          if (!letter.buyerFatherName || !letter.buyerFatherName.trim())
            missingFields.push("Buyer Father Name");
          if (!letter.saleAmount) missingFields.push("Sale Amount");
          if (!letter.saleDate) missingFields.push("Sale Date");
          if (!letter.witnessname || !letter.witnessname.trim())
            missingFields.push("Witness Name");
          if (!letter.witnessphone || !letter.witnessphone.trim())
            missingFields.push("Witness Phone");

          // Check documents
          if (!letter.documents?.vehicleRC?.front)
            missingFields.push("Vehicle RC Front");
          if (!letter.documents?.vehicleRC?.back)
            missingFields.push("Vehicle RC Back");
          if (!letter.documents?.aadhaar?.front)
            missingFields.push("Aadhaar Front");
          if (!letter.documents?.aadhaar?.back)
            missingFields.push("Aadhaar Back");
          if (!letter.documents?.pan) missingFields.push("PAN Card");
          if (!letter.documents?.deliveryPhoto && !letter.documents?.vehicleKM)
            missingFields.push("Delivery Photo");
          // Previously we flagged missing "Vehicle Photos" here.
          // The buy-letter model now uses separate documents: Insurance Certificate, Vehicle NOC, Vehicle Buy Receipt.
          // Flag missing Insurance Certificate if not present.
          if (
            !letter.documents?.insuranceCertificate?.pages ||
            letter.documents.insuranceCertificate.pages.length === 0
          )
            missingFields.push("Insurance Certificate");

          return {
            ...letter,
            missingFields,
          };
        })
        .filter((letter) => letter.missingFields.length > 0);

      // Check for missing fields in Sell Letters
      const incompleteSell = sellLetters
        .map((letter) => {
          const missingFields = [];

          // Check required text fields
          if (!letter.vehicleName || !letter.vehicleName.trim())
            missingFields.push("Vehicle Name");
          if (!letter.registrationNumber || !letter.registrationNumber.trim())
            missingFields.push("Registration Number");
          if (!letter.buyerName || !letter.buyerName.trim())
            missingFields.push("Buyer Name");
          if (!letter.buyerFatherName || !letter.buyerFatherName.trim())
            missingFields.push("Buyer Father Name");
          if (!letter.buyerAddress || !letter.buyerAddress.trim())
            missingFields.push("Buyer Address");
          if (!letter.buyerPhone || !letter.buyerPhone.trim())
            missingFields.push("Buyer Phone");
          if (!letter.buyerAadhar || !letter.buyerAadhar.trim())
            missingFields.push("Buyer Aadhaar");
          if (!letter.saleAmount) missingFields.push("Sale Amount");
          if (!letter.saleDate) missingFields.push("Sale Date");
          if (!letter.witnessName || !letter.witnessName.trim())
            missingFields.push("Witness Name");
          if (!letter.witnessPhone || !letter.witnessPhone.trim())
            missingFields.push("Witness Phone");

          // Check documents
          if (!letter.documents?.vehicleRC?.front)
            missingFields.push("Vehicle RC Front");
          if (!letter.documents?.vehicleRC?.back)
            missingFields.push("Vehicle RC Back");
          if (!letter.documents?.aadhaar?.front)
            missingFields.push("Aadhaar Front");
          if (!letter.documents?.aadhaar?.back)
            missingFields.push("Aadhaar Back");
          if (!letter.documents?.pan) missingFields.push("PAN Card");
          if (!letter.documents?.deliveryPhoto && !letter.documents?.vehicleKM)
            missingFields.push("Delivery Photo");
          if (
            !letter.documents?.vehiclePhotos ||
            letter.documents.vehiclePhotos.length === 0
          )
            missingFields.push("Vehicle Photos");

          return {
            ...letter,
            missingFields,
          };
        })
        .filter((letter) => letter.missingFields.length > 0);

      setIncompleteBuyLetters(incompleteBuy);
      setIncompleteSellLetters(incompleteSell);
    } catch (error) {
      console.error("Error fetching incomplete letters:", error);
    } finally {
      setIncompleteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && activeMenu === "Dashboard") {
      fetchDashboardData();
      // initial load with no search
      fetchFreeServicesData();
      fetchIncompleteLetters();
    }
  }, [
    user,
    activeMenu,
    fetchDashboardData,
    fetchFreeServicesData,
    fetchIncompleteLetters,
  ]);

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

  // Chart data removed - not currently used
  // const monthlyChartData = { ... };
  // const profitChartData = { ... };
  // const transactionTypeData = { ... };

  // Chart options removed - not currently used
  // const chartOptions = { ... };
  // const pieOptions = { ... };

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

  const DetailedStatsCards = () => (
    <div style={{ marginTop: "32px", marginBottom: "32px" }}>
      {/* 1. Vehicle Counts */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "#64748b",
          marginBottom: "16px",
        }}
      >
        Vehicle Overview
      </h3>
      <div className="cards-grid" style={{ marginBottom: "32px" }}>
        <div className="card blue">
          <div className="card-content">
            <div>
              <p className="card-label">Total Vehicles</p>
              <p className="card-value">{extraStats.totalVehicles}</p>
            </div>
            <div className="card-icon">
              <Bike />
            </div>
          </div>
        </div>
        <div className="card purple">
          <div className="card-content">
            <div>
              <p className="card-label">Total Bikes</p>
              <p className="card-value">{extraStats.totalBikes}</p>
            </div>
            <div className="card-icon">
              <Bike />
            </div>
          </div>
        </div>
        <div className="card green">
          <div className="card-content">
            <div>
              <p className="card-label">Total Sold</p>
              <p className="card-value">{extraStats.totalSold}</p>
            </div>
            <div className="card-icon">
              <TrendingUp />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Free Service Counts */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "#64748b",
          marginBottom: "16px",
        }}
      >
        Pending Free Services
      </h3>
      <div className="cards-grid" style={{ marginBottom: "32px" }}>
        <div className="card amber">
          <div className="card-content">
            <div>
              <p className="card-label">1st Month Pending</p>
              <p className="card-value">{extraStats.month1Pending}</p>
            </div>
            <div className="card-icon">
              <Wrench />
            </div>
          </div>
        </div>
        <div className="card amber">
          <div className="card-content">
            <div>
              <p className="card-label">2nd Month Pending</p>
              <p className="card-value">{extraStats.month2Pending}</p>
            </div>
            <div className="card-icon">
              <Wrench />
            </div>
          </div>
        </div>
        <div className="card amber">
          <div className="card-content">
            <div>
              <p className="card-label">3rd Month Pending</p>
              <p className="card-value">{extraStats.month3Pending}</p>
            </div>
            <div className="card-icon">
              <Wrench />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Expiry Counts */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "#64748b",
          marginBottom: "16px",
        }}
      >
        Approaching Expiry (Sold Vehicles - 7 Days)
      </h3>
      <div
        className="cards-grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
      >
        <div className="card" style={{ backgroundColor: "#ef4444" }}>
          <div className="card-content">
            <div>
              <p className="card-label" style={{ color: "white" }}>
                Insurance Expiring
              </p>
              <p className="card-value" style={{ color: "white" }}>
                {extraStats.insuranceExpiring}
              </p>
            </div>
            <div className="card-icon" style={{ color: "white" }}>
              <FileText />
            </div>
          </div>
        </div>
        <div className="card" style={{ backgroundColor: "#ef4444" }}>
          <div className="card-content">
            <div>
              <p className="card-label" style={{ color: "white" }}>
                PUC Expiring
              </p>
              <p className="card-value" style={{ color: "white" }}>
                {extraStats.pucExpiring}
              </p>
            </div>
            <div className="card-icon" style={{ color: "white" }}>
              <FileText />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // RevenueCard component removed - not currently used

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
  };

  const FreeServicesTable = () => {
    const [serviceFilter, setServiceFilter] = useState("all");
    const normalize = (s = "") =>
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const q = normalize(freeSearch);
    const filtered = q
      ? freeServices.filter((row) =>
          normalize(row.registrationNumber).includes(q),
        )
      : freeServices;

    // prepare processed rows with reminder info and sort by urgency
    const processed = filtered.map((row) => {
      const months = [
        row.month1 || null,
        row.month2 || null,
        row.month3 || null,
      ];
      const used = row.usedCount || 0;
      const today = new Date();

      const pending = months
        .map((m, idx) => ({
          idx: idx + 1,
          date: m
            ? new Date(m)
            : new Date(
                new Date(row.saleDate).setMonth(
                  new Date(row.saleDate).getMonth() + (idx + 1),
                ),
              ),
        }))
        .filter((p) => p.idx > used);

      const pendingWithDays = pending.map((p) => {
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntil = Math.ceil((p.date - today) / msPerDay);
        return { ...p, daysUntil };
      });

      // pick next pending: sort pendingWithDays ascending (overdue negatives first)
      pendingWithDays.sort((a, b) => a.daysUntil - b.daysUntil);

      const nextPending =
        pendingWithDays.length > 0 ? pendingWithDays[0] : null;

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

    const fsCardStyle = {
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(7,25,82,0.08)",
      padding: "28px 28px 20px",
      marginBottom: 32,
    };
    const fsTitleStyle = {
      fontSize: "1.15rem",
      fontWeight: 700,
      color: "#071952",
      margin: "0 0 18px 0",
      display: "flex",
      alignItems: "center",
      gap: 10,
    };
    const fsFilterRowStyle = {
      display: "flex",
      gap: 12,
      alignItems: "center",
      marginBottom: 18,
    };
    const fsSelectStyle = {
      padding: "7px 32px 7px 12px",
      borderRadius: 8,
      border: "1.5px solid #cbd5e1",
      fontSize: "0.85rem",
      color: "#1e293b",
      background: "#f8fafc",
      cursor: "pointer",
      outline: "none",
      appearance: "auto",
    };
    const fsLabelStyle = {
      fontSize: "0.82rem",
      fontWeight: 600,
      color: "#64748b",
      letterSpacing: "0.02em",
    };
    const fsTableWrapStyle = {
      overflowX: "auto",
      borderRadius: 12,
      border: "1.5px solid #e2e8f0",
      boxShadow: "0 1px 4px rgba(7,25,82,0.04)",
    };
    const fsThStyle = {
      padding: "11px 14px",
      textAlign: "left",
      background: "#071952",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
      borderBottom: "none",
    };
    const fsTdStyle = {
      padding: "10px 14px",
      fontSize: "0.8rem",
      color: "#1e293b",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    };

    const reminderBadge = (nextPending, usedCount) => {
      if ((usedCount || 0) >= 3)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#dcfce7",
              color: "#166534",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ✓ All done
          </span>
        );
      if (!nextPending)
        return (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              background: "#f1f5f9",
              color: "#64748b",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            Pending
          </span>
        );
      const days = nextPending.daysUntil;
      const ord = ordinal(nextPending.idx);
      if (days < 0)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ⚠ {ord} overdue {Math.abs(days)}d
          </span>
        );
      if (days === 0)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fef9c3",
              color: "#854d0e",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ⏰ {ord} due today
          </span>
        );
      if (days <= 7)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fef9c3",
              color: "#854d0e",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            🔔 {ord} in {days}d
          </span>
        );
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 20,
            background: "#dcfce7",
            color: "#166534",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          ✓ {ord} in {days}d
        </span>
      );
    };

    const usedBadge = (usedCount) => {
      const used = usedCount || 0;
      const color = used === 0 ? "#64748b" : used === 3 ? "#166534" : "#854d0e";
      const bg = used === 0 ? "#f1f5f9" : used === 3 ? "#dcfce7" : "#fef9c3";
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 20,
            background: bg,
            color,
            fontSize: "0.78rem",
            fontWeight: 700,
          }}
        >
          {used}/3
        </span>
      );
    };

    const monthDateCell = (dateStr, idx, usedCount) => {
      const isUsed = (usedCount || 0) >= idx;
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 6,
            background: isUsed ? "#dcfce7" : "#f1f5f9",
            color: isUsed ? "#166534" : "#475569",
            fontSize: "0.75rem",
            fontWeight: isUsed ? 700 : 400,
          }}
        >
          {dateStr ? formatDate(dateStr) : "—"}
          {isUsed && " ✓"}
        </span>
      );
    };

    return (
      <div style={fsCardStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3 style={fsTitleStyle}>
            <span
              style={{
                background: "#EBF4F6",
                borderRadius: 8,
                padding: "4px 10px",
                color: "#088395",
                fontSize: "1rem",
              }}
            >
              🔧
            </span>
            Free Service Usage
            <span
              style={{ fontSize: "0.8rem", fontWeight: 500, color: "#64748b" }}
            >
              (Sold Vehicles)
            </span>
          </h3>
          <div style={fsFilterRowStyle}>
            <span style={fsLabelStyle}>Show:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={fsSelectStyle}
            >
              <option value="all">All</option>
              <option value="1">1st free service</option>
              <option value="2">2nd free service</option>
              <option value="3">3rd free service</option>
            </select>
          </div>
        </div>

        {freeServicesLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>
            Loading free service data...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
            No free service records available
          </div>
        ) : (
          <div style={fsTableWrapStyle}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8rem",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Sell Date",
                    "Buyer Name",
                    "Phone",
                    "Reg. Number",
                    "Brand",
                    "Model",
                    "Month 1",
                    "Month 2",
                    "Month 3",
                    "Used",
                    "Reminder",
                  ].map((h) => (
                    <th key={h} style={fsThStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processed
                  .filter((item) => {
                    if (serviceFilter === "all") return true;
                    const sel = Number(serviceFilter);
                    return item.nextPending && item.nextPending.idx === sel;
                  })
                  .map((item, idx) => {
                    const { row, nextPending } = item;
                    const isOverdue = nextPending && nextPending.daysUntil < 0;
                    const isDueSoon =
                      nextPending &&
                      nextPending.daysUntil >= 0 &&
                      nextPending.daysUntil <= 7;
                    return (
                      <tr
                        key={`${row.registrationNumber}-${idx}`}
                        onClick={() => {
                          if (row.registrationNumber) {
                            setHistoryQuery(row.registrationNumber);
                            setIsHistoryModalOpen(true);
                          }
                        }}
                        style={{
                          cursor: "pointer",
                          background: isOverdue
                            ? "#fff5f5"
                            : isDueSoon
                              ? "#fffbeb"
                              : idx % 2 === 0
                                ? "#fff"
                                : "#f8fafc",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#EBF4F6")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = isOverdue
                            ? "#fff5f5"
                            : isDueSoon
                              ? "#fffbeb"
                              : idx % 2 === 0
                                ? "#fff"
                                : "#f8fafc")
                        }
                      >
                        <td style={fsTdStyle}>
                          {formatDate(row.saleDate) || "—"}
                        </td>
                        <td
                          style={{
                            ...fsTdStyle,
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {row.buyerName || "—"}
                        </td>
                        <td style={{ ...fsTdStyle, color: "#475569" }}>
                          {row.buyerPhone || "—"}
                        </td>
                        <td style={fsTdStyle}>
                          <span
                            style={{
                              background: "#EBF4F6",
                              color: "#088395",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            {row.registrationNumber || "—"}
                          </span>
                        </td>
                        <td style={fsTdStyle}>{row.vehicleBrand || "—"}</td>
                        <td style={fsTdStyle}>{row.vehicleModel || "—"}</td>
                        <td style={fsTdStyle}>
                          {monthDateCell(row.month1, 1, row.usedCount)}
                        </td>
                        <td style={fsTdStyle}>
                          {monthDateCell(row.month2, 2, row.usedCount)}
                        </td>
                        <td style={fsTdStyle}>
                          {monthDateCell(row.month3, 3, row.usedCount)}
                        </td>
                        <td style={fsTdStyle}>{usedBadge(row.usedCount)}</td>
                        <td style={fsTdStyle}>
                          {reminderBadge(nextPending, row.usedCount)}
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

  const PucReminderTable = () => {
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [search, setSearch] = useState("");
    const [showAllPuc, setShowAllPuc] = useState(false);

    const fetchPucData = useCallback(async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        // fetch standalone PUC
        const resPUC = await axios.get(
          "https://ok-motor-51l3.vercel.app/api/puc?limit=2000",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const additionalPUC = resPUC.data || [];

        // Format PUC Model items
        const pucItems = (additionalPUC || [])
          .filter((p) => p && p.pucExpiry)
          .map((item) => ({
            ...item,
            type: "puc_model",
            displayReg: item.regNo,
            displayName: item.personName,
            displayPhone: item.personPhone,
            displayVehicle: `${item.brand || ""} ${
              item.vehicleModel || ""
            }`.trim(),
            displayExpiry: item.pucExpiry,
          }));

        setItems(pucItems);
        console.log("PUC Data Loaded:", {
          pucModelCount: pucItems.length,
          total: pucItems.length,
          sample: pucItems[0],
        });
      } catch (err) {
        console.error("Error fetching data for PUC reminders:", err);
      } finally {
        setLoadingItems(false);
      }
    }, []);

    useEffect(() => {
      fetchPucData();
    }, [fetchPucData]);

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    const q = String(search || "")
      .toLowerCase()
      .trim();

    // Filter items for search and for expiry within next 7 days or already expired
    const processed = (items || [])
      .map((row) => {
        const expiry = row.displayExpiry ? new Date(row.displayExpiry) : null;
        const daysUntil = expiry ? Math.ceil((expiry - now) / msPerDay) : null;
        return { row, expiry, daysUntil };
      })
      .filter((it) => it.expiry !== null)
      .filter((it) => {
        // Show everything, but apply search if q exists
        if (!q) return true;

        const r = it.row || {};

        return (
          String(r.displayReg || "")
            .toLowerCase()
            .includes(q) ||
          String(r.displayVehicle || "")
            .toLowerCase()
            .includes(q) ||
          String(r.displayName || "")
            .toLowerCase()
            .includes(q) ||
          String(r.displayPhone || "")
            .toLowerCase()
            .includes(q)
        );
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const daysBadge = (daysUntil) => {
      if (daysUntil < 0)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ⚠ {Math.abs(daysUntil)}d overdue
          </span>
        );
      if (daysUntil === 0)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fef9c3",
              color: "#854d0e",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ⏰ Due today
          </span>
        );
      if (daysUntil <= 7)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fef9c3",
              color: "#854d0e",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            🔔 {daysUntil}d left
          </span>
        );
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 20,
            background: "#dcfce7",
            color: "#166534",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          ✓ {daysUntil}d left
        </span>
      );
    };

    const tThStyle = {
      padding: "11px 14px",
      textAlign: "left",
      background: "#071952",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    };
    const tTdStyle = {
      padding: "10px 14px",
      fontSize: "0.8rem",
      color: "#1e293b",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    };

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(7,25,82,0.08)",
          padding: "28px 28px 20px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#071952",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                background: "#EBF4F6",
                borderRadius: 8,
                padding: "4px 10px",
                color: "#088395",
                fontSize: "1rem",
              }}
            >
              📋
            </span>
            PUC Expiry Reminders
          </h3>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search reg, vehicle or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                border: "1.5px solid #cbd5e1",
                borderRadius: 8,
                fontSize: "0.82rem",
                outline: "none",
                width: 260,
                background: "#f8fafc",
              }}
            />
          </div>
        </div>

        {loadingItems ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>Loading
            PUC reminders...
          </div>
        ) : processed.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>No PUC
            expiries to show
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(7,25,82,0.04)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Registration",
                      "Name",
                      "Phone",
                      "Vehicle",
                      "PUC Expiry",
                      "Days Left",
                      "Source",
                    ].map((h) => (
                      <th key={h} style={tThStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAllPuc ? processed : processed.slice(0, 10)).map(
                    (it, idx) => {
                      const { row, expiry, daysUntil } = it;
                      const isOverdue = daysUntil < 0;
                      const isDueSoon = daysUntil >= 0 && daysUntil <= 7;
                      return (
                        <tr
                          key={`${row._id}-${idx}`}
                          onClick={() => {
                            if (row.displayReg) {
                              setHistoryQuery(row.displayReg);
                              setIsHistoryModalOpen(true);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                            background: isOverdue
                              ? "#fff5f5"
                              : isDueSoon
                                ? "#fffbeb"
                                : idx % 2 === 0
                                  ? "#fff"
                                  : "#f8fafc",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#EBF4F6")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = isOverdue
                              ? "#fff5f5"
                              : isDueSoon
                                ? "#fffbeb"
                                : idx % 2 === 0
                                  ? "#fff"
                                  : "#f8fafc")
                          }
                        >
                          <td style={tTdStyle}>
                            <span
                              style={{
                                background: "#EBF4F6",
                                color: "#088395",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              {row.displayReg || "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              ...tTdStyle,
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {row.displayName || "—"}
                          </td>
                          <td style={{ ...tTdStyle, color: "#475569" }}>
                            {row.displayPhone || "—"}
                          </td>
                          <td style={tTdStyle}>{row.displayVehicle || "—"}</td>
                          <td style={tTdStyle}>
                            {expiry ? formatDate(expiry) : "—"}
                          </td>
                          <td style={tTdStyle}>{daysBadge(daysUntil)}</td>
                          <td style={tTdStyle}>
                            {row.type === "sell_letter" ? (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "3px 8px",
                                  background: "#e0f2fe",
                                  color: "#0284c7",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                Sold Vehicle
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "3px 8px",
                                  background: "#f3e8ff",
                                  color: "#7e22ce",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                PUC Only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
            {processed.length > 10 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  onClick={() => setShowAllPuc((s) => !s)}
                  style={{
                    padding: "8px 18px",
                    background: "#071952",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {showAllPuc
                    ? "Show Less ▲"
                    : `View All (${processed.length}) ▼`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const InsuranceReminderTable = () => {
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [search, setSearch] = useState("");
    const [showAllInsurance, setShowAllInsurance] = useState(false);

    const fetchInsuranceData = useCallback(async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        // fetch standalone insurance
        const resInsurance = await axios.get(
          "https://ok-motor-51l3.vercel.app/api/insurance?limit=2000",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const additionalInsurance = resInsurance.data || [];

        // Format Insurance Model items
        const insuranceItems = (additionalInsurance || [])
          .filter((s) => s && s.insuranceExpiry)
          .map((item) => ({
            ...item,
            type: "insurance_model",
            displayReg: item.regNo,
            displayName: item.personName,
            displayPhone: item.personPhone,
            displayVehicle: `${item.brand || ""} ${
              item.vehicleModel || ""
            }`.trim(),
            displayExpiry: item.insuranceExpiry,
            displayCompany: item.insuranceCompany,
          }));

        setItems(insuranceItems);
        console.log("Insurance Data Loaded:", {
          insuranceModelCount: insuranceItems.length,
          total: insuranceItems.length,
          sample: insuranceItems[0],
        });
      } catch (err) {
        console.error("Error fetching data for Insurance reminders:", err);
      } finally {
        setLoadingItems(false);
      }
    }, []);

    useEffect(() => {
      fetchInsuranceData();
    }, [fetchInsuranceData]);

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    const q = String(search || "")
      .toLowerCase()
      .trim();

    const processed = (items || [])
      .map((row) => {
        const expiry = row.displayExpiry ? new Date(row.displayExpiry) : null;
        const daysUntil = expiry ? Math.ceil((expiry - now) / msPerDay) : null;
        return { row, expiry, daysUntil };
      })
      .filter((it) => it.expiry !== null)
      .filter((it) => {
        // Show everything, but apply search if q exists
        if (!q) return true;

        const r = it.row || {};

        return (
          String(r.displayReg || "")
            .toLowerCase()
            .includes(q) ||
          String(r.displayVehicle || "")
            .toLowerCase()
            .includes(q) ||
          String(r.displayName || "")
            .toLowerCase()
            .includes(q) ||
          String(r.displayPhone || "")
            .toLowerCase()
            .includes(q)
        );
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const iThStyle = {
      padding: "11px 14px",
      textAlign: "left",
      background: "#071952",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    };
    const iTdStyle = {
      padding: "10px 14px",
      fontSize: "0.8rem",
      color: "#1e293b",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    };
    const iDaysBadge = (daysUntil) => {
      if (daysUntil < 0)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ⚠ {Math.abs(daysUntil)}d overdue
          </span>
        );
      if (daysUntil === 0)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fef9c3",
              color: "#854d0e",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            ⏰ Due today
          </span>
        );
      if (daysUntil <= 30)
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              background: "#fef9c3",
              color: "#854d0e",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            🔔 {daysUntil}d left
          </span>
        );
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 20,
            background: "#dcfce7",
            color: "#166534",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          ✓ {daysUntil}d left
        </span>
      );
    };

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(7,25,82,0.08)",
          padding: "28px 28px 20px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#071952",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                background: "#EBF4F6",
                borderRadius: 8,
                padding: "4px 10px",
                color: "#088395",
                fontSize: "1rem",
              }}
            >
              🛡️
            </span>
            Insurance Expiry Reminders
          </h3>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search reg, vehicle or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                border: "1.5px solid #cbd5e1",
                borderRadius: 8,
                fontSize: "0.82rem",
                outline: "none",
                width: 260,
                background: "#f8fafc",
              }}
            />
          </div>
        </div>

        {loadingItems ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>Loading
            insurance reminders...
          </div>
        ) : processed.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>No
            insurance expiries to show
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(7,25,82,0.04)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Registration",
                      "Name",
                      "Phone",
                      "Vehicle",
                      "Insurance Expiry",
                      "Days Left",
                      "Company",
                      "Source",
                    ].map((h) => (
                      <th key={h} style={iThStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAllInsurance ? processed : processed.slice(0, 10)).map(
                    (it, idx) => {
                      const { row, expiry, daysUntil } = it;
                      const isOverdue = daysUntil < 0;
                      const isDueSoon = daysUntil >= 0 && daysUntil <= 30;
                      return (
                        <tr
                          key={`${row._id}-${idx}`}
                          style={{
                            cursor: "default",
                            background: isOverdue
                              ? "#fff5f5"
                              : isDueSoon
                                ? "#fffbeb"
                                : idx % 2 === 0
                                  ? "#fff"
                                  : "#f8fafc",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#EBF4F6")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = isOverdue
                              ? "#fff5f5"
                              : isDueSoon
                                ? "#fffbeb"
                                : idx % 2 === 0
                                  ? "#fff"
                                  : "#f8fafc")
                          }
                        >
                          <td style={iTdStyle}>
                            <span
                              style={{
                                background: "#EBF4F6",
                                color: "#088395",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              {row.displayReg || "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              ...iTdStyle,
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {row.displayName || "—"}
                          </td>
                          <td style={{ ...iTdStyle, color: "#475569" }}>
                            {row.displayPhone || "—"}
                          </td>
                          <td style={iTdStyle}>{row.displayVehicle || "—"}</td>
                          <td style={iTdStyle}>
                            {expiry
                              ? new Date(expiry).toLocaleDateString("en-IN")
                              : "—"}
                          </td>
                          <td style={iTdStyle}>{iDaysBadge(daysUntil)}</td>
                          <td style={iTdStyle}>{row.displayCompany || "—"}</td>
                          <td style={iTdStyle}>
                            {row.type === "sell_letter" ? (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "3px 8px",
                                  background: "#e0f2fe",
                                  color: "#0284c7",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                Sold Vehicle
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "3px 8px",
                                  background: "#f3e8ff",
                                  color: "#7e22ce",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                Insurance Only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
            {processed.length > 10 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  onClick={() => setShowAllInsurance((s) => !s)}
                  style={{
                    padding: "8px 18px",
                    background: "#071952",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {showAllInsurance
                    ? "Show Less ▲"
                    : `View All (${processed.length}) ▼`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const IncompleteBuyLettersTable = () => {
    const [search, setSearch] = useState("");
    const [showAllIncompleteBuy, setShowAllIncompleteBuy] = useState(false);

    const bThStyle = {
      padding: "11px 14px",
      textAlign: "left",
      background: "#071952",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    };
    const bTdStyle = {
      padding: "10px 14px",
      fontSize: "0.8rem",
      color: "#1e293b",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    };

    const filteredLetters = incompleteBuyLetters.filter((letter) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (letter.registrationNumber || "").toLowerCase().includes(q) ||
        (letter.sellerName || "").toLowerCase().includes(q) ||
        (letter.buyerName || "").toLowerCase().includes(q) ||
        (letter.vehicleName || "").toLowerCase().includes(q)
      );
    });

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(7,25,82,0.08)",
          padding: "28px 28px 20px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#dc2626",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                background: "#fee2e2",
                borderRadius: 8,
                padding: "4px 10px",
                color: "#dc2626",
                fontSize: "1rem",
              }}
            >
              📋
            </span>
            Incomplete Buy Letters
            <span
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {incompleteBuyLetters.length}
            </span>
          </h3>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search reg, seller or buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                border: "1.5px solid #cbd5e1",
                borderRadius: 8,
                fontSize: "0.82rem",
                outline: "none",
                width: 260,
                background: "#f8fafc",
              }}
            />
          </div>
        </div>

        {incompleteLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>Loading
            incomplete buy letters...
          </div>
        ) : filteredLetters.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>
              {incompleteBuyLetters.length === 0 ? "✅" : "🔍"}
            </div>
            {incompleteBuyLetters.length === 0
              ? "All buy letters are complete!"
              : "No matching records found"}
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(7,25,82,0.04)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Registration No",
                      "Seller Name",
                      "Buyer Name",
                      "Vehicle",
                      "Created At",
                      "Missing Fields",
                    ].map((h) => (
                      <th key={h} style={bThStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAllIncompleteBuy
                    ? filteredLetters
                    : filteredLetters.slice(0, 10)
                  ).map((letter, idx) => (
                    <tr
                      key={letter._id}
                      style={{
                        background: "#fff5f5",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#EBF4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff5f5")
                      }
                    >
                      <td style={bTdStyle}>
                        <span
                          style={{
                            background: "#EBF4F6",
                            color: "#088395",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        >
                          {letter.registrationNumber || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          ...bTdStyle,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {letter.sellerName || "—"}
                      </td>
                      <td style={bTdStyle}>{letter.buyerName || "—"}</td>
                      <td style={bTdStyle}>
                        {`${letter.vehicleName || ""} ${letter.vehicleModel || ""}`.trim() ||
                          "—"}
                      </td>
                      <td style={{ ...bTdStyle, color: "#475569" }}>
                        {formatDate(letter.createdAt)}
                      </td>
                      <td style={bTdStyle}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                            maxWidth: 280,
                          }}
                        >
                          {(letter.missingFields || []).map((field, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 8px",
                                background: "#fee2e2",
                                color: "#dc2626",
                                borderRadius: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                border: "1px solid #fca5a5",
                              }}
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLetters.length > 10 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  onClick={() => setShowAllIncompleteBuy((s) => !s)}
                  style={{
                    padding: "8px 18px",
                    background: "#071952",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {showAllIncompleteBuy
                    ? "Show Less ▲"
                    : `View All (${filteredLetters.length}) ▼`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const IncompleteSellLettersTable = () => {
    const [search, setSearch] = useState("");
    const [showAllIncompleteSell, setShowAllIncompleteSell] = useState(false);

    const sThStyle = {
      padding: "11px 14px",
      textAlign: "left",
      background: "#071952",
      color: "#fff",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    };
    const sTdStyle = {
      padding: "10px 14px",
      fontSize: "0.8rem",
      color: "#1e293b",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #f1f5f9",
      verticalAlign: "middle",
    };

    const filteredLetters = incompleteSellLetters.filter((letter) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (letter.registrationNumber || "").toLowerCase().includes(q) ||
        (letter.buyerName || "").toLowerCase().includes(q) ||
        (letter.vehicleName || "").toLowerCase().includes(q)
      );
    });

    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(7,25,82,0.08)",
          padding: "28px 28px 20px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#dc2626",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                background: "#fee2e2",
                borderRadius: 8,
                padding: "4px 10px",
                color: "#dc2626",
                fontSize: "1rem",
              }}
            >
              📝
            </span>
            Incomplete Sell Letters
            <span
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {incompleteSellLetters.length}
            </span>
          </h3>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search reg, buyer or vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                border: "1.5px solid #cbd5e1",
                borderRadius: 8,
                fontSize: "0.82rem",
                outline: "none",
                width: 260,
                background: "#f8fafc",
              }}
            />
          </div>
        </div>

        {incompleteLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>Loading
            incomplete sell letters...
          </div>
        ) : filteredLetters.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#94a3b8",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>
              {incompleteSellLetters.length === 0 ? "✅" : "🔍"}
            </div>
            {incompleteSellLetters.length === 0
              ? "All sell letters are complete!"
              : "No matching records found"}
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(7,25,82,0.04)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Registration No",
                      "Buyer Name",
                      "Vehicle",
                      "Sale Amount",
                      "Created At",
                      "Missing Fields",
                    ].map((h) => (
                      <th key={h} style={sThStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAllIncompleteSell
                    ? filteredLetters
                    : filteredLetters.slice(0, 10)
                  ).map((letter, idx) => (
                    <tr
                      key={letter._id}
                      style={{
                        background: "#fff5f5",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#EBF4F6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff5f5")
                      }
                    >
                      <td style={sTdStyle}>
                        <span
                          style={{
                            background: "#EBF4F6",
                            color: "#088395",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        >
                          {letter.registrationNumber || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          ...sTdStyle,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {letter.buyerName || "—"}
                      </td>
                      <td style={sTdStyle}>
                        {`${letter.vehicleName || ""} ${letter.vehicleModel || ""}`.trim() ||
                          "—"}
                      </td>
                      <td style={sTdStyle}>
                        {letter.saleAmount ? (
                          <span style={{ fontWeight: 700, color: "#166534" }}>
                            ₹
                            {new Intl.NumberFormat("en-IN").format(
                              letter.saleAmount,
                            )}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                      <td style={{ ...sTdStyle, color: "#475569" }}>
                        {formatDate(letter.createdAt)}
                      </td>
                      <td style={sTdStyle}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                            maxWidth: 280,
                          }}
                        >
                          {(letter.missingFields || []).map((field, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 8px",
                                background: "#fee2e2",
                                color: "#dc2626",
                                borderRadius: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                border: "1px solid #fca5a5",
                              }}
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLetters.length > 10 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  onClick={() => setShowAllIncompleteSell((s) => !s)}
                  style={{
                    padding: "8px 18px",
                    background: "#071952",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {showAllIncompleteSell
                    ? "Show Less ▲"
                    : `View All (${filteredLetters.length}) ▼`}
                </button>
              </div>
            )}
          </>
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
        <img src={logoheader} alt="logo" className="top-bar-logo" />
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
                onClick={() => setIsHistoryModalOpen(true)}
                onChange={(e) => {
                  setHistoryQuery(e.target.value);
                }}
                className="history-search-input"
              />
            </div>
          </div>

          {activeMenu === "Dashboard" && (
            <>
              <DashboardCards />
              <DetailedStatsCards />
              <FreeServicesTable />
              <PucReminderTable />
              <InsuranceReminderTable />
              <IncompleteBuyLettersTable />
              <IncompleteSellLettersTable />
              <ChartsSection />
              {!loading && !error}
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
        padding: 0.5rem 1rem;
        background: #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
      }
        .top-bar-logo{
          display:none;
          margin: 0;
          padding: 0;
          line-height: 0;
        }
        .admin-container {
          display: flex;
          min-height: 100vh;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #EBF4F6;
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
          background: #071952;
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
          background: rgba(8, 131, 149, 0.2);
          border-right: 3px solid #088395;
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
          border-left: 4px solid #088395;
        }

        .card.green {
          border-left: 4px solid #37B7C3;
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
          background-color: rgba(8, 131, 149, 0.15);
        }

        .card.green .card-icon {
          background-color: rgba(55, 183, 195, 0.15);
        }

        .card.purple .card-icon {
          background-color: #ede9fe;
        }

        .card.amber .card-icon {
          background-color: #fef3c7;
        }

        /* Revenue Card */
        .revenue-card {
          background: #071952;
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
          color: #088395;
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
          color: #088395;
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
          color: #088395;
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
          background: #071952;
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
          background: rgba(8, 131, 149, 0.15);
        }

        .quick-action-button.green {
          background: rgba(55, 183, 195, 0.15);
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
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            background-color: #071952;
            padding: 0 1rem;
            position: relative;
          }

          .top-bar .hamburger-menu {
            color: #ffffff;
            position: absolute;
            left: 1rem;
          }

          .top-bar-logo {
            display: block;
            width: 250px;
            height: auto;
            margin: -40px;
            padding: 0;
            line-height: 0;
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
            grid-template-columns: 1fr 1fr;
          }
          .card-content {
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 0.4rem;
          }

          .card-icon {
            order: 1;
          }

          .card-content > div:first-child {
            order: 2;
          }

          .card-label {
            font-size: 0.75rem;
          }

          .card-value {
            font-size: 1.25rem;
          }

          .card-value.currency {
            font-size: 1.1rem;
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
            height: 200px;
            width: 360px;
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
          min-width: 650px;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
          justify-content: left;
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
