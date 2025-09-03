import React, { useState, useContext, useEffect, useCallback } from "react";
import { saveAs } from "file-saver";
import {
  FileText,
  ArrowLeft,
  User,
  Car,
  Download,
  Calendar,
  IndianRupee,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Bike,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import httpClient from "../utils/offlineHttpClient";
import offlineManager from "../utils/offlineManager";
import { generateAdvanceClientPDF } from "../utils/generateAdvanceClientPDF";
import logo from "../images/okmotorback.png";
import AuthContext from "../context/AuthContext";
import logo1 from "../images/okmotorback.png";
const AdvancePayBillForm = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeMenu, setActiveMenu] = useState("Create Advance Bill");
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerEmail: "",
    vehicleType: "bike",
    vehicleBrand: "",
    vehicleModel: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    kmReading: "",
    serviceDate: new Date().toISOString().split("T")[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    totalAmount: "0.00",
    discount: "0",
    advancePaid: "0.00",
    paymentMethod: "cash",
    note: "",
    grandTotal: "0.00",
    balanceDue: "0.00",
  });

  // Sync offline data when back online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      await offlineManager.syncOfflineData(
        httpClient,
        "advanceBillOfflineQueue",
        {
          create: "https://ok-motor-51l3.vercel.app/api/advance-bills",
          update: "https://ok-motor-51l3.vercel.app/api/advance-bills",
          delete: "https://ok-motor-51l3.vercel.app/api/advance-bills"
        }
      );

      // Reload queue after sync
      const updatedQueue = offlineManager.getQueue("advanceBillOfflineQueue");
      setOfflineQueue(updatedQueue);

      if (updatedQueue.length === 0) {
        alert("All offline data synced successfully!");
      }
    } catch (error) {
      console.error("Error syncing offline data:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = offlineManager.loadFromStorage("advanceBillFormData");
    if (savedData) {
      setFormData(savedData);
    }

    // Load offline queue
    const savedQueue = offlineManager.getQueue("advanceBillOfflineQueue");
    setOfflineQueue(savedQueue);
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    offlineManager.saveToStorage("advanceBillFormData", formData);
  }, [formData]);

  // Save offline queue to localStorage whenever it changes
  useEffect(() => {
    offlineManager.saveToStorage("advanceBillOfflineQueue", offlineQueue);
  }, [offlineQueue]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Remove the axios.create since we're using httpClient now
  // httpClient handles authentication automatically

  const calculateAmounts = (data) => {
    // Handle formatted values with commas and progressive formatting
    const total = parseFloat(String(data.totalAmount).replace(/,/g, '')) || 0;
    const advance = parseFloat(String(data.advancePaid).replace(/,/g, '')) || 0;
    const discount = parseFloat(data.discount) || 0;

    const grandTotal = total - discount;
    const balanceDue = grandTotal - advance;

    return {
      grandTotal: grandTotal.toFixed(2),
      balanceDue: balanceDue >= 0 ? balanceDue.toFixed(2) : "0.00",
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For amount fields, allow only numbers and dot, but do not format aggressively
    let cleanedValue = value;
    if (["totalAmount", "advancePaid", "kmReading"].includes(name)) {
      cleanedValue = value.replace(/[^0-9.]/g, "");
      // Only allow one dot
      const dotCount = (cleanedValue.match(/\./g) || []).length;
      if (dotCount > 1) {
        cleanedValue = cleanedValue.replace(/\.(?=.*\.)/, "");
      }
      // Limit to 2 decimal places
      if (cleanedValue.includes(".")) {
        const parts = cleanedValue.split(".");
        if (parts[1].length > 2) {
          cleanedValue = parts[0] + "." + parts[1].substring(0, 2);
        }
      }
    }

    const updatedData = {
      ...formData,
      [name]: cleanedValue,
    };
    if (["totalAmount", "advancePaid"].includes(name)) {
      const calculated = calculateAmounts(updatedData);
      updatedData.grandTotal = calculated.grandTotal;
      updatedData.balanceDue = calculated.balanceDue;
    }

    setFormData(updatedData);
  };

  // Optionally, you can format onBlur for amount fields
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (["totalAmount", "advancePaid"].includes(name)) {
      let numericValue = parseFloat(value.replace(/,/g, ""));
      if (isNaN(numericValue)) numericValue = 0;
      const formattedValue = numericValue.toFixed(2);
      const updatedData = {
        ...formData,
        [name]: formattedValue,
      };
      const calculated = calculateAmounts(updatedData);
      updatedData.grandTotal = calculated.grandTotal;
      updatedData.balanceDue = calculated.balanceDue;
      setFormData(updatedData);
    }
  };

  // Function to generate PDF buffer for offline use
  const generatePDFBuffer = async (data) => {
    // If offline, don't call the server (which would enqueue an HTTP request) - generate locally
    if (!navigator.onLine) {
      // Use client-side generator to avoid queuing an HTTP request
      const bytes = await generateAdvanceClientPDF(data);
      return bytes;
    }

    try {
      const response = await httpClient.post(
        `https://ok-motor-51l3.vercel.app/api/advance-bills/generate-pdf`,
        data,
        {
          responseType: 'arraybuffer'
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating PDF:", error);
      // If server call failed while online, fall back to client generator
      try {
        const bytes = await generateAdvanceClientPDF(data);
        return bytes;
      } catch (clientErr) {
        throw error;
      }
    }
  };

  // Function to download PDF from buffer
  const downloadPDFFromBuffer = (buffer, filename) => {
    const blob = new Blob([buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAndDownload = async () => {
    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You are not authenticated. Please login again.");
        logout();
        navigate('/login');
        return;
      }

      // Start progress simulation
      const progressPromise = simulateProgress();

      const requestData = {
        ...formData,
        user: user._id,
        totalAmount: parseFloat(String(formData.totalAmount).replace(/,/g, '')) || 0,
        advancePaid: parseFloat(String(formData.advancePaid).replace(/,/g, '')) || 0,
        grandTotal: parseFloat(formData.grandTotal) || 0,
        balanceDue: parseFloat(formData.balanceDue) || 0,
        kmReading: parseFloat(formData.kmReading) || 0,
      };

      if (!isOnline) {
        // Offline mode: Generate PDF and queue data for later sync
        try {
          // Try server PDF generation first; if it fails, use client generator
          let pdfBuffer;
          try {
            pdfBuffer = await generatePDFBuffer(requestData);
          } catch (serverErr) {
            console.warn('Server PDF generation failed, using client generator:', serverErr);
            const bytes = await generateAdvanceClientPDF(requestData);
            pdfBuffer = bytes;
          }
          
          // Download PDF
          const filename = `advance-bill-${Date.now()}.pdf`;
          downloadPDFFromBuffer(pdfBuffer, filename);

          // Queue data for sync when back online
          const queueItem = {
            id: Date.now().toString(),
            type: 'create',
            data: requestData,
            timestamp: new Date().toISOString(),
            filename: filename
          };

          offlineManager.addToQueue("advanceBillOfflineQueue", queueItem);
          const updatedQueue = offlineManager.getQueue("advanceBillOfflineQueue");
          setOfflineQueue(updatedQueue);

          // Wait for progress to complete
          await progressPromise;

          alert("Advance bill saved offline and PDF downloaded! Data will sync when you're back online.");
        } catch (pdfError) {
          console.error("Error generating PDF offline:", pdfError);
          alert("Failed to generate PDF offline. Please check your connection and try again.");
        }
      } else {
        // Online mode: Normal save and download
        const saveResponse = await httpClient.post(
          "https://ok-motor-51l3.vercel.app/api/advance-bills",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!saveResponse.data?.data?._id) {
          throw new Error("Invalid response format from server");
        }

        const billId = saveResponse.data.data._id;
        const pdfResponse = await httpClient.get(
          `https://ok-motor-51l3.vercel.app/api/advance-bills/${billId}/download`,
          {
            responseType: "blob",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/pdf",
            },
          }
        );

        // Wait for progress to complete
        await progressPromise;

        const pdfBlob = new Blob([pdfResponse.data], { type: "application/pdf" });
        saveAs(pdfBlob, `advance-bill-${billId}.pdf`);

        alert("Advance bill saved and downloaded successfully!");
      }
    } catch (error) {
      console.error("Error in save and download:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        logout();
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert("You don't have permission to create advance bills.");
      } else {
        alert(
          `Failed to save and download: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setIsSaving(false);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const LoadingOverlay = () => (
    <div style={styles.loadingOverlay}>
      <div style={styles.loadingContent}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Generating PDF Preview...</p>
        <p style={styles.loadingSubtext}>This may take a few seconds</p>
      </div>
    </div>
  );

  const DownloadProgressModal = ({ progress, onClose }) => {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <div style={modalStyles.logoContainer}>
              <img 
                src={logo1} 
                alt="OK Motor Logo" 
                style={modalStyles.logo}
              />
            </div>
            <h2 style={modalStyles.title}>Generating Advance Bill PDF</h2>
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
    logoContainer: {
      marginRight: "16px",
    },
    logo: {
      width: "180px",
      height: "220px",
      objectFit: "contain",
    },
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

  const generateAdvanceBillPDF = async (
    billData = formData,
    forPreview = false
  ) => {
    try {
      setShowLoadingOverlay(true);

      // Validate required fields
      if (!billData.customerName || !billData.customerPhone) {
        alert("Please fill in required customer information");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not authenticated. Please login again.");
        logout();
        navigate('/login');
        return;
      }

      // Calculate final amounts before sending
      const calculated = calculateAmounts(billData);

      // Prepare data with user ID and calculated amounts
      const requestData = {
        ...billData,
        user: user._id,
        grandTotal: calculated.grandTotal,
        balanceDue: calculated.balanceDue,
      };

      if (forPreview) {
        // For preview, use a preview endpoint that doesn't save data
        try {
          console.log("Making preview request to:", "https://ok-motor-51l3.vercel.app/api/advance-bills/preview");
          console.log("Request data:", requestData);
          
          const previewResponse = await httpClient.post(
            "https://ok-motor-51l3.vercel.app/api/advance-bills/preview",
            requestData,
            {
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("Preview response received:", previewResponse);
          console.log("Response data type:", typeof previewResponse.data);
          console.log("Response data length:", previewResponse.data?.length || 'N/A');

          const pdfBlob = new Blob([previewResponse.data], { type: "application/pdf" });
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setPreviewPdf(pdfUrl);
          setShowPreviewModal(true);
        } catch (previewError) {
          console.error("Preview request failed:", previewError);
          console.error("Preview error response:", previewError.response);
          throw previewError;
        }
      } else {
        // For download, save the bill first
        const saveResponse = await httpClient.post(
          "https://ok-motor-51l3.vercel.app/api/advance-bills",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!saveResponse.data?.data?._id) {
          throw new Error("Invalid response format from server");
        }

        const billId = saveResponse.data.data._id;

        // Get the PDF for download
        const pdfResponse = await httpClient.get(
          `https://ok-motor-51l3.vercel.app/api/advance-bills/${billId}/download`,
          {
            responseType: "blob",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const pdfBlob = new Blob([pdfResponse.data], { type: "application/pdf" });
        saveAs(pdfBlob, `advance-bill-${billId}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        logout();
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert("You don't have permission to create advance bills.");
      } else {
        alert(
          `Failed to generate PDF: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setShowLoadingOverlay(false);
    }
  };
  const fetchVehicleDetails = useCallback(async (registrationNumber) => {
    try {
      const response = await httpClient.get(
        "https://ok-motor-51l3.vercel.app/api/advance-bills/vehicle-details",
        {
          params: { registrationNumber },
        }
      );

      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          vehicleBrand: response.data.vehicleName || "",
          vehicleModel: response.data.vehicleModel || "",
          registrationNumber: response.data.registrationNumber || "",
          chassisNumber: response.data.chassisNumber || "",
          engineNumber: response.data.engineNumber || "",
          kmReading: response.data.vehiclekm || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    }
  }, []);

  const handleLogout = () => {
    logout();
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

  if (previewMode) {
    return (
      <div style={styles.formPreviewContainer}>
        <div style={styles.formPreviewHeader}>
          <button
            onClick={() => setPreviewMode(false)}
            style={styles.backButton}
          >
            <ArrowLeft style={styles.buttonIcon} /> Back to Edit
          </button>
          <div style={styles.previewActions}>
            <button
              onClick={generateAdvanceBillPDF}
              style={styles.downloadButton}
            >
              <Download style={styles.buttonIcon} /> Download PDF
            </button>
          </div>
        </div>
        <div style={styles.pdfPreview}>
          <p>PDF Preview would show here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.container,
      paddingTop: isMobile ? "80px" : "0",
    }}>
      <div style={{
        ...styles.topBar,
        display: isMobile && !isSidebarOpen ? "block" : "none",
      }}>
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
      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
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
              height: "13rem",
              objectFit: "cover", // match CSS
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

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div>
                <h1 style={styles.pageTitle}>Create Advance Payment Invoice</h1>
                <p style={styles.pageSubtitle}>
                  Fill in the details to generate an advance payment invoice for the
                  vehicle
                </p>
              </div>              
            </div>
          </div>

          <form style={styles.form}>
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} /> Customer Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Name || ग्राहक का नाम
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onFocus={() => setFocusedInput("customerName")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "customerName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={30}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Phone || ग्राहक का फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onFocus={() => setFocusedInput("customerPhone")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "customerPhone"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Address || ग्राहक का पता
                  </label>
                  <input
                    type="text"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onFocus={() => setFocusedInput("customerAddress")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "customerAddress"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={80}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Email || ग्राहक का ईमेल
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onFocus={() => setFocusedInput("customerEmail")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "customerEmail"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={30}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} /> Vehicle Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Type || वाहन का प्रकार
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="car">Car</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Brand || वाहन का ब्रांड
                  </label>
                  <input
                    type="text"
                    name="vehicleBrand"
                    value={formData.vehicleBrand}
                    onFocus={() => setFocusedInput("vehicleBrand")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehicleBrand"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Model || वाहन का मॉडल
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onFocus={() => setFocusedInput("vehicleModel")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehicleModel"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Registration Number || रजिस्ट्रेशन नंबर
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    // ...existing code...
                    onBlur={(e) => {
                      if (e.target.value.trim() !== "") {
                        fetchVehicleDetails(e.target.value.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim() !== "") {
                        fetchVehicleDetails(e.target.value.trim());
                      }
                    }}
                    onFocus={() => setFocusedInput("registrationNumber")}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "registrationNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Chassis Number || चेसिस नंबर
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onFocus={() => setFocusedInput("chassisNumber")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "chassisNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={17}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Engine Number || इंजन नंबर
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onFocus={() => setFocusedInput("engineNumber")}
                    onChange={handleChange}
                    // ...existing code...
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "engineNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    KM Reading || किलोमीटर पढ़ाई
                  </label>
                  <input
                    type="text"
                    name="kmReading"
                    value={formData.kmReading}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        kmReading: rawValue,
                      }));
                    }}
                    onFocus={() => setFocusedInput("kmReading")}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "kmReading"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Calendar style={styles.sectionIcon} /> Booking Dates
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Booking Date || आगामी बुकिंग की तिथि
                  </label>
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Delivery Date || डिलीवरी की तिथि
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <IndianRupee style={styles.sectionIcon} /> Payment Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Total Amount (₹) || कुल राशि (₹)
                  </label>
                  <input
                    type="text"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={e => {
                      setFocusedInput("totalAmount");
                      if (formData.totalAmount === "0.00") {
                        setFormData({ ...formData, totalAmount: "" });
                      }
                    }}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "totalAmount"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Discount (₹) || छूट (₹)
                  </label>
                  <input
                    type="text"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("discount")}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "discount"
                        ? styles.inputFocused
                        : {}),
                    }}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Advance Paid (₹) || आगामी भुगतान (₹)
                  </label>
                  <input
                    type="text"
                    name="advancePaid"
                    value={formData.advancePaid}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={e => {
                      setFocusedInput("advancePaid");
                      if (formData.advancePaid === "0.00") {
                        setFormData({ ...formData, advancePaid: "" });
                      }
                    }}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "advancePaid"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Grand Total (₹) || कुल राशि (₹)
                  </label>
                  <input
                    type="text"
                    name="grandTotal"
                    value={formData.grandTotal}
                    style={{
                      ...styles.formInput,
                      backgroundColor: "#f1f5f9",
                      color: "#64748b",
                    }}
                    readOnly
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Balance Due (₹) || बैलेंस डु (₹)
                  </label>
                  <input
                    type="text"
                    name="balanceDue"
                    value={formData.balanceDue}
                    style={{
                      ...styles.formInput,
                      backgroundColor: "#f1f5f9",
                      color: "#64748b",
                    }}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Payment Method || भुगतान की विधि
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank transfer">Bank Transfer</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Note || टिप्पणी
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    style={styles.formTextarea}
                    placeholder="Add any notes or remarks"
                    maxLength={500}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => generateAdvanceBillPDF(formData, true)}
                style={styles.previewButton}
                disabled={isSaving}
              >
                <FileText style={styles.buttonIcon} /> Preview
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                style={styles.downloadButton}
                disabled={isSaving}
              >
                <Download style={styles.buttonIcon} /> Save & Download
              </button>
            </div>
          </form>
        </div>
      </div>
      {showPreviewModal && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "90%",
              width: "800px",
            }}
          >
            <h3 style={styles.modalTitle}>Advance Payment Invoice Preview</h3>
            <div
              style={{ height: "70vh", width: "100%", marginBottom: "20px" }}
            >
              {previewPdf ? (
                <iframe
                  src={previewPdf}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "1px solid #e2e8f0",
                  }}
                  title="PDF Preview"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#64748b",
                  }}
                >
                  Loading preview...
                </div>
              )}
            </div>
            
            <button
              style={styles.modalCloseButton}
              onClick={() => setShowPreviewModal(false)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
      {showLoadingOverlay && <LoadingOverlay />}
      {isDownloading && (
        <DownloadProgressModal
          progress={downloadProgress}
          onClose={() => {
            setIsDownloading(false);
            setDownloadProgress(0);
          }}
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
    transition: "transform 0.3s ease-in-out",
  },
  loadingOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },
  loadingContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    maxWidth: "400px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    margin: "0 auto 20px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "8px",
  },
  loadingSubtext: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "50%": { transform: "rotate(180deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
  "@keyframes pulse": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.5 },
    "100%": { opacity: 1 },
  },
  modalOverlay: {
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
  modalContent: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "8px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#1e293b",
  },
  modalText: {
    marginBottom: "24px",
    color: "#64748b",
  },
  modalButtons: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    justifyContent: "center",
  },
  modalCloseButton: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#e2e8f0",
    },
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid #1e293b",
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
  inputFocused: {
    backgroundColor: "yellow",
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
      backgroundColor: "#1e293b",
    },
  },
  menuItemActive: {
    backgroundColor: "#1e293b",
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
    backgroundColor: "rgba(26, 32, 44, 0.7)",
    maxHeight: 0,
    opacity: 0,
    overflow: "hidden",
    transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
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
    borderTop: "1px solid #1e293b",
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
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginTop: "8px",
  },
  statusText: {
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  queueCount: {
    fontSize: "0.75rem",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
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
  form: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "32px",
    border: "1px solid #e2e8f0",
  },
  formSection: {
    marginBottom: "40px",
    paddingBottom: "24px",
    borderBottom: "1px solid #e2e8f0",
    ":last-child": {
      borderBottom: "none",
      marginBottom: "0",
    },
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionIcon: {
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  formField: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: "8px",
  },
  formInput: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
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
  formSelect: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "1em",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },
  formTextarea: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    minHeight: "80px",
    resize: "vertical",
    transition: "all 0.2s ease",
    backgroundColor: "#f8fafc",
  },
  previewButton: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  saveButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  downloadButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  buttonIcon: {
    marginRight: "8px",
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    padding: "1rem",
    background: "#ffffff",
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
};

export default AdvancePayBillForm;
