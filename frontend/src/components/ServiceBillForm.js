import React, { useState, useContext, useCallback } from "react";
import { saveAs } from "file-saver";
import {
  FileText,
  ArrowLeft,
  User,
  Car,
  Download,
  Calendar,
  IndianRupee,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash,
  Bike,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import httpClient from "../utils/offlineHttpClient";
import logo from "../images/company.png";

import AuthContext from "../context/AuthContext";

const ServiceBillForm = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeMenu, setActiveMenu] = useState("Create Service Bill");
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const [formData, setFormData] = useState({
    taxEnabled: false,
    businessName: "",
    businessGSTIN: "",
    businessAddress: "",
    totalAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    balanceDue: 0,
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerEmail: "",
    vehicleType: "bike",
    vehicleBrand: "",
    customServiceDescription: "",
    vehicleModel: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    kmReading: "",
    serviceDate: new Date().toISOString().split("T")[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    serviceType: "regular",
    serviceItems: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    discount: 0,
    taxRate: 0,
    paymentMethod: "cash",
    paymentStatus: "paid",
    advancePaid: 0,
    issuesReported: "",
    technicianNotes: "",
    warrantyInfo: "",
  });

  const [previewMode, setPreviewMode] = useState(false);
  const API_BASE_URL = "https://ok-motor.onrender.com/api";
  const calculateAmounts = (data) => {
    const totalAmount = (data.serviceItems || []).reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
      0
    );

    // Only calculate tax if tax is enabled
    const taxAmount = data.taxEnabled
      ? ((data.taxRate || 0) / 100) * totalAmount
      : 0;

    const grandTotal = totalAmount + taxAmount - (data.discount || 0);
    const balanceDue = grandTotal - (data.advancePaid || 0);

    return {
      totalAmount,
      taxAmount,
      grandTotal,
      balanceDue,
    };
  };
  const fetchVehicleDetails = useCallback(async (registrationNumber) => {
    try {
      const response = await httpClient.get(
        `${API_BASE_URL}/advance-bills/vehicle-details`,
        {
          params: { registrationNumber },
          headers: {
          },
        }
      );

      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          vehicleBrand: response.data.vehicleName || "",
          vehicleModel: response.data.vehicleModel || "",
          registrationNumber: response.data.registrationNumber || "",
          kmReading: response.data.vehiclekm || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    }
  }, []);
  const handleServiceItemChange = (index, e) => {
    const { name, value } = e.target;

    if (name === "rate") {
      const cleanedValue = value.replace(/[^0-9.]/g, "");

      const items = [...formData.serviceItems];
      items[index] = {
        ...items[index],
        rate: cleanedValue,
        amount: (parseFloat(cleanedValue) || 0) * (items[index].quantity || 1),
      };

      setFormData({
        ...formData,
        serviceItems: items,
        ...calculateAmounts({
          ...formData,
          serviceItems: items,
        }),
      });
      return;
    }

    // Normal handling for other fields
    const items = [...formData.serviceItems];
    items[index] = {
      ...items[index],
      [name]: name === "quantity" ? parseFloat(value) || 1 : value,
    };

    items[index].amount =
      items[index].quantity * (parseFloat(items[index].rate) || 0);

    setFormData({
      ...formData,
      serviceItems: items,
      ...calculateAmounts({
        ...formData,
        serviceItems: items,
      }),
    });
  };

  const addServiceItem = () => {
    const newItems = [
      ...formData.serviceItems,
      { description: "", quantity: 1, rate: "0", amount: 0 },
    ];

    setFormData({
      ...formData,
      serviceItems: newItems,
    });
    setTimeout(() => {
      const inputs = document.querySelectorAll('[name="description"]');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    }, 0);
  };

  const removeServiceItem = (index) => {
    const items = formData.serviceItems.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      serviceItems: items,
      ...calculateAmounts({ ...formData, serviceItems: items }),
    });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? parseFloat(value) || 0 : value;

    const newData = {
      ...formData,
      [name]: val,
    };

    // Always recalculate amounts, but calculateAmounts will handle taxEnabled check
    Object.assign(newData, calculateAmounts(newData));

    setFormData(newData);
  };
  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!formData.customerName.trim())
      errors.customerName = "Customer name is required";
    if (!formData.customerPhone.trim())
      errors.customerPhone = "Customer phone is required";
    if (!formData.customerAddress.trim())
      errors.customerAddress = "Customer address is required";
    if (!formData.vehicleBrand.trim())
      errors.vehicleBrand = "Vehicle brand is required";
    if (!formData.vehicleModel.trim())
      errors.vehicleModel = "Vehicle model is required";
    if (!formData.registrationNumber.trim())
      errors.registrationNumber = "Registration number is required";

    // Validate phone number format
    if (formData.customerPhone && !/^\d{10}$/.test(formData.customerPhone)) {
      errors.customerPhone = "Phone number must be 10 digits";
    }

    // Validate service items
    formData.serviceItems.forEach((item, index) => {
      if (!item.description.trim()) {
        errors[`serviceItems[${index}].description`] =
          "Description is required";
      }
      if (!item.rate || isNaN(item.rate) || Number(item.rate) <= 0) {
        errors[`serviceItems[${index}].rate`] = "Valid rate is required";
      }
      if (
        !item.quantity ||
        isNaN(item.quantity) ||
        Number(item.quantity) <= 0
      ) {
        errors[`serviceItems[${index}].quantity`] =
          "Valid quantity is required";
      }
    });

    return Object.keys(errors).length === 0 ? null : errors;
  };
  const handleSaveAndDownload = async () => {
    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const errors = validateForm();
      if (errors) {
        alert("Please fix the form errors before submitting");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please login again.");
        logout();
        navigate('/login');
        return;
      }

      // Start progress simulation
      const progressPromise = simulateProgress();

      const formDataWithUser = {
        ...formData,
        serviceDate: new Date(formData.serviceDate).toISOString(),
        deliveryDate: new Date(formData.deliveryDate).toISOString(),
        user: user._id,
      };

      const saveResponse = await retryRequest(() =>
        httpClient.post(
          `${API_BASE_URL}/service-bills`,
          formDataWithUser,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 30000, // 30 second timeout
          }
        )
      );

      if (!saveResponse.data?.data?._id) {
        throw new Error("Invalid response format from server");
      }

      const billId = saveResponse.data.data._id;
      const pdfResponse = await retryRequest(() =>
        httpClient.get(
          `${API_BASE_URL}/service-bills/${billId}/download`,
          {
            responseType: "blob",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/pdf",
            },
            timeout: 30000, // 30 second timeout
          }
        )
      );

      // Wait for progress to complete
      await progressPromise;

      const pdfBlob = new Blob([pdfResponse.data], { type: "application/pdf" });
      saveAs(pdfBlob, `service-bill-${billId}.pdf`);
      
      // Show success message and optionally reset form
      alert("Service bill saved and downloaded successfully!");
      
    } catch (error) {
      console.error("Error in save and download:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        logout();
        navigate('/login');
        return;
      }
      
      // Handle 503 Service Unavailable
      if (error.response?.status === 503) {
        alert("Server is temporarily unavailable. Please try again in a few moments. If the problem persists, the server might be restarting.");
        return;
      }
      
      let errorMessage = "Failed to save and download";
      if (error.response) {
        errorMessage = error.response.data?.message || "Server error occurred";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }
      
      alert(errorMessage);
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
            <h2 style={modalStyles.title}>Generating Service Bill PDF</h2>
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

  // Retry mechanism for failed requests
  const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Only retry on 503 errors or network errors
        if (error.response?.status === 503 || error.code === 'ECONNABORTED' || !error.response) {
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }
  };

  const generateServiceBillPDF = async (
    billData = formData,
    forPreview = false
  ) => {
    try {
      setShowLoadingOverlay(true);
      const token = localStorage.getItem("token");

      console.log("Generating PDF - Token present:", !!token);
      console.log("Generating PDF - Token preview:", token ? token.substring(0, 20) + '...' : 'No token');

      if (!token) {
        alert("Authentication required. Please login again.");
        logout();
        navigate('/login');
        return;
      }

      // Format dates properly before sending and ensure numeric fields are numbers
      const formattedBillData = {
        ...billData,
        serviceDate: new Date(billData.serviceDate).toISOString(),
        deliveryDate: new Date(billData.deliveryDate).toISOString(),
        serviceType: billData.serviceType || formData.serviceType,
        customServiceDescription:
          billData.customServiceDescription ||
          formData.customServiceDescription,
        user: user._id,
        // Ensure all numeric fields are numbers
        totalAmount: parseFloat(billData.totalAmount) || 0,
        taxAmount: parseFloat(billData.taxAmount) || 0,
        discount: parseFloat(billData.discount) || 0,
        grandTotal: parseFloat(billData.grandTotal) || 0,
        advancePaid: parseFloat(billData.advancePaid) || 0,
        balanceDue: parseFloat(billData.balanceDue) || 0,
        taxRate: parseFloat(billData.taxRate) || 0,
        // Ensure service items have proper numeric values
        serviceItems: billData.serviceItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0
        }))
      };

      // Log the formatted data for debugging
      console.log("Formatted bill data for API:", {
        serviceItemsCount: formattedBillData.serviceItems.length,
        sampleItem: formattedBillData.serviceItems[0],
        numericFields: {
          totalAmount: formattedBillData.totalAmount,
          taxAmount: formattedBillData.taxAmount,
          discount: formattedBillData.discount,
          grandTotal: formattedBillData.grandTotal
        }
      });

      if (forPreview) {
        // For preview, generate PDF without saving to database
        const previewResponse = await retryRequest(() =>
          httpClient.post(
            `${API_BASE_URL}/service-bills/preview`,
            formattedBillData,
            {
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              timeout: 30000, // 30 second timeout
            }
          )
        );

        const pdfBlob = new Blob([previewResponse.data], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setPreviewPdf(url);
        setShowPreviewModal(true);
      } else {
        // For download, save the bill first
        const saveResponse = await retryRequest(() =>
          httpClient.post(
            `${API_BASE_URL}/service-bills`,
            formattedBillData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              timeout: 30000, // 30 second timeout
            }
          )
        );

        if (!saveResponse.data?.data?._id) {
          throw new Error("Failed to save bill before generating PDF");
        }

        const billId = saveResponse.data.data._id;
        const pdfResponse = await retryRequest(() =>
          httpClient.get(
            `${API_BASE_URL}/service-bills/${billId}/download`,
            {
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/pdf",
              },
              timeout: 30000, // 30 second timeout
            }
          )
        );

        const pdfBlob = new Blob([pdfResponse.data], { type: "application/pdf" });
        saveAs(pdfBlob, `service-bill-${billId}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        logout();
        navigate('/login');
        return;
      }
      
      // Handle 503 Service Unavailable
      if (error.response?.status === 503) {
        alert("Server is temporarily unavailable. Please try again in a few moments. If the problem persists, the server might be restarting.");
        return;
      }
      
      let errorMessage = "Failed to generate PDF";
      if (error.response) {
        errorMessage = error.response.data?.message || "Server error occurred";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }

      alert(errorMessage);
    } finally {
      setShowLoadingOverlay(false);
    }
  };
  const handleInput = (e) => {
    const { name, value } = e.target;
    e.target.value = value.toUpperCase();
    handleChange(e);
  };
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

    // Add the conditional check here
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
              onClick={generateServiceBillPDF}
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
                    // Pass the path as-is (could be string or function)
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
            <h1 style={styles.pageTitle}>Create Service Bill</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details to generate a service bill for the vehicle
            </p>
          </div>

          <form style={styles.form}>
            {/* Customer Information */}
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
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
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
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
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
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
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
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    maxLength={30}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
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
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={25}
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
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                    required
                    maxLength={25}
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
                    onInput={handleInput}
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
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "kmReading"
                        ? styles.inputFocused
                        : {}),
                    }}
                    placeholder="e.g. 36,000.00"
                  />
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Wrench style={styles.sectionIcon} /> Service Details
              </h2>
              {/* Service Details */}
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Service Date || सेवा की तिथि
                  </label>
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("serviceDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "serviceDate"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    onFocus={() => setFocusedInput("deliveryDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "deliveryDate"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Wrench style={styles.formIcon} />
                    Service Type || सेवा का प्रकार
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="regular">Regular Service</option>
                    <option value="premium">Premium Service</option>
                    <option value="custom">Custom Service</option>
                  </select>
                </div>

                {/* Add this conditional field */}
                {formData.serviceType === "custom" && (
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      <Wrench style={styles.formIcon} />
                      Custom Service Description || कस्टम सेवा विवरण
                    </label>
                    <textarea
                      name="customServiceDescription"
                      value={formData.customServiceDescription}
                      onChange={handleChange}
                      rows={3}
                      style={styles.formTextarea}
                      placeholder="Describe the custom service requirements"
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Service Items */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <ShoppingCart style={styles.sectionIcon} /> Service Items
              </h2>
              <div style={{ marginBottom: "20px" }}>
                {formData.serviceItems.map((item, index) => (
                  <div key={index} style={styles.serviceItemRow}>
                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>
                        Description || विवरण
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={item.description}
                        onChange={(e) => handleServiceItemChange(index, e)}
                        onInput={handleInput}
                        onFocus={() => setFocusedInput("description")}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                          ...styles.formInput,
                          ...(focusedInput === "description"
                            ? styles.inputFocused
                            : {}),
                        }}
                        required
                        maxLength={30}
                      />
                    </div>
                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>Rate (₹) || दर (₹)</label>
                      <input
                        type="text"
                        name="rate"
                        value={item.rate}
                        onChange={(e) => handleServiceItemChange(index, e)}
                        onFocus={() => setFocusedInput("rate")}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                          ...styles.formInput,
                          ...(focusedInput === "rate"
                            ? styles.inputFocused
                            : {}),
                        }}
                        required
                        maxLength={10}
                        onKeyDown={(e) => {
                          // Allow only numbers and decimal point
                          if (
                            !/[0-9.]/.test(e.key) &&
                            e.key !== "Backspace" &&
                            e.key !== "Tab"
                          ) {
                            e.preventDefault();
                          }
                          // Move to next field on Enter
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const nextField = e.target
                              .closest(".service-item-row")
                              .querySelector('[name="quantity"]');
                            if (nextField) nextField.focus();
                          }
                        }}
                      />
                    </div>

                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>Qty || मात्रा</label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleServiceItemChange(index, e)}
                        onFocus={() => setFocusedInput("quantity")}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                          ...styles.formInput,
                          ...(focusedInput === "quantity"
                            ? styles.inputFocused
                            : {}),
                        }}
                        min="1"
                        required
                        maxLength={10}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const nextField = e.target
                              .closest(".service-item-row")
                              .querySelector('[name="rate"]');
                            if (nextField) nextField.focus();
                          }
                        }}
                      />
                    </div>

                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>
                        Amount (₹) || राशि (₹)
                      </label>
                      <input
                        type="text"
                        value={item.amount.toFixed(2)}
                        style={styles.formInput}
                        readOnly
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeServiceItem(index)}
                      style={styles.removeItemButton}
                      tabIndex={-1} // Remove from tab order since we have keyboard shortcut
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addServiceItem}
                  style={styles.addItemButton}
                >
                  <Plus size={16} /> Add Service Item
                </button>
              </div>
            </div>

            {/* Payment Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <IndianRupee style={styles.sectionIcon} /> Payment Information
              </h2>
              <div style={styles.formGrid}>
                {/* Add this toggle switch at the top of the payment section */}
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Enable Tax || कर सक्षम करें
                  </label>
                  <div style={styles.toggleContainer}>
                    <label style={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.taxEnabled}
                        onChange={() => {
                          const newData = {
                            ...formData,
                            taxEnabled: !formData.taxEnabled,
                            // Reset tax rate to 18 when enabling, 0 when disabling
                            taxRate: !formData.taxEnabled ? 18 : 0,
                          };
                          setFormData({
                            ...newData,
                            ...calculateAmounts(newData),
                          });
                        }}
                      />
                      <span style={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
                {formData.taxEnabled && (
                  <>
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>
                        Business Name || व्यापार का नाम
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        onInput={handleInput}
                        onFocus={() => setFocusedInput("businessName")}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                          ...styles.formInput,
                          ...(focusedInput === "businessName"
                            ? styles.inputFocused
                            : {}),
                        }}
                        maxLength={30}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>
                        Business GSTIN || व्यापार का GSTIN
                      </label>
                      <input
                        type="text"
                        name="businessGSTIN"
                        value={formData.businessGSTIN}
                        onChange={handleChange}
                        onInput={handleInput}
                        onFocus={() => setFocusedInput("businessGSTIN")}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                          ...styles.formInput,
                          ...(focusedInput === "businessGSTIN"
                            ? styles.inputFocused
                            : {}),
                        }}
                        maxLength={11}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>
                        Business Address || व्यापार का पता
                      </label>
                      <textarea
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleChange}
                        rows={3}
                        onInput={handleInput}
                        style={styles.formTextarea}
                        maxLength={100}
                      />
                    </div>
                  </>
                )}
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Sub Total (₹) || कुल राशि (₹)
                  </label>
                  <input
                    type="number"
                    value={(formData.totalAmount || 0).toFixed(2)}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Tax Rate (%) || कर दर (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxEnabled ? formData.taxRate : 0}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("taxRate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "taxRate"
                        ? styles.inputFocused
                        : {}),
                    }}
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={!formData.taxEnabled}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Tax Amount (₹) || कर राशि (₹)
                  </label>
                  <input
                    type="number"
                    value={
                      formData.taxEnabled
                        ? formData.taxAmount.toFixed(2)
                        : "0.00"
                    }
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Discount (₹) || छूट (₹)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("kmReading")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "kmReading"
                        ? styles.inputFocused
                        : {}),
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Grand Total (₹) || कुल राशि (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.grandTotal.toFixed(2)}
                    onFocus={() => setFocusedInput("kmReading")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "kmReading"
                        ? styles.inputFocused
                        : {}),
                    }}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Advance Paid (₹) || आगामी भुगतान (₹)
                  </label>
                  <input
                    type="number"
                    name="advancePaid"
                    value={formData.advancePaid}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("kmReading")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "kmReading"
                        ? styles.inputFocused
                        : {}),
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Balance Due (₹) || बैलेंस डु (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.balanceDue.toFixed(2)}
                    onFocus={() => setFocusedInput("kmReading")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "kmReading"
                        ? styles.inputFocused
                        : {}),
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
                    Payment Status || भुगतान की स्थिति
                  </label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <AlertCircle style={styles.sectionIcon} /> Additional
                Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Issues Reported || समस्याएं रिपोर्ट की गई
                  </label>
                  <textarea
                    name="issuesReported"
                    value={formData.issuesReported}
                    onChange={handleChange}
                    rows={3}
                    onInput={handleInput}
                    style={styles.formTextarea}
                    maxLength={100}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Technician Notes || तकनीकी नोट्स
                  </label>
                  <textarea
                    name="technicianNotes"
                    value={formData.technicianNotes}
                    onChange={handleChange}
                    rows={3}
                    onInput={handleInput}
                    style={styles.formTextarea}
                    maxLength={100}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Warranty Information || बिक्री की विधि
                  </label>
                  <textarea
                    name="warrantyInfo"
                    value={formData.warrantyInfo}
                    onChange={handleChange}
                    rows={3}
                    onInput={handleInput}
                    style={styles.formTextarea}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => generateServiceBillPDF(formData, true)}
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
            <h3 style={styles.modalTitle}>Service Bill Preview</h3>
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
  inputFocused: {
    backgroundColor: "yellow",
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
  serviceItemRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  serviceItemField: {
    flex: 1,
    minWidth: 0,
  },
  removeItemButton: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: "#dc2626",
    },
  },
  addItemButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    marginTop: "10px",
    ":hover": {
      backgroundColor: "#059669",
    },
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
};

export default ServiceBillForm;
