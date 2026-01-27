import { useState, useCallback, useContext, useEffect, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import axios from "axios";
import apiService from "../services/apiService";
import fileSaveService from "../services/fileSaveService";
import { loadPDFTemplate } from "../utils/pdfTemplateLoader";
import {
  User,
  FileSignature,
  Car,
  Download,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  ShipWheel,
  Users,
  AlertCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Bike,
  FileText,
  Menu,
  X,
  Image,
  Settings,
  RefreshCw,
  Megaphone,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";

import AuthContext from "../context/AuthContext";
import ImageCropper from "./ImageCropper";
import FileUploadModal from "./FileUploadModal";
import {
  isPdfFile,
  isImageFile,
  extractImagesFromPdf,
  convertPdfToImages,
} from "../utils/pdfHandler";

// helper to turn dataURL into File
const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const SellLetterForm = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState("Create Sell Letter");
  const [expandedMenus, setExpandedMenus] = useState({});

  const savePromiseRef = useRef(null);
  const saveResultRef = useRef(null);
  const [createdId, setCreatedId] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [, setMissingFields] = useState([]);
  const [previewLanguage, setPreviewLanguage] = useState("hindi");
  const [selectedLanguage, setSelectedLanguage] = useState("hindi");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  const location = useLocation();
  const editLetter = location.state?.editLetter;

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const [formData, setFormData] = useState(
    editLetter
      ? {
          ...editLetter,
          saleDate: getCurrentDate(),
          saleTime: getCurrentTime(),
          todayDate: getCurrentDate(),
          todayTime: getCurrentTime(),
          selleraadhar: editLetter.selleraadhar,
          sellerphone: editLetter.sellerphone,
        }
      : {
          vehicleName: "",
          vehicleModel: "",
          vehicleColor: "",
          registrationNumber: "",
          chassisNumber: "",
          engineNumber: "",
          vehiclekm: "",
          pucIssueDate: "",
          pucExpiryDate: "",
          pucStatus: "",
          insuranceStatus: "",
          insuranceExpiryDate: "",
          insuranceCompany: "",
          insurancePolicyNumber: "",
          buyerName: "",
          buyerFatherName: "",
          buyerAddress: "",
          buyerEmail: "",
          buyerPhone: "",
          buyerPhone2: "",
          buyerAadhar: "",
          buyerName1: "",
          buyerName2: "",
          vehicleCondition: "running",
          saleDate: getCurrentDate(),
          saleTime: getCurrentTime(),
          saleAmount: "",
          todayDate: getCurrentDate(),
          todayTime: getCurrentTime(),
          previousDate: getCurrentDate(),
          previousTime: getCurrentTime(),
          paymentMethod: "cash",
          sellerphone: "9876543210",
          selleraadhar: "764465626571",
          witnessName: "",
          witnessPhone: "",
          documentsVerified: true,
          note: "",
        },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [aadhaarUploadMode, setAadhaarUploadMode] = useState("separate");
  const [filesState, setFilesState] = useState({
    vehicleRCFront: null,
    vehicleRCBack: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panPhoto: null,
    vehicleKMPhoto: null,
    vehiclePhotos: [],
  });
  const [filePreviews, setFilePreviews] = useState({});

  // Crop states
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropFieldName, setCropFieldName] = useState(null);
  const [cropFileName, setCropFileName] = useState(null);

  // Upload modal states
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadModalFieldName, setUploadModalFieldName] = useState(null);
  const [uploadModalAllowPdf, setUploadModalAllowPdf] = useState(false);

  const [, setSavedSellLetter] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    fetchVehicles();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      try {
        Object.values(filePreviews).forEach((v) => {
          if (Array.isArray(v)) v.forEach((u) => URL.revokeObjectURL(u));
          else if (typeof v === "string") URL.revokeObjectURL(v);
        });
      } catch (err) {}
    };
  }, [filePreviews]);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const token = localStorage.getItem("token");
      const API_BASE =
        process.env.REACT_APP_API_URL || "https://ok-motor-51l3.vercel.app";
      const response = await axios.get(
        `${API_BASE}/api/vehicles?availabilityStatus=Available&limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleVehicleSelect = (e) => {
    const vehicleId = e.target.value;
    setSelectedVehicleId(vehicleId);

    if (vehicleId) {
      const vehicle = vehicles.find((v) => v._id === vehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          vehicleName: vehicle.vehicleName || "",
          vehicleModel: vehicle.vehicleModel || "",
          vehicleColor: vehicle.vehicleColor || "",
          registrationNumber: vehicle.registrationNumber || "",
          chassisNumber: vehicle.chassisNumber || "",
          engineNumber: vehicle.engineNumber || "",
          vehiclekm: vehicle.kilometersRun?.toString() || "",
          vehicleCondition: vehicle.vehicleCondition || "running",
        }));
      }
    }
  };

  useEffect(() => {
    if (!editLetter) {
      try {
        const savedDraft = localStorage.getItem("sellLetterDraft");
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          setFormData((prev) => ({ ...prev, ...draftData }));
          console.log("Loaded draft data from localStorage");
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
        localStorage.removeItem("sellLetterDraft");
      }
    }
  }, [editLetter]);

  // If we were navigated here to edit an existing letter, fetch the full
  // sell-letter from the server (it may contain PUC/Insurance fields or
  // document URLs that were not included in the list view). Normalize date
  // fields to `YYYY-MM-DD` so they populate HTML date inputs correctly.
  useEffect(() => {
    const loadFullEditLetter = async () => {
      try {
        if (!editLetter || !editLetter._id) return;
        const API_BASE =
          process.env.REACT_APP_API_URL || "https://ok-motor-51l3.vercel.app";
        const token = localStorage.getItem("token");
        const resp = await axios.get(
          `${API_BASE}/api/sell-letters/${editLetter._id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        const full = resp.data || {};

        const toInputDate = (v) => {
          if (!v) return "";
          const dt = new Date(v);
          if (isNaN(dt.getTime())) return String(v);
          return dt.toISOString().split("T")[0];
        };

        const normalized = {
          ...full,
          pucIssueDate: toInputDate(full.pucIssueDate),
          pucExpiryDate: toInputDate(full.pucExpiryDate),
          insuranceExpiryDate: toInputDate(full.insuranceExpiryDate),
          saleDate: toInputDate(full.saleDate) || getCurrentDate(),
          todayDate: toInputDate(full.todayDate) || getCurrentDate(),
          previousDate: toInputDate(full.previousDate) || getCurrentDate(),
          // keep times as-is if present
          saleTime: full.saleTime || getCurrentTime(),
          todayTime: full.todayTime || getCurrentTime(),
          previousTime: full.previousTime || getCurrentTime(),
        };

        setFormData((prev) => ({ ...prev, ...normalized }));

        // If server returned stored document URLs, show them as previews
        if (full.documents) {
          const previews = {};
          
          // Set aadhaarUploadMode based on loaded document
          if (full.documents.aadhaarUploadMode) {
            setAadhaarUploadMode(full.documents.aadhaarUploadMode);
          } else {
            // Detect mode from existing data
            const sameUrl = full.documents.aadhaar?.front === full.documents.aadhaar?.back;
            setAadhaarUploadMode(sameUrl && full.documents.aadhaar?.front ? "single" : "separate");
          }
          
          if (full.documents.vehicleRC) {
            previews.vehicleRCFront = full.documents.vehicleRC.front || null;
            previews.vehicleRCBack = full.documents.vehicleRC.back || null;
          }
          if (full.documents.aadhaar) {
            previews.aadhaarFront = full.documents.aadhaar.front || null;
            previews.aadhaarBack = full.documents.aadhaar.back || null;
          }
          if (full.documents.pan)
            previews.panPhoto = full.documents.pan || null;
          if (full.documents.vehicleKM)
            previews.vehicleKMPhoto = full.documents.vehicleKM || null;
          if (Array.isArray(full.documents.vehiclePhotos))
            previews.vehiclePhotos = full.documents.vehiclePhotos;

          setFilePreviews((prev) => ({ ...prev, ...previews }));
          setSavedSellLetter(full);
        }
      } catch (err) {
        console.error("Failed to load full sell letter for edit:", err);
      }
    };

    loadFullEditLetter();
  }, [editLetter]);

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all form data?")) {
      const defaultFormData = {
        vehicleName: "",
        vehicleModel: "",
        vehicleColor: "",
        registrationNumber: "",
        chassisNumber: "",
        engineNumber: "",
        vehiclekm: "",
        buyerName: "",
        buyerFatherName: "",
        buyerAddress: "",
        buyerEmail: "",
        buyerPhone: "",
        buyerPhone2: "",
        buyerAadhar: "",
        buyerName1: "",
        buyerName2: "",
        vehicleCondition: "running",
        saleDate: new Date().toISOString().split("T")[0],
        saleTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        saleAmount: "",
        todayDate: new Date().toISOString().split("T")[0],
        todayTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        previousDate: new Date().toISOString().split("T")[0],
        previousTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod: "cash",
        sellerphone: "9876543210",
        selleraadhar: "764465626571",
        witnessName: "",
        witnessPhone: "",
        documentsVerified: true,
        note: "",
      };

      setFormData(defaultFormData);

      setCreatedId(null);
      saveResultRef.current = null;
      savePromiseRef.current = null;

      try {
        localStorage.removeItem("sellLetterDraft");
      } catch (error) {
        console.error("Failed to clear draft:", error);
      }
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    // clear field error when user types
    if (name) {
      setErrors((prev) => {
        if (!prev || !prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        try {
          const el = document.querySelector(`[name="${name}"]`);
          if (el) {
            el.style.borderColor = "";
            el.style.boxShadow = "";
          }
        } catch (err) {}
        return next;
      });
    }
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "buyerName") {
        newData.buyerName1 = value;
        newData.buyerName2 = value;
      }
      if (name === "todayDate") {
        newData.previousDate = value;
      }
      if (name === "todayTime") {
        newData.previousTime = value;
      }

      try {
        localStorage.setItem("sellLetterDraft", JSON.stringify(newData));
      } catch (error) {
        console.error("Failed to save draft:", error);
      }

      return newData;
    });
  }, []);

  const validateForm = () => {
    const requiredFields = [
      "vehicleName",
      "vehicleModel",
      "vehicleColor",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "vehiclekm",
      "buyerName",
      "buyerFatherName",
      "buyerAddress",
      "buyerPhone",
      "saleDate",
      "saleTime",
      "saleAmount",
      "paymentMethod",
      "todayDate",
      "todayTime",
      "witnessName",
      "witnessPhone",
    ];
    const errs = {};
    requiredFields.forEach((field) => {
      const val = formData[field];
      if (val === undefined || val === null || String(val).trim() === "") {
        errs[field] = `This ${field} is required`;
        try {
          const el = document.querySelector(`[name="${field}"]`);
          if (el) {
            el.style.borderColor = "#ef4444";
            el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)";
          }
        } catch (err) {}
      }
    });
    setErrors(errs);

    const keys = Object.keys(errs);
    if (keys.length > 0) {
      const firstKey = keys[0];
      try {
        alert(errs[firstKey] || "Please fill required fields");
      } catch (err) {}

      try {
        const el = document.querySelector(`[name="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
          el.style.borderColor = "#ef4444";
          el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)";
        }
      } catch (err) {}
    }

    return errs;
  };

  // File input handlers
  const handleFileInput = (fieldName, allowPdf = false) => {
    setUploadModalFieldName(fieldName);
    setUploadModalAllowPdf(allowPdf);
    setShowFileUploadModal(true);
  };

  // Remove/clear an uploaded image
  const handleRemoveFile = (fieldName) => {
    setFilesState((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    setFilePreviews((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleFileUploadSelect = async (file, uploadType) => {
    if (!file || !uploadModalFieldName) {
      setShowFileUploadModal(false);
      return;
    }

    try {
      // Handle PDF files
      if (isPdfFile(file)) {
        // Convert first page of PDF to PNG and use that for upload + preview
        let convertedFile = null;
        let previewImage = null;
        try {
          const pdfImages = await convertPdfToImages(file);
          if (Array.isArray(pdfImages) && pdfImages[0]?.data) {
            previewImage = pdfImages[0].data;
            convertedFile = dataUrlToFile(
              pdfImages[0].data,
              `${uploadModalFieldName || "document"}.png`,
            );
          }
        } catch (err) {
          console.warn("PDF to image conversion failed", err);
        }

        // fallback: use original PDF if conversion failed
        const pdfData = await extractImagesFromPdf(file);
        const pdfUrl = pdfData?.url || URL.createObjectURL(file);

        const finalFile = convertedFile || file;
        const effectivePreview = previewImage || pdfUrl;
        
        // Special handling for Aadhaar based on upload mode
        if (uploadModalFieldName === "aadhaarFront" && aadhaarUploadMode === "single") {
          // Single file mode: use for both front and back
          setFilesState((prev) => ({
            ...prev,
            aadhaarFront: finalFile,
            aadhaarBack: finalFile,
          }));
          setFilePreviews((prev) => ({
            ...prev,
            aadhaarFront: effectivePreview,
            aadhaarBack: effectivePreview,
          }));
        } else {
          setFilesState((prev) => ({
            ...prev,
            [uploadModalFieldName]: finalFile,
          }));
          setFilePreviews((prev) => ({
            ...prev,
            [uploadModalFieldName]: effectivePreview,
          }));
        }
        setShowFileUploadModal(false);
        return;
      }

      // Handle image files - show cropper
      if (isImageFile(file)) {
        const url = URL.createObjectURL(file);
        setCropImageSrc(url);
        setCropFieldName(uploadModalFieldName);
        setCropFileName(file.name);
        setShowFileUploadModal(false);
        setShowCropper(true);
        return;
      }

      // Invalid file type
      alert("Please select a valid image or PDF file");
      setShowFileUploadModal(false);
    } catch (error) {
      console.error("Error handling file upload:", error);
      alert("Error processing file. Please try again.");
      setShowFileUploadModal(false);
    }
  };

  const closeFileUploadModal = () => {
    setShowFileUploadModal(false);
    setUploadModalFieldName(null);
    setUploadModalAllowPdf(false);
  };

  const handleMultipleFileInput = (fieldName) => {
    // For multiple files, we handle them without the modal for now
    // Create temporary input element
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
      const fileList = Array.from(e.target.files || []);
      const limited = fileList.slice(0, 4);
      setFilesState((prev) => ({ ...prev, [fieldName]: limited }));
      const prevs = limited.map((f) => URL.createObjectURL(f));
      setFilePreviews((prev) => ({ ...prev, [fieldName]: prevs }));
    };
    input.click();
  };

  const onCropCancel = () => {
    setShowCropper(false);
    setCropImageSrc(null);
    setCropFieldName(null);
    setCropFileName(null);
  };

  const onCropComplete = (croppedBlob) => {
    if (!cropFieldName) return;

    const file = new File([croppedBlob], cropFileName || "image.jpg", {
      type: "image/jpeg",
    });

    // Special handling for Aadhaar based on upload mode
    if (cropFieldName === "aadhaarFront" && aadhaarUploadMode === "single") {
      // Single file mode: use for both front and back
      setFilesState((prev) => ({
        ...prev,
        aadhaarFront: file,
        aadhaarBack: file,
      }));
      const url = URL.createObjectURL(file);
      setFilePreviews((prev) => ({
        ...prev,
        aadhaarFront: url,
        aadhaarBack: url,
      }));
    } else {
      setFilesState((prev) => ({ ...prev, [cropFieldName]: file }));
      const url = URL.createObjectURL(file);
      setFilePreviews((prev) => ({ ...prev, [cropFieldName]: url }));
    }

    setShowCropper(false);
    setCropImageSrc(null);
    setCropFieldName(null);
    setCropFileName(null);
  };

  const removeVehiclePhoto = (index) => {
    setFilesState((prev) => {
      const arr = (prev.vehiclePhotos || []).slice();
      arr.splice(index, 1);
      return { ...prev, vehiclePhotos: arr };
    });
    setFilePreviews((prev) => {
      const arr = (prev.vehiclePhotos || []).slice();
      arr.splice(index, 1);
      return { ...prev, vehiclePhotos: arr };
    });
  };
  const DownloadProgressModal = ({ progress, onClose }) => {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <div style={modalStyles.logoContainer}>
              <img src={logo1} alt="OK Motor Logo" style={modalStyles.logo} />
            </div>
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
                  backgroundColor: "#088395",
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
      backgroundColor: "#088395",
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
      icon: Image,
      path: "/gallery/manage",
    },
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
  const handlePreview = async (language = "hindi") => {
    try {
      setIsSaving(true);

      const requiredFields = [
        "vehicleName",
        "vehicleModel",
        "vehicleColor",
        "registrationNumber",
        "chassisNumber",
        "engineNumber",
        "vehiclekm",
        "buyerName",
        "buyerFatherName",
        "buyerAddress",
        "buyerPhone",
        "buyerAadhar",
        "saleAmount",
      ];
      const emptyFields = requiredFields.filter((field) => !formData[field]);

      if (emptyFields.length > 0) {
        setMissingFields(emptyFields);
        // alert and then focus first missing field
        try {
          alert("Please fill all required fields before preview.");
        } catch (err) {}
        try {
          const first = emptyFields[0];
          const el = document.querySelector(`[name="${first}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
            el.style.borderColor = "#ef4444";
            el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)";
          }
        } catch (err) {}
        return;
      }

      setMissingFields([]);
      const templateName =
        language === "hindi" ? "sellletter.pdf" : "englishsell.pdf";
      const existingPdfBytes = await loadPDFTemplate(templateName);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedData = {
        ...formData,
        buyerName1: formData.buyerName,
        buyerName2: formData.buyerName,
        saleAmount: formatRupee(formData.saleAmount) || "0",
        amountInWords: formatIndianAmountInWords(formData.saleAmount),
        vehiclekm: formatKm(formData.vehiclekm) || "0",
        saleDate: formatDate(formData.saleDate),
        saleTime: formatTime(formData.saleTime),
        todayDate: formatDate(formData.todayDate || new Date()),
        todayTime: formatTime(formData.todayTime || "12:00"),
        previousDate: formatDate(
          formData.previousDate || formData.todayDate || new Date(),
        ),
        previousTime: formatTime(
          formData.previousTime || formData.todayTime || "12:00",
        ),
      };

      formattedData.witnessName =
        formattedData.witnessName && String(formattedData.witnessName).trim()
          ? formattedData.witnessName
          : "N/A";
      formattedData.witnessPhone =
        formattedData.witnessPhone && String(formattedData.witnessPhone).trim()
          ? formattedData.witnessPhone
          : "0000000000";

      const positions =
        language === "hindi" ? hindiFieldPositions : englishFieldPositions;

      for (const [fieldName, position] of Object.entries(positions)) {
        if (fieldName === "buyerPhone" && formattedData.buyerPhone) {
          const combinedPhones = `${formattedData.buyerPhone}${
            formattedData.buyerPhone2 ? ` , ${formattedData.buyerPhone2}` : ""
          }`;
          pdfDoc.getPages()[0].drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        } else if (fieldName === "amountInWords" && formattedData[fieldName]) {
          const saleAmountText = formattedData.saleAmount || "";
          const saleAmountFontSize = positions.saleAmount?.size || 11;

          const saleAmountWidth =
            saleAmountText.length * saleAmountFontSize * 0.6;
          const dynamicX =
            (positions.saleAmount?.x || position.x) + saleAmountWidth + 10;
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: dynamicX,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        }
      }

      // eslint-disable-next-line no-unused-vars
      const embedImageFromUrl = async (url) => {
        try {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type") || "";
          const bytes = await res.arrayBuffer();
          if (contentType.includes("png")) return await pdfDoc.embedPng(bytes);
          return await pdfDoc.embedJpg(bytes);
        } catch (err) {
          console.warn("Failed to embed image from", url, err);
          return null;
        }
      };

      // eslint-disable-next-line no-unused-vars
      const addDocumentPages = async (documentsObj) => {
        if (!documentsObj) return;
        const items = [];
        if (documentsObj.vehicleRC) {
          if (documentsObj.vehicleRC.front)
            items.push({
              title: "Vehicle RC - Front",
              url: documentsObj.vehicleRC.front,
            });
          if (documentsObj.vehicleRC.back)
            items.push({
              title: "Vehicle RC - Back",
              url: documentsObj.vehicleRC.back,
            });
        }
        if (documentsObj.aadhaar) {
          if (documentsObj.aadhaar.front)
            items.push({
              title: "Aadhaar - Front",
              url: documentsObj.aadhaar.front,
            });
          if (documentsObj.aadhaar.back)
            items.push({
              title: "Aadhaar - Back",
              url: documentsObj.aadhaar.back,
            });
        }
        if (documentsObj.pan)
          items.push({ title: "PAN Card", url: documentsObj.pan });
        if (documentsObj.vehicleKM)
          items.push({ title: "Vehicle KM", url: documentsObj.vehicleKM });
        if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
          documentsObj.vehiclePhotos.forEach((u, i) =>
            items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
          );
        }
        // Pack up to 4 images per page in a responsive 2x2 grid to avoid wasted space
        for (let i = 0; i < items.length; i += 4) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);

            // same header as invoice
            page.drawRectangle({
              x: 0,
              y: 780,
              width: 595,
              height: 80,
              color: rgb(0.047, 0.098, 0.196),
            });

            page.drawImage(logoImg, { x: 50, y: 743, width: 150, height: 120 });

            // watermark images
            try {
              page.drawImage(logoImg, {
                x: 180,
                y: 430,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
              page.drawImage(logoImg, {
                x: 180,
                y: 130,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
            } catch (wmErr) {
              // ignore watermark errors
            }

            page.drawText("UDAYAM-BR-26-0028550", {
              x: 330,
              y: 805,
              size: 18,
              color: rgb(255, 255, 255, 1),
              font,
            });
            page.drawRectangle({
              x: 0,
              y: 750,
              width: 595,
              height: 30,
              color: rgb(0.9, 0.9, 0.9),
            });
          } catch (err) {
            // ignore header errors
          }

          // positions for 2x2 grid
          const cols = [40, 315];
          const rows = [720, 360];
          for (let cell = 0; cell < 4; cell++) {
            const item = items[i + cell];
            if (!item) continue;
            const col = cell % 2;
            const row = Math.floor(cell / 2);
            const x = cols[col];
            const yTop = rows[row];

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x,
              y: yTop,
              size: 11,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(item.url);
            if (embedded) {
              // compute fit for cell
              const cellMaxW = 240;
              const cellMaxH = 300;
              const { width, height } = embedded.scale(1);
              let drawW = cellMaxW;
              let drawH = (height / width) * drawW;
              if (drawH > cellMaxH) {
                drawH = cellMaxH;
                drawW = (width / height) * drawH;
              }
              const drawY = yTop - drawH - 10;
              page.drawImage(embedded, {
                x,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }
      };

      // add invoice as final page
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPreviewPdf(url);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  const formatIndianAmountInWords = (amount) => {
    if (isNaN(amount)) return "(Zero Rupees)";

    const num = parseFloat(amount);
    if (num === 0) return "(Zero Rupees)";

    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "Ten",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const convertLessThanHundred = (n) => {
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
    };

    const convertLessThanThousand = (n) => {
      if (n < 100) return convertLessThanHundred(n);
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return (
        units[hundred] +
        " hundred" +
        (remainder !== 0 ? " and " + convertLessThanHundred(remainder) : "")
      );
    };

    const convert = (n) => {
      if (n === 0) return "Zero";

      let result = "";
      const crore = Math.floor(n / 10000000);
      if (crore > 0) {
        result += convertLessThanThousand(crore) + " Crore ";
        n = n % 10000000;
      }

      const lakh = Math.floor(n / 100000);
      if (lakh > 0) {
        result += convertLessThanThousand(lakh) + " Lakh ";
        n = n % 100000;
      }

      const thousand = Math.floor(n / 1000);
      if (thousand > 0) {
        result += convertLessThanThousand(thousand) + " Thousand ";
        n = n % 1000;
      }

      if (n > 0) {
        result += convertLessThanThousand(n);
      }

      return result.trim();
    };

    const amountInPaise = num;
    return `(${convert(amountInPaise)} Only)`;
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };
  const formatKm = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
  };

  const formatRupee = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : `${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };
  const formatTime = (timeString) => {
    if (!timeString) return "";

    const [hour, minute] = timeString.split(":").map(Number);

    const hours12 = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";

    const formattedHours = String(hours12).padStart(2, "0");
    const formattedMinutes = String(minute).padStart(2, "0");

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };
  const saveToDatabase = async () => {
    try {
      setIsSaving(true);
      const requiredFields = [
        "vehicleName",
        "vehicleModel",
        "vehicleColor",
        "registrationNumber",
        "chassisNumber",
        "engineNumber",
        "vehiclekm",
        "buyerName",
        "buyerFatherName",
        "buyerAddress",
        "buyerPhone",
        "buyerPhone2",
        "buyerAadhar",
        "saleAmount",
        // seller-specific fields are not required for sell letters
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        const msg = `Please fill in all required fields: ${missingFields.join(
          ", ",
        )}`;
        try {
          alert(msg);
        } catch (err) {}
        // focus first missing field
        try {
          const first = missingFields[0];
          const el = document.querySelector(`[name="${first}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
            el.style.borderColor = "#ef4444";
            el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)";
          }
        } catch (err) {}
        setIsSaving(false);
        return false;
      }

      let response;

      const isElectron = window.electronAPI !== undefined;

      // Remove server-managed identifiers/fields to avoid duplicate key errors when versioning
      const {
        _id: _omitId,
        __v: _omitV,
        createdAt: _omitCreatedAt,
        updatedAt: _omitUpdatedAt,
        user: _omitUser,
        ...cleanFormData
      } = formData || {};

      const dataToSave = {
        ...cleanFormData,

        ...(editLetter?._id && {
          originalDocumentId: editLetter.originalDocumentId || editLetter._id,
          previousVersionId: editLetter._id,
          version: (editLetter.version || 1) + 1,
          editedAt: new Date().toISOString(),
          editedBy: user?._id || user?.id,
        }),
        ...(!editLetter?._id && {
          originalDocumentId: null,
          previousVersionId: null,
          version: 1,
        }),
      };

      // If any files are selected, submit as multipart/form-data so backend can process images
      const hasFiles =
        filesState.vehicleRCFront ||
        filesState.vehicleRCBack ||
        filesState.aadhaarFront ||
        filesState.aadhaarBack ||
        filesState.panPhoto ||
        filesState.vehicleKMPhoto ||
        (filesState.vehiclePhotos && filesState.vehiclePhotos.length > 0);

      if (hasFiles) {
        const form = new FormData();
        // append all scalar/primitive fields
        Object.entries(dataToSave).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (typeof value === "object") {
            form.append(key, JSON.stringify(value));
          } else {
            form.append(key, String(value));
          }
        });
        
        // Add aadhaarUploadMode to the form
        form.append("aadhaarUploadMode", aadhaarUploadMode);

        // append files using the field names expected by backend
        if (filesState.vehicleRCFront)
          form.append("vehicleRCFront", filesState.vehicleRCFront);
        if (filesState.vehicleRCBack)
          form.append("vehicleRCBack", filesState.vehicleRCBack);
        if (filesState.aadhaarFront)
          form.append("aadhaarFront", filesState.aadhaarFront);
        if (filesState.aadhaarBack)
          form.append("aadhaarBack", filesState.aadhaarBack);
        if (filesState.panPhoto) form.append("panPhoto", filesState.panPhoto);
        if (filesState.vehicleKMPhoto)
          form.append("vehicleKMPhoto", filesState.vehicleKMPhoto);
        if (filesState.vehiclePhotos && filesState.vehiclePhotos.length) {
          filesState.vehiclePhotos
            .slice(0, 4)
            .forEach((f) => form.append("vehiclePhotos", f));
        }

        if (isElectron) {
          response = await apiService.post("/api/sell-letters", form);
        } else {
          response = await axios.post(
            "https://ok-motor-51l3.vercel.app/api/sell-letters",
            form,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        }
      } else {
        if (isElectron) {
          response = await apiService.post("/api/sell-letters", dataToSave);
        } else {
          response = await axios.post(
            "https://ok-motor-51l3.vercel.app/api/sell-letters",
            dataToSave,
          );
        }
      }

      if (editLetter?._id) {
        alert("Sell letter saved as new version! Original remains unchanged.");
      } else {
        alert("Sell letter saved successfully!");
      }

      if (response.data) {
        if (response.data._cached) {
          alert("Sell letter queued for saving when online!");
        } else {
          try {
            localStorage.removeItem("sellLetterDraft");
          } catch (error) {
            console.error("Failed to clear draft:", error);
          }
        }
        // store returned sell letter for PDF generation (contains uploaded image URLs)
        const returned = response.data;
        setSavedSellLetter(returned);
        saveResultRef.current = returned;
        return returned;
      }
    } catch (error) {
      console.error("Error saving sell letter:", error);

      if (error.message === "Request queued for when online") {
        alert(
          "No internet connection. Sell letter will be saved when connection is restored.",
        );
        return true;
      }

      if (error.response) {
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors)
            .map((err) => err.message)
            .join("\n");
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          const serverMsg =
            error.response.data.message || "Failed to save sell letter.";
          const keyInfo = error.response.data.error
            ? `\nDetails: ${JSON.stringify(error.response.data.error)}`
            : "";
          alert(`${serverMsg}${keyInfo}`);
        }
      } else {
        alert("Failed to save sell letter. Please try again.");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndDownload = async () => {
    try {
      setIsSaving(true);

      // validate required fields before proceeding
      const errs = validateForm();
      if (Object.keys(errs).length > 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      let savedLetter;

      if (saveResultRef.current && !editLetter?._id && !createdId) {
        savedLetter = saveResultRef.current;
      } else if (savePromiseRef.current && !editLetter?._id && !createdId) {
        savedLetter = await savePromiseRef.current;
      } else {
        savePromiseRef.current = saveToDatabase();
        try {
          savedLetter = await savePromiseRef.current;
          if (!editLetter?._id && !createdId) {
            saveResultRef.current = savedLetter;
          }
        } finally {
          savePromiseRef.current = null;
        }
      }

      if (!savedLetter) throw new Error("Failed to save sell letter");

      const newId = savedLetter._id || savedLetter?.data?._id;
      if (newId && !createdId) setCreatedId(newId);
      if (selectedLanguage === "hindi") {
        await fillAndDownloadHindiPdf();
      } else {
        await fillAndDownloadEnglishPdf();
      }
      return savedLetter;
    } catch (error) {
      console.error("Error checking/saving sell letter:", error);
      let errorMessage = "Failed to process sell letter. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  const hindiFieldPositions = {
    amountInWords: { x: 60, y: 584, size: 10 },
    vehicleName: { x: 303, y: 696, size: 11 },
    vehicleModel: { x: 39, y: 674, size: 11 },
    vehicleColor: { x: 453, y: 696, size: 11 },
    registrationNumber: { x: 296, y: 674, size: 11 },
    chassisNumber: { x: 433, y: 674, size: 11 },
    engineNumber: { x: 87, y: 652, size: 11 },
    vehiclekm: { x: 308, y: 652, size: 11 },
    buyerName: { x: 40, y: 629, size: 11 },
    buyerFatherName: { x: 278, y: 629, size: 11 },
    buyerAddress: { x: 65, y: 607, size: 11 },
    buyerName1: { x: 102, y: 495, size: 11 },
    buyerName2: { x: 102, y: 451, size: 11 },
    saleDate: { x: 78, y: 584, size: 11 },
    saleTime: { x: 180, y: 584, size: 11 },
    saleAmount: { x: 273, y: 584, size: 11 },
    todayDate: { x: 210, y: 562, size: 11 },
    todayTime: { x: 324, y: 562, size: 11 },
    previousDate: { x: 243, y: 517, size: 11 },
    previousTime: { x: 363, y: 517, size: 11 },
    buyerPhone: { x: 85, y: 240, size: 11 },
    buyerEmail: { x: 200, y: 240, size: 10 },
    buyerPhone2: { x: 150, y: 240, size: 11 },
    buyerAadhar: { x: 111, y: 222, size: 11 },
    witnessName: { x: 70, y: 122, size: 11 },
    witnessPhone: { x: 70, y: 106, size: 11 },
    note: { x: 60, y: 33, size: 10 },
  };

  const englishFieldPositions = {
    amountInWords: { x: 60, y: 578, size: 10 },
    vehicleName: { x: 284, y: 680, size: 11 },
    vehicleModel: { x: 93, y: 660, size: 11 },
    vehicleColor: { x: 447, y: 680, size: 11 },
    registrationNumber: { x: 392, y: 660, size: 11 },
    chassisNumber: { x: 54, y: 640, size: 11 },
    engineNumber: { x: 263, y: 640, size: 11 },
    vehiclekm: { x: 455, y: 640, size: 11 },
    buyerName: { x: 185 - 16, y: 619, size: 11 },
    buyerFatherName: { x: 445 - 16, y: 619, size: 11 },
    buyerAddress: { x: 123 - 16, y: 599, size: 11 },
    buyerName1: { x: 120 - 16, y: 517, size: 11 },
    buyerName2: { x: 286 - 16, y: 482, size: 11 },
    saleDate: { x: 70 - 16, y: 578, size: 11 },
    saleTime: { x: 181 - 16, y: 578, size: 11 },
    saleAmount: { x: 285 - 16, y: 578, size: 11 },
    todayDate: { x: 156 - 16, y: 557, size: 11 },
    todayTime: { x: 291 - 16, y: 557, size: 11 },
    previousDate: { x: 240 - 16, y: 538, size: 11 },
    previousTime: { x: 340 - 16, y: 538, size: 11 },
    buyerPhone: { x: 109, y: 282, size: 11 },
    buyerEmail: { x: 200, y: 282, size: 10 },
    buyerPhone2: { x: 115, y: 282, size: 11 },
    buyerAadhar: { x: 137, y: 263, size: 11 },
    witnessName: { x: 105, y: 135, size: 11 },
    witnessPhone: { x: 105, y: 116, size: 11 },
    note: { x: 70, y: 35, size: 10 },
  };

  const drawVehicleInvoice = async (page, pdfDoc) => {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoUrl = logo1;
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer(),
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595,
      height: 80,
      color: rgb(0.047, 0.098, 0.196),
    });

    page.drawImage(logoImage, {
      x: 50,
      y: 743,
      width: 150,
      height: 120,
    });

    page.drawImage(logoImage, {
      x: 180,
      y: 430,
      width: 260,
      height: 220,
      opacity: 0.3,
    });
    page.drawImage(logoImage, {
      x: 180,
      y: 130,
      width: 260,
      height: 220,
      opacity: 0.3,
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 805,
      size: 18,
      color: rgb(1, 1, 1),
      font: font,
    });
    page.drawRectangle({
      x: 0,
      y: 750,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("VEHICLE SALE INVOICE", {
      x: 200,
      y: 758,
      size: 18,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    const invoiceNumber = `OKMTR-${(() => {
      const d = new Date();
      const y = d.getFullYear();
      return d.getMonth() >= 3
        ? `${y}-${String(y + 1).slice(-2)}`
        : `${y - 1}-${String(y).slice(-2)}`;
    })()}-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Date: ${formatDate(formData.todayDate)}`, {
      x: 385,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`Time: ${formatTime(formData.saleTime)}`, {
      x: 470,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 545, y: 710 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("CUSTOMER DETAILS", {
      x: 50,
      y: 690,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Name: ${formData.buyerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    const lineHeight2 = 12;

    const address = formData.buyerAddress || "N/A";
    const maxCharsPerLine = 38;
    const label = "Address: ";
    const labelWidth = 45;

    const addressLines = [];
    for (let i = 0; i < address.length; i += maxCharsPerLine) {
      addressLines.push(address.substring(i, i + maxCharsPerLine));
    }

    addressLines.forEach((line, index) => {
      const text = index === 0 ? `${label}${line}` : line;
      const xPos = index === 0 ? 60 : 60 + labelWidth;

      page.drawText(text, {
        x: xPos,
        y: 650 - index * lineHeight2,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });

    page.drawText(`Phone: ${formData.buyerPhone || "N/A"}`, {
      x: 370,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`, ${formData.buyerPhone2 || "N/A"}`, {
      x: 460,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Email: ${formData.buyerEmail || "N/A"}`, {
      x: 370,
      y: 640 - (addressLines.length - 1) * lineHeight2 - 6,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Aadhar: ${formData.buyerAadhar || "N/A"}`, {
      x: 370,
      y: 650,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: 620,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawRectangle({
      x: 50,
      y: 590,
      width: 495,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });

    const vehicleHeaders = [
      "Make",
      "Model",
      "Color",
      "Reg No",
      "Chassis",
      "Engine",
      "KM",
    ];
    const vehicleHeaderPositions = [60, 120, 180, 220, 280, 370, 460];

    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: vehicleHeaderPositions[index],
        y: 571,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: boldFont,
      });
    });
    const lineHeight = 12;

    const vehicleValues = [
      formData.vehicleName || "N/A",
      formData.vehicleModel || "N/A",
      formData.vehicleColor || "N/A",
      formData.registrationNumber || "N/A",
      formData.chassisNumber || "N/A",
      formData.engineNumber || "N/A",
      formData.vehiclekm ? `${formatKm(formData.vehiclekm)} km` : "N/A",
    ];

    const columnWidths = [60, 60, 40, 60, 80, 80, 40, 60];

    vehicleValues.forEach((value, index) => {
      const maxWidth = columnWidths[index];
      const xPos = vehicleHeaderPositions[index];
      let yPos = 550;

      const lines = [];
      let currentLine = "";

      for (const word of value.split(" ")) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: xPos,
          y: yPos - lineIndex * lineHeight,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
          font: font,
        });
      });
    });

    page.drawText("SALE INFORMATION", {
      x: 50,
      y: 515,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Sale Date: ${formatDate(formData.saleDate)}`, {
      x: 60,
      y: 495,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(
      `Sale Amount: Rs. ${formatRupee(formData.saleAmount) || "0"}`,
      {
        x: 200,
        y: 495,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );
    const paymentMethodDisplay = {
      cash: "CASH",
      upi: "UPI",
      bankTransfer: "BANK TRANSFER",
      soldloan: "Loan",
    };

    page.drawText(
      `Payment: ${paymentMethodDisplay[formData.paymentMethod] || "CASH"}`,
      {
        x: 350,
        y: 495,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );
    page.drawText(
      `Amount in Words: ${formatIndianAmountInWords(
        !formData.saleAmount || isNaN(Number(formData.saleAmount))
          ? 0
          : Number(formData.saleAmount),
      )}`,
      {
        x: 60,
        y: 475,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );

    page.drawText(
      `Condition: ${
        formData.vehicleCondition === "running" ? "RUNNING" : "NOT RUNNING"
      }`,
      {
        x: 60,
        y: 596,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );

    page.drawRectangle({
      x: 0,
      y: 390,
      width: 595,
      height: 60,
      color: rgb(0.047, 0.098, 0.196),
    });
    page.drawImage(logoImage, {
      x: 40,
      y: 375,
      width: 120,
      height: 90,
    });
    page.drawRectangle({
      x: 0,
      y: 365,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText("GUARRANTEE & WARRANTY CERTIFICATE", {
      x: 130,
      y: 375,
      size: 17,
      color: rgb(0, 0, 0),
      fontWeight: "bold",
      font: boldFont,
    });
    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 415,
      size: 18,
      color: rgb(1, 1, 1),
      font: font,
    });

    page.drawText("TERMS & CONDITIONS", {
      x: 50,
      y: 335,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    const terms = [
      "1. No refunds after invoice billing, except for transfer issues reported within 15 days.",
      "2. A 3-month guarantee is provided on the entire engine.",
      "3. Engine warranty extends from 6 months to 1 year for performance defects.",
      "4. Clutch plate is not covered under any guarantee or warranty.",
      "5. Monthly servicing during the 3-month guarantee is mandatory.",
      "6. First 3 services are free, with minimal charges for oil and parts (excluding engine).",
      "7. Defects must be reported within 24 hours of purchase to avoid repair charges.",
      "8. Delay in transfer beyond 15 days incurs Rs. 17/day penalty.",
      "9. Customer signature confirms acceptance of all terms.",
      `10. OK MOTORS has recieved the money amount ${formatRupee(
        formData.saleAmount,
      )} from ${formData.buyerName}.`,
      "11. It is compulsory to get the vehicle serviced after driving 1500-1800 km otherwise guarrantee will be expired ",
    ];

    terms.forEach((term, index) => {
      page.drawText(term, {
        x: 60,
        y: 315 - index * 15,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: font,
      });
    });

    page.drawText("Buyer Signature", {
      x: 120,
      y: 70,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 85 },
      end: { x: 250, y: 85 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Authorized Signatory", {
      x: 360,
      y: 70,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 85 },
      end: { x: 500, y: 85 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawLine({
      start: { x: 50, y: 55 },
      end: { x: 545, y: 55 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your business!", {
      x: 220,
      y: 35,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      {
        x: 160,
        y: 20,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      },
    );
  };
  const handleInput = (e) => {
    const { value } = e.target;
    e.target.value = value.toUpperCase();
    handleChange(e);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const fetchVehicleDetails = useCallback(async (registrationNumber) => {
    try {
      const response = await axios.get(
        `https://ok-motor-51l3.vercel.app/api/sell-letters/vehicle-details?registrationNumber=${registrationNumber}`,
      );

      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
          registrationNumber,
        }));
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    }
  }, []);

  const fillAndDownloadHindiPdf = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();

      const existingPdfBytes = await loadPDFTemplate("sellletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formatTime = (timeString) => {
        if (!timeString) return "";

        const [hour, minute] = timeString.split(":").map(Number);

        const hours12 = hour % 12 || 12;
        const ampm = hour >= 12 ? "PM" : "AM";

        const formattedHours = String(hours12).padStart(2, "0");
        const formattedMinutes = String(minute).padStart(2, "0");

        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      };
      // We'll append document pages here, then add invoice as the last page.

      const formattedLetter = {
        ...formData,
        buyerName1: formData.buyerName,
        buyerName2: formData.buyerName,
        saleAmount: formatRupee(formData.saleAmount),
        amountInWords: formatIndianAmountInWords(
          !formData.saleAmount || isNaN(Number(formData.saleAmount))
            ? 0
            : Number(formData.saleAmount),
        ),
        vehiclekm: formatKm(formData.vehiclekm),
        saleDate: formatDate(formData.saleDate),
        saleTime: formatTime(formData.saleTime),
        todayDate: formatDate(formData.todayDate || new Date()),
        todayTime: formatTime(formData.todayTime || "12:00"),
        previousDate: formatDate(
          formData.previousDate || formData.todayDate || new Date(),
        ),
        previousTime: formatTime(
          formData.previousTime || formData.todayTime || "12:00",
        ),
      };

      for (const [fieldName, position] of Object.entries(hindiFieldPositions)) {
        if (fieldName === "buyerPhone" && formattedLetter.buyerPhone) {
          const combinedPhones = `${formattedLetter.buyerPhone}${
            formattedLetter.buyerPhone2
              ? ` , ${formattedLetter.buyerPhone2}`
              : ""
          }`;
          pdfDoc.getPages()[0].drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        } else if (
          fieldName === "amountInWords" &&
          formattedLetter.amountInWords
        ) {
          const saleAmountText = formattedLetter.saleAmount || "";
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const saleAmountWidth = font.widthOfTextAtSize(
            saleAmountText,
            position.size,
          );
          const dynamicX =
            hindiFieldPositions.saleAmount.x + saleAmountWidth + 10;
          pdfDoc.getPages()[0].drawText(String(formattedLetter.amountInWords), {
            x: dynamicX,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            weight: "bold",
            color: rgb(0, 0, 0),
          });
        }
      }
      // Insert document pages (fetched from savedSellLetter.documents or server response)

      // eslint-disable-next-line no-unused-vars
      const embedImageFromUrl = async (url) => {
        try {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type") || "";
          const bytes = await res.arrayBuffer();
          if (contentType.includes("png")) return await pdfDoc.embedPng(bytes);
          return await pdfDoc.embedJpg(bytes);
        } catch (err) {
          console.warn("Failed to embed image from", url, err);
          return null;
        }
      };

      // eslint-disable-next-line no-unused-vars
      const addDocumentPages = async (documentsObj) => {
        if (!documentsObj) return;
        const items = [];
        if (documentsObj.vehicleRC) {
          if (documentsObj.vehicleRC.front)
            items.push({
              title: "Vehicle RC - Front",
              url: documentsObj.vehicleRC.front,
            });
          if (documentsObj.vehicleRC.back)
            items.push({
              title: "Vehicle RC - Back",
              url: documentsObj.vehicleRC.back,
            });
        }
        if (documentsObj.aadhaar) {
          if (documentsObj.aadhaar.front)
            items.push({
              title: "Aadhaar - Front",
              url: documentsObj.aadhaar.front,
            });
          if (documentsObj.aadhaar.back)
            items.push({
              title: "Aadhaar - Back",
              url: documentsObj.aadhaar.back,
            });
        }
        if (documentsObj.pan)
          items.push({ title: "PAN Card", url: documentsObj.pan });
        if (documentsObj.vehicleKM)
          items.push({ title: "Vehicle KM", url: documentsObj.vehicleKM });
        if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
          documentsObj.vehiclePhotos.forEach((u, i) =>
            items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
          );
        }
        // Pack up to 4 images per page in a responsive 2x2 grid to avoid wasted space
        for (let i = 0; i < items.length; i += 4) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);

            // same header as invoice
            page.drawRectangle({
              x: 0,
              y: 780,
              width: 595,
              height: 80,
              color: rgb(0.047, 0.098, 0.196),
            });

            page.drawImage(logoImg, { x: 50, y: 743, width: 150, height: 120 });

            // watermark images
            try {
              page.drawImage(logoImg, {
                x: 180,
                y: 430,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
              page.drawImage(logoImg, {
                x: 180,
                y: 130,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
            } catch (wmErr) {
              // ignore watermark errors
            }

            page.drawText("UDAYAM-BR-26-0028550", {
              x: 330,
              y: 805,
              size: 18,
              color: rgb(255, 255, 255, 1),
              font,
            });
            page.drawRectangle({
              x: 0,
              y: 750,
              width: 595,
              height: 30,
              color: rgb(0.9, 0.9, 0.9),
            });
          } catch (err) {
            // ignore header errors
          }

          // positions for 2x2 grid
          const cols = [40, 315];
          const rows = [720, 360];
          for (let cell = 0; cell < 4; cell++) {
            const item = items[i + cell];
            if (!item) continue;
            const col = cell % 2;
            const row = Math.floor(cell / 2);
            const x = cols[col];
            const yTop = rows[row];

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x,
              y: yTop,
              size: 11,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(item.url);
            if (embedded) {
              // compute fit for cell
              const cellMaxW = 240;
              const cellMaxH = 300;
              const { width, height } = embedded.scale(1);
              let drawW = cellMaxW;
              let drawH = (height / width) * drawW;
              if (drawH > cellMaxH) {
                drawH = cellMaxH;
                drawW = (width / height) * drawH;
              }
              const drawY = yTop - drawH - 10;
              page.drawImage(embedded, {
                x,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }
      };

      // add invoice page as final page
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const pdfBytes = await pdfDoc.save();
      const filename = `vehicle_sale_agreement_hindi_${
        formData.registrationNumber || "document"
      }.pdf`;
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      try {
        const saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          pdfBytes,
          "sell",
        );
        if (saveRes && saveRes.success && window.electronAPI) {
          alert(`PDF saved to ${saveRes.path || "default PDF folder"}`);
        } else {
          saveAs(blob, filename);
        }
      } catch (err) {
        console.warn("Silent save failed for sell letter (hi):", err);
        saveAs(blob, filename);
      }
    } catch (error) {
      console.error("Error generating Hindi PDF:", error);
      alert("Failed to generate Hindi PDF. Please try again.");
    }
  };

  const fillAndDownloadEnglishPdf = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();

      const existingPdfBytes = await loadPDFTemplate("englishsell.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      function formatTime(timeString) {
        if (!timeString) return "";
        return timeString.slice(0, 5);
      }
      // We'll append document pages here, then add invoice as the last page.

      const formattedLetter = {
        ...formData,
        buyerName1: formData.buyerName,
        buyerName2: formData.buyerName,
        saleAmount: formData.saleAmount,
        amountInWords: formatIndianAmountInWords(
          !formData.saleAmount || isNaN(Number(formData.saleAmount))
            ? 0
            : Number(formData.saleAmount),
        ),
        vehiclekm: formatKm(formData.vehiclekm),
        saleDate: formatDate(formData.saleDate),
        saleTime: formatTime(formData.saleTime),
        todayDate: formatDate(formData.todayDate || new Date()),
        todayTime: formatTime(formData.todayTime || "12:00"),
        previousDate: formatDate(
          formData.previousDate || formData.todayDate || new Date(),
        ),
        previousTime: formatTime(
          formData.previousTime || formData.todayTime || "12:00",
        ),
      };

      for (const [fieldName, position] of Object.entries(
        englishFieldPositions,
      )) {
        if (fieldName === "buyerPhone" && formattedLetter.buyerPhone) {
          const combinedPhones = `${formattedLetter.buyerPhone}${
            formattedLetter.buyerPhone2
              ? ` , ${formattedLetter.buyerPhone2}`
              : ""
          }`;
          pdfDoc.getPages()[0].drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        } else if (
          fieldName === "amountInWords" &&
          formattedLetter.amountInWords
        ) {
          const saleAmountText = formattedLetter.saleAmount || "";
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const saleAmountWidth = font.widthOfTextAtSize(
            saleAmountText,
            position.size,
          );
          const dynamicX =
            englishFieldPositions.saleAmount.x + saleAmountWidth + 10;
          pdfDoc.getPages()[0].drawText(String(formattedLetter.amountInWords), {
            x: dynamicX,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        } else if (fieldName !== "buyerPhone2" && formattedLetter[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedLetter[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      // eslint-disable-next-line no-unused-vars
      const embedImageFromUrl = async (url) => {
        try {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type") || "";
          const bytes = await res.arrayBuffer();
          if (contentType.includes("png")) return await pdfDoc.embedPng(bytes);
          return await pdfDoc.embedJpg(bytes);
        } catch (err) {
          console.warn("Failed to embed image from", url, err);
          return null;
        }
      };

      // eslint-disable-next-line no-unused-vars
      const addDocumentPages = async (documentsObj) => {
        if (!documentsObj) return;
        const items = [];
        if (documentsObj.vehicleRC) {
          if (documentsObj.vehicleRC.front)
            items.push({
              title: "Vehicle RC - Front",
              url: documentsObj.vehicleRC.front,
            });
          if (documentsObj.vehicleRC.back)
            items.push({
              title: "Vehicle RC - Back",
              url: documentsObj.vehicleRC.back,
            });
        }
        if (documentsObj.aadhaar) {
          if (documentsObj.aadhaar.front)
            items.push({
              title: "Aadhaar - Front",
              url: documentsObj.aadhaar.front,
            });
          if (documentsObj.aadhaar.back)
            items.push({
              title: "Aadhaar - Back",
              url: documentsObj.aadhaar.back,
            });
        }
        if (documentsObj.pan)
          items.push({ title: "PAN Card", url: documentsObj.pan });
        if (documentsObj.vehicleKM)
          items.push({ title: "Vehicle KM", url: documentsObj.vehicleKM });
        if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
          documentsObj.vehiclePhotos.forEach((u, i) =>
            items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
          );
        }

        // Pack up to 4 images per page in a responsive 2x2 grid to avoid wasted space
        for (let i = 0; i < items.length; i += 4) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);

            // invoice-style header
            page.drawRectangle({
              x: 0,
              y: 780,
              width: 595,
              height: 80,
              color: rgb(0.047, 0.098, 0.196),
            });
            page.drawImage(logoImg, { x: 50, y: 743, width: 150, height: 120 });
            try {
              page.drawImage(logoImg, {
                x: 180,
                y: 430,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
              page.drawImage(logoImg, {
                x: 180,
                y: 130,
                width: 260,
                height: 220,
                opacity: 0.3,
              });
            } catch (wmErr) {}
            page.drawText("UDAYAM-BR-26-0028550", {
              x: 330,
              y: 805,
              size: 18,
              color: rgb(255, 255, 255, 1),
              font,
            });
            page.drawRectangle({
              x: 0,
              y: 750,
              width: 595,
              height: 30,
              color: rgb(0.9, 0.9, 0.9),
            });
          } catch (err) {}
          const cols = [40, 315];
          const rows = [720, 360];
          for (let cell = 0; cell < 4; cell++) {
            const item = items[i + cell];
            if (!item) continue;
            const col = cell % 2;
            const row = Math.floor(cell / 2);
            const x = cols[col];
            const yTop = rows[row];

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(item.title, {
              x,
              y: yTop,
              size: 11,
              font: titleFont,
            });

            const embedded = await embedImageFromUrl(item.url);
            if (embedded) {
              // compute fit for cell
              const cellMaxW = 240;
              const cellMaxH = 300;
              const { width, height } = embedded.scale(1);
              let drawW = cellMaxW;
              let drawH = (height / width) * drawW;
              if (drawH > cellMaxH) {
                drawH = cellMaxH;
                drawW = (width / height) * drawH;
              }
              const drawY = yTop - drawH - 10;
              page.drawImage(embedded, {
                x,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            }
          }
        }
      };

      // add invoice page as final page
      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const pdfBytes = await pdfDoc.save();
      const filenameEn = `vehicle_sale_agreement_english_${
        formData.registrationNumber || "document"
      }.pdf`;
      const blobEn = new Blob([pdfBytes], { type: "application/pdf" });
      try {
        const saveRes = await fileSaveService.savePdfToDefaultDir(
          filenameEn,
          pdfBytes,
          "sell",
        );
        if (saveRes && saveRes.success && window.electronAPI) {
          alert(`PDF saved to ${saveRes.path || "default PDF folder"}`);
        } else {
          saveAs(blobEn, filenameEn);
        }
      } catch (err) {
        console.warn("Silent save failed for sell letter (en):", err);
        saveAs(blobEn, filenameEn);
      }
    } catch (error) {
      console.error("Error generating English PDF:", error);
      alert("Failed to generate English PDF. Please try again.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
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

      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {}
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

      {}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h1 style={styles.pageTitle}>Create Sell Letter</h1>
                <p style={styles.pageSubtitle}>
                  Fill in the details to generate a vehicle purchase agreement
                </p>
              </div>
            </div>
          </div>

          <form className="form" style={styles.form}>
            {Object.keys(errors || {}).length > 0 && (
              <div
                style={{
                  backgroundColor: "#fff1f0",
                  border: "1px solid #fecaca",
                  color: "#7f1d1d",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}
              >
                <strong>Please fix the following errors:</strong>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {Object.entries(errors).map(([k, v]) => (
                    <li key={k}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} /> Select Vehicle from Inventory
                (Optional)
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Choose Vehicle (or enter manually below)
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={handleVehicleSelect}
                    style={styles.formSelect}
                    disabled={loadingVehicles}
                  >
                    <option value="">
                      {loadingVehicles
                        ? "Loading vehicles..."
                        : "-- Select Vehicle or Enter Manually --"}
                    </option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.vehicleName} {vehicle.vehicleModel} -{" "}
                        {vehicle.registrationNumber}
                        {vehicle.vehicleVariant
                          ? ` (${vehicle.vehicleVariant})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedVehicleId && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "8px",
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle size={20} style={{ color: "#088395" }} />
                  <span style={{ fontSize: "0.875rem", color: "#1e293b" }}>
                    Vehicle details auto-filled. You can modify them below if
                    needed.
                  </span>
                </div>
              )}
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} /> Vehicle Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Brand || वाहन का ब्रांड
                  </label>
                  <input
                    name="vehicleName"
                    value={formData.vehicleName}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("vehicleName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehicleName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={16}
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
                    onFocus={() => setFocusedInput("vehicleModel")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehicleModel"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={19}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Color || वाहन का रंग
                  </label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("vehicleColor")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehicleColor"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={7}
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
                    maxLength={11}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Chassis Number || चासिस नंबर
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("chassisNumber")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "chassisNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={18}
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
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("engineNumber")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "engineNumber"
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
                    Vehicle KM || वाहन किलोमीटर
                  </label>
                  <input
                    type="text"
                    name="vehiclekm"
                    value={formData.vehiclekm}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        vehiclekm: rawValue,
                      }));
                    }}
                    onFocus={() => setFocusedInput("vehiclekm")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehiclekm"
                        ? styles.inputFocused
                        : {}),
                    }}
                    placeholder="e.g. 36,000.00"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Condition || वाहन की स्थिति
                  </label>
                  <select
                    name="vehicleCondition"
                    value={formData.vehicleCondition}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="running">Running</option>
                    <option value="notRunning">Not Running</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    PUC Issue Date || PUC जारी तिथि
                  </label>
                  <input
                    type="date"
                    name="pucIssueDate"
                    value={formData.pucIssueDate || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    PUC Expiry Date || PUC समाप्ति तिथि
                  </label>
                  <input
                    type="date"
                    name="pucExpiryDate"
                    value={formData.pucExpiryDate || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    PUC Status || PUC स्थिति
                  </label>
                  <select
                    name="pucStatus"
                    value={formData.pucStatus || ""}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="">Select</option>
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Insurance Status || बीमा स्थिति
                  </label>
                  <select
                    name="insuranceStatus"
                    value={formData.insuranceStatus || ""}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="">Select</option>
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Insurance Expiry Date || बीमा समाप्ति तिथि
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <FileText style={styles.formIcon} />
                    Insurance Company || बीमा कंपनी
                  </label>
                  <input
                    type="text"
                    name="insuranceCompany"
                    value={formData.insuranceCompany || ""}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <FileText style={styles.formIcon} />
                    Insurance Policy Number || पॉलिसी नंबर
                  </label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber || ""}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} /> Buyer Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Name || खरीददार का नाम
                  </label>
                  <input
                    type="text"
                    name="buyerName"
                    value={formData.buyerName}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("buyerName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 25 : 29}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Father's Name || खरीददार के पिता का नाम
                  </label>
                  <input
                    type="text"
                    name="buyerFatherName"
                    value={formData.buyerFatherName}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("buyerFatherName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerFatherName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 30 : 15}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Address || खरीददार का पता
                  </label>
                  <input
                    type="text"
                    name="buyerAddress"
                    value={formData.buyerAddress}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("buyerAddress")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerAddress"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 60 : 40}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Phone || खरीददार का फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="buyerPhone"
                    value={formData.buyerPhone}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        buyerPhone: rawValue,
                      }));
                    }}
                    onFocus={() => setFocusedInput("buyerPhone")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerPhone"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Alternate Phone || खरीददार का वैकल्पिक फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="buyerPhone2"
                    value={formData.buyerPhone2}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        buyerPhone2: rawValue,
                      }));
                    }}
                    onFocus={() => setFocusedInput("buyerPhone2")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerPhone2"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Email || खरीददार का ईमेल
                  </label>
                  <input
                    type="email"
                    name="buyerEmail"
                    value={formData.buyerEmail}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("buyerEmail")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerEmail"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={60}
                    placeholder="buyer@example.com"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Aadhar || खरीददार का आधार नंबर
                  </label>
                  <input
                    type="text"
                    name="buyerAadhar"
                    value={formData.buyerAadhar}
                    onChange={(e) => {
                      let value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                      let formatted = value.match(/.{1,4}/g)?.join("-") || "";
                      setFormData((prev) => ({
                        ...prev,
                        buyerAadhar: formatted,
                      }));
                    }}
                    onFocus={() => setFocusedInput("buyerAadhar")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerAadhar"
                        ? styles.inputFocused
                        : {}),
                    }}
                    placeholder="1234-5678-9012"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Witness Name || गवाह का नाम
                  </label>
                  <input
                    type="text"
                    name="witnessName"
                    value={formData.witnessName}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("witnessName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "witnessName"
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
                    Witness Phone || गवाह का फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="witnessPhone"
                    value={formData.witnessPhone}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                      setFormData((prev) => ({
                        ...prev,
                        witnessPhone: rawValue,
                      }));
                      setFocusedInput("witnessPhone");
                    }}
                    onFocus={() => setFocusedInput("witnessPhone")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "witnessPhone"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <IndianRupee style={styles.sectionIcon} /> Sale Details
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Sale Date || बिक्री की तिथि
                  </label>
                  <input
                    type="date"
                    name="saleDate"
                    value={formData.saleDate}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Clock style={styles.formIcon} />
                    Sale Time || बिक्री का समय
                  </label>
                  <input
                    type="time"
                    name="saleTime"
                    value={formData.saleTime}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Sale Amount (₹) || बिक्री की राशि (₹)
                  </label>
                  <input
                    type="text"
                    name="saleAmount"
                    value={formData.saleAmount}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        saleAmount: rawValue,
                      }));
                    }}
                    onFocus={() => setFocusedInput("saleAmount")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "saleAmount"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    <option value="upi">Upi</option>
                    <option value="bankTransfer">Bank Transfer</option>
                    <option value="soldloan">Sold on Loan</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Today's Date || आज की तिथि
                  </label>
                  <input
                    type="date"
                    name="todayDate"
                    value={formData.todayDate}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Clock style={styles.formIcon} />
                    Today's Time || आज का समय
                  </label>
                  <input
                    type="time"
                    name="todayTime"
                    value={formData.todayTime}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {/* Legal Terms Section - Updated */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <FileSignature style={styles.sectionIcon} /> Legal Terms
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formCheckboxField}>
                  <input
                    type="checkbox"
                    name="documentsVerified"
                    checked={formData.documentsVerified}
                    onChange={handleChange}
                    style={styles.formCheckbox}
                  />
                  <label style={styles.formCheckboxLabel}>
                    <CheckCircle style={styles.formIcon} />
                    All documents verified and satisfactory || सभी दस्तावेज
                    सत्यापित और संतोषजनक
                  </label>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Note
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("note")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "note" ? styles.inputFocused : {}),
                    }}
                    maxLength={85}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Documents Upload Section */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <img style={styles.sectionIcon} alt="" /> Documents Upload
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Vehicle RC - Front</label>
                  <button
                    type="button"
                    onClick={() => handleFileInput("vehicleRCFront")}
                    style={styles.uploadBtn}
                  >
                    <Image size={20} /> Choose File
                  </button>
                  {filePreviews.vehicleRCFront && (
                    <img
                      src={filePreviews.vehicleRCFront}
                      alt="rc-front"
                      style={styles.previewImg}
                    />
                  )}
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Vehicle RC - Back</label>
                  <button
                    type="button"
                    onClick={() => handleFileInput("vehicleRCBack")}
                    style={styles.uploadBtn}
                  >
                    <Image size={20} /> Choose File
                  </button>
                  {filePreviews.vehicleRCBack && (
                    <img
                      src={filePreviews.vehicleRCBack}
                      alt="rc-back"
                      style={styles.previewImg}
                    />
                  )}
                </div>

                {/* Aadhaar Upload Mode Toggle */}
                <div style={{ ...styles.formField, width: "100%" }}>
                  <label style={{ ...styles.formLabel, marginBottom: "12px" }}>
                    Aadhaar Upload Mode
                  </label>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="aadhaarUploadMode"
                        value="single"
                        checked={aadhaarUploadMode === "single"}
                        onChange={(e) => {
                          setAadhaarUploadMode(e.target.value);
                          // Clear aadhaar files when switching modes
                          setFilesState(prev => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                          setFilePreviews(prev => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px" }}>Single File (Front + Back in one PDF/Image)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="aadhaarUploadMode"
                        value="separate"
                        checked={aadhaarUploadMode === "separate"}
                        onChange={(e) => {
                          setAadhaarUploadMode(e.target.value);
                          // Clear aadhaar files when switching modes
                          setFilesState(prev => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                          setFilePreviews(prev => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px" }}>Two Separate Images (Front & Back)</span>
                    </label>
                  </div>
                </div>

                {/* Render upload fields based on mode */}
                {aadhaarUploadMode === "single" ? (
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Aadhaar (Front and Back)</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleFileInput("aadhaarFront", true)}
                        style={styles.uploadBtn}
                      >
                        <Image size={20} /> {filePreviews.aadhaarFront ? "Change" : "Choose File"}
                      </button>
                      {filePreviews.aadhaarFront && (
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveFile("aadhaarFront");
                            setFilesState(prev => ({ ...prev, aadhaarBack: null }));
                            setFilePreviews(prev => ({ ...prev, aadhaarBack: null }));
                          }}
                          style={{ ...styles.uploadBtn, backgroundColor: "#ef4444" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {filePreviews.aadhaarFront && (
                      <img
                        src={filePreviews.aadhaarFront}
                        alt="aadhaar"
                        style={styles.previewImg}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Aadhaar (Front)</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleFileInput("aadhaarFront", true)}
                          style={styles.uploadBtn}
                        >
                          <Image size={20} /> {filePreviews.aadhaarFront ? "Change" : "Choose File"}
                        </button>
                        {filePreviews.aadhaarFront && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("aadhaarFront")}
                            style={{ ...styles.uploadBtn, backgroundColor: "#ef4444" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {filePreviews.aadhaarFront && (
                        <img
                          src={filePreviews.aadhaarFront}
                          alt="aadhaar-front"
                          style={styles.previewImg}
                        />
                      )}
                    </div>

                    <div style={styles.formField}>
                      <label style={styles.formLabel}>Aadhaar (Back)</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleFileInput("aadhaarBack", true)}
                          style={styles.uploadBtn}
                        >
                          <Image size={20} /> {filePreviews.aadhaarBack ? "Change" : "Choose File"}
                        </button>
                        {filePreviews.aadhaarBack && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("aadhaarBack")}
                            style={{ ...styles.uploadBtn, backgroundColor: "#ef4444" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {filePreviews.aadhaarBack && (
                        <img
                          src={filePreviews.aadhaarBack}
                          alt="aadhaar-back"
                          style={styles.previewImg}
                        />
                      )}
                    </div>
                  </>
                )}

                <div style={styles.formField}>
                  <label style={styles.formLabel}>PAN Card Photo</label>
                  <button
                    type="button"
                    onClick={() => handleFileInput("panPhoto")}
                    style={styles.uploadBtn}
                  >
                    <Image size={20} /> Choose File
                  </button>
                  {filePreviews.panPhoto && (
                    <img
                      src={filePreviews.panPhoto}
                      alt="pan"
                      style={styles.previewImg}
                    />
                  )}
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    Vehicle KM (Odometer) Photo
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFileInput("vehicleKMPhoto")}
                    style={styles.uploadBtn}
                  >
                    <Image size={20} /> Choose File
                  </button>
                  {filePreviews.vehicleKMPhoto && (
                    <img
                      src={filePreviews.vehicleKMPhoto}
                      alt="km"
                      style={styles.previewImg}
                    />
                  )}
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    Vehicle Photos (up to 4)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleMultipleFileInput("vehiclePhotos")}
                    style={styles.uploadBtn}
                  >
                    <Image size={20} /> Choose Files
                  </button>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {(filePreviews.vehiclePhotos || []).map((p, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img
                          src={p}
                          alt={`vehicle-${idx}`}
                          style={styles.previewImgSmall}
                        />
                        <button
                          type="button"
                          onClick={() => removeVehiclePhoto(idx)}
                          style={styles.removePreviewBtn}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <select
                  value={previewLanguage}
                  onChange={(e) => {
                    setPreviewLanguage(e.target.value);
                    setSelectedLanguage(e.target.value);
                  }}
                  style={styles.formSelect}
                >
                  <option value="hindi">Hindi Preview</option>
                  <option value="english">English Preview</option>
                </select>
                <button
                  type="button"
                  onClick={() => handlePreview(previewLanguage)}
                  style={styles.previewButton}
                  disabled={isSaving}
                >
                  <FileText style={styles.buttonIcon} /> Preview
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  style={{
                    ...styles.previewButton,
                    backgroundColor: "#dc3545",
                    color: "white",
                  }}
                  disabled={isSaving}
                >
                  <AlertCircle style={styles.buttonIcon} /> Clear Form
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                style={styles.downloadButton}
                disabled={isSaving}
              >
                <Download style={styles.buttonIcon} />
                Save & Download
              </button>
            </div>
          </form>
        </div>
        {isDownloading && (
          <DownloadProgressModal
            progress={downloadProgress}
            onClose={() => setIsDownloading(false)}
          />
        )}
        {showPreviewModal && (
          <div style={styles.modalOverlay}>
            <div
              style={{
                ...styles.modalContent,
                width: isMobile ? "95vw" : "800px",
                maxWidth: isMobile ? "95vw" : "90%",
                height: isMobile ? "80vh" : undefined,
                overflow: "hidden",
              }}
            >
              <h3 style={styles.modalTitle}>
                Document Preview -{" "}
                {previewLanguage === "hindi" ? "Hindi" : "English"}
              </h3>
              <div
                style={{
                  height: isMobile ? "65vh" : "70vh",
                  width: "100%",
                  marginBottom: "20px",
                }}
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
                onClick={() => {
                  try {
                    if (previewPdf) URL.revokeObjectURL(previewPdf);
                  } catch (e) {}
                  setPreviewPdf(null);
                  setShowPreviewModal(false);
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
        {showCropper && cropImageSrc && (
          <ImageCropper
            imageSrc={cropImageSrc}
            onCancel={onCropCancel}
            onCropComplete={onCropComplete}
          />
        )}
        {showFileUploadModal && (
          <FileUploadModal
            onSelect={handleFileUploadSelect}
            onCancel={closeFileUploadModal}
            allowPdf={uploadModalAllowPdf}
          />
        )}
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
    ":hover": {
      backgroundColor: "#1e293b",
    },
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
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
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
  },
  englishButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#088395",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    ":hover": {
      backgroundColor: "#2DA2AD",
    },
  },
  hindiButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#37B7C3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    ":hover": {
      backgroundColor: "#2DA2AD",
    },
  },
  modalCloseButton: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#EBF4F6",
    color: "#64748b",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#e2e8f0",
    },
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
    width: "90%",
  },
  previewImg: {
    width: "100%",
    maxWidth: "320px",
    marginTop: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#f0f9ff",
    color: "#0284c7",
    border: "2px dashed #0284c7",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    width: "100%",
    justifyContent: "center",
  },
  previewImgSmall: {
    width: "80px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  removePreviewBtn: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    cursor: "pointer",
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
  formIcon: {
    width: "18px",
    height: "18px",
    color: "#64748b",
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
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },

  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#059669",
    },
    ":disabled": {
      backgroundColor: "#6ee7b7",
      cursor: "not-allowed",
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
    backgroundImage: "none",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "1em",
    ":focus": {
      outline: "none",
      borderColor: "#088395",
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
    ":focus": {
      outline: "none",
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },
  formCheckboxField: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  formCheckbox: {
    width: "16px",
    height: "16px",
    accentColor: "#088395",
  },
  formCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#1e293b",
    cursor: "pointer",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "32px",
  },
  previewButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#f1f5f9",
      borderColor: "#94a3b8",
    },
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#088395",
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
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
  inputFocused: {
    backgroundColor: "#fff5f5",
  },

  formPreviewContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "32px",
  },
  formPreviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  previewActions: {
    display: "flex",
    gap: "16px",
  },
  pdfPreview: {
    minHeight: "500px",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
};

export default SellLetterForm;
