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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../images/okmotorback.png";
import AuthContext from "../context/AuthContext";

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
    totalAmount: "",
    discount: "0",
    advancePaid: "",
    paymentMethod: "cash",
    grandTotal: "0",
    balanceDue: "0",
  });

  const [previewMode, setPreviewMode] = useState(false);
  const API_BASE_URL = "https://ok-motor.onrender.com/api";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const calculateAmounts = (data) => {
    const total = parseFloat(data.totalAmount) || 0;
    const advance = parseFloat(data.advancePaid) || 0;
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

    let cleanedValue = value;
    if (["totalAmount", "advancePaid", "kmReading"].includes(name)) {
      cleanedValue = value.replace(/[^0-9.]/g, "");
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

  const handleInput = (e) => {
    const { value } = e.target;
    e.target.value = value.toUpperCase();
    handleChange(e);
  };

  const handleSaveAndDownload = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }
      const requestData = {
        ...formData,
        user: user._id,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        advancePaid: parseFloat(formData.advancePaid) || 0,
        grandTotal: parseFloat(formData.grandTotal) || 0,
        balanceDue: parseFloat(formData.balanceDue) || 0,
        kmReading: parseFloat(formData.kmReading) || 0,
      };

      // Check if online
      if (navigator.onLine) {
        // Online: direct API call
        const saveResponse = await httpClient.post(
          `/advance-bills`,
          requestData
        );

        if (!saveResponse.data?.data?._id) {
          throw new Error("Invalid response format from server");
        }

        const billId = saveResponse.data.data._id;
        const pdfResponse = await httpClient.get(
          `/advance-bills/${billId}/download`,
          {
            responseType: "blob",
            headers: {
              Accept: "application/pdf",
            },
          }
        );

      const pdfBlob = new Blob([pdfResponse.data], { type: "application/pdf" });
      saveAs(pdfBlob, `advance-bill-${billId}.pdf`);

        alert("Advance bill saved and downloaded successfully!");
      } else {
        // Offline: queue for sync
        await offlineSyncManager.queueFormSubmission({
          type: "advance-bill",
          endpoint: "/advance-bills",
          method: "POST",
          data: requestData,
          userFriendlyName: `Advance Bill for ${requestData.vehicleNumber}`,
          onSuccess: (response) => {
            console.log("Advance bill synced successfully:", response);
          },
          onError: (error) => {
            console.error("Failed to sync advance bill:", error);
          },
        });

        alert(
          "You're offline. Advance bill has been saved locally and will be synced when you reconnect to the internet."
        );

        // Reset form for offline submission
        setFormData({
          customerName: "",
          customerNumber: "",
          customerAddress: "",
          vehicleNumber: "",
          vehicleName: "",
          vehicleModel: "",
          vehicleType: "",
          vehiclekm: "",
          engineNumber: "",
          chassisNumber: "",
          workDescription: "",
          totalAmount: "",
          advancePaid: "",
          grandTotal: "",
          balanceDue: "",
        });
      }
    } catch (error) {
      console.error("Error in save and download:", error);

      if (
        error.message.includes("offline") ||
        error.message.includes("network")
      ) {
        // Network error - try to queue for offline sync
        try {
          const requestData = {
            ...formData,
            user: user._id,
            totalAmount: parseFloat(formData.totalAmount) || 0,
            advancePaid: parseFloat(formData.advancePaid) || 0,
            grandTotal: parseFloat(formData.grandTotal) || 0,
            balanceDue: parseFloat(formData.balanceDue) || 0,
            kmReading: parseFloat(formData.kmReading) || 0,
          };

          await offlineSyncManager.queueFormSubmission({
            type: "advance-bill",
            endpoint: "/advance-bills",
            method: "POST",
            data: requestData,
            userFriendlyName: `Advance Bill for ${requestData.vehicleNumber}`,
          });

          alert(
            "Connection failed. Advance bill has been saved locally and will be synced when you reconnect."
          );
        } catch (queueError) {
          console.error("Failed to queue form for offline sync:", queueError);
          alert("Failed to save advance bill. Please try again.");
        }
      } else {
        alert(
          `Failed to save and download: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setIsSaving(false);
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

      // Calculate final amounts before sending
      const calculated = calculateAmounts(billData);

      // Prepare data with user ID and calculated amounts
      const requestData = {
        ...billData,
        user: user._id,
        grandTotal: calculated.grandTotal,
        balanceDue: calculated.balanceDue,
      };

      // First save the bill
      const saveResponse = await httpClient.post("/advance-bills", requestData);

      if (
        !saveResponse.data ||
        !saveResponse.data.data ||
        !saveResponse.data.data._id
      ) {
        throw new Error("Invalid response format from server");
      }

      const billId = saveResponse.data.data._id;

      // Get the PDF for preview or download
      const pdfResponse = await httpClient.get(
        `/advance-bills/${billId}/download`,
        {
          responseType: "blob",
        }
      );

      const pdfBlob = new Blob([pdfResponse.data], { type: "application/pdf" });

      if (forPreview) {
        // Create a blob URL for preview
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPreviewPdf(pdfUrl);
        setShowPreviewModal(true);
      } else {
        // For download
        saveAs(pdfBlob, `advance-bill-${billId}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Failed to generate PDF: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setShowLoadingOverlay(false);
    }
  };
  const fetchVehicleDetails = useCallback(async (registrationNumber) => {
    try {
      const response = await httpClient.get(`/advance-bills/vehicle-details`, {
        params: { registrationNumber },
      });

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
    <div style={styles.container}>
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

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Create Advance Payment Invoice</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details to generate an advance payment invoice for the
              vehicle
            </p>
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
                    onInput={handleInput}
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
                    onInput={handleInput}
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
                    onInput={handleInput}
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
                    onInput={handleInput}
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
                    onInput={handleInput}
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
                    onInput={handleInput}
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
                    Chassis Number || चेसिस नंबर
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onFocus={() => setFocusedInput("chassisNumber")}
                    onChange={handleChange}
                    onInput={handleInput}
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
                    onInput={handleInput}
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
                <Calendar style={styles.sectionIcon} /> Service Dates
              </h2>
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
                    onFocus={() => setFocusedInput("totalAmount")}
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
                    onFocus={() => setFocusedInput("advancePaid")}
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

export default AdvancePayBillForm;
