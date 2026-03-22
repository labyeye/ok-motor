import { useState, useCallback, useContext, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import axios from "axios";
import apiService from "../services/apiService";
import { loadPDFTemplate } from "../utils/pdfTemplateLoader";
import fileSaveService from "../services/fileSaveService";
import {
  FileText,
  User,
  Car,
  Download,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  Bike,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Image,
  Settings,
  ShipWheel,
  RefreshCw,
  Megaphone,
  Shield,
  ImageIcon
} from "lucide-react";
import logo from "../images/company.png";
import logo1 from "../images/okmotorback.png";
import logoheader from "../images/okmotor.png";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ImageCropper from "./ImageCropper";
import FileUploadModal from "./FileUploadModal";
import {
  isPdfFile,
  isImageFile,
  extractImagesFromPdf,
  convertPdfToImages,
} from "../utils/pdfHandler";

const BuyLetterForm = () => {
  const { user, logout } = useContext(AuthContext);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Create Buy Letter");
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const [, setErrors] = useState({});
  const [previewPdf, setPreviewPdf] = useState(null);
  const [previewLanguage, setPreviewLanguage] = useState("hindi");
  const [selectedLanguage, setSelectedLanguage] = useState("hindi");
  const [, setDownloadProgress] = useState(0);
  const [, setIsDownloading] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0=hidden,1=uploading,2=saving,3=generating,4=done
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const editLetter = location.state?.editLetter;
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [aadhaarUploadMode, setAadhaarUploadMode] = useState("separate");
  const [vehicleRCUploadMode, setVehicleRCUploadMode] = useState("separate");
  const [insuranceCertificateUploadMode, setInsuranceCertificateUploadMode] =
    useState("separate");
  const [vehicleNOCUploadMode, setVehicleNOCUploadMode] = useState("separate");
  const [vehicleBuyReceiptUploadMode, setVehicleBuyReceiptUploadMode] =
    useState("separate");

  const [filesState, setFilesState] = useState({
    vehicleRCFront: null,
    vehicleRCBack: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panPhoto: null,
    deliveryPhoto: null,

    insuranceCertificate: [],
    vehicleNOC: [],
    vehicleBuyReceipt: [],
  });

  const [filePreviews, setFilePreviews] = useState({});

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropFieldName, setCropFieldName] = useState(null);
  const [cropFileName, setCropFileName] = useState(null);

  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadModalFieldName, setUploadModalFieldName] = useState(null);
  const [uploadModalAllowPdf, setUploadModalAllowPdf] = useState(false);
  const [uploadModalAllowMultiple, setUploadModalAllowMultiple] =
    useState(false);

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

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      if (typeof dateString === "string" && dateString.includes("T")) {
        return dateString.split("T")[0];
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch (error) {
      return "";
    }
  };

  const formatTimeForInput = (timeString) => {
    if (!timeString) {
      return new Date().toLocaleTimeString("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    try {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (error) {}
    return new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [formData, setFormData] = useState(
    editLetter
      ? {
          ...editLetter,
          saleDate: formatDateForInput(editLetter.saleDate),
          todayDate: formatDateForInput(editLetter.todayDate),
          saleTime: formatTimeForInput(editLetter.saleTime),
          todayTime: formatTimeForInput(editLetter.todayTime),
          sellerFatherName: editLetter.sellerFatherName || "",
          buyerFatherName: editLetter.buyerFatherName || "",
          vehicleCondition: editLetter.vehicleCondition || "running",
          paymentMethod: editLetter.paymentMethod || "cash",
        }
      : {
          sellerName: "",
          sellerFatherName: "",
          sellerCurrentAddress: "",
          vehicleName: "",
          vehicleModel: "",
          vehicleColor: "",
          registrationNumber: "",
          chassisNumber: "",
          engineNumber: "",
          vehiclekm: "",
          vehicleCondition: "running",
          pucIssueDate: "",
          pucExpiryDate: "",
          pucStatus: "",
          insuranceExpiryDate: "",
          insuranceStatus: "",
          insuranceCompany: "",
          insurancePolicyNumber: "",
          buyerName: "",
          buyerFatherName: "",
          buyerCurrentAddress: "",
          saleDate: new Date().toISOString().split("T")[0],
          saleTime: new Date().toLocaleTimeString("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          saleAmount: "",
          paymentMethod: "cash",
          todayDate: new Date().toISOString().split("T")[0],
          todayTime: new Date().toLocaleTimeString("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          todayDate1: "",
          todayTime1: "",
          sellerName1: "",
          sellerFatherName1: "",
          sellerCurrentAddress1: "",
          buyerName1: "OK MOTORS",
          buyerFatherName1: "",
          dealername: "",
          dealeraddress: "",
          documentsVerified1: true,
          selleraadhar: "",
          sellerpan: "",
          selleraadharphone: "",
          selleraadharphone2: "",
          witnessname: "",
          witnessphone: "",
          returnpersonname: "",
          note: "",
        },
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    fetchVehicles();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadFullEditLetter = async () => {
      try {
        if (!editLetter || !editLetter._id) return;
        const API_BASE =
          process.env.REACT_APP_API_URL || "https://ok-motor-51l3.vercel.app";
        const token = localStorage.getItem("token");
        const resp = await axios.get(
          `${API_BASE}/api/buy-letters/${editLetter._id}`,
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
          saleDate:
            toInputDate(full.saleDate) ||
            new Date().toISOString().split("T")[0],
          todayDate:
            toInputDate(full.todayDate) ||
            new Date().toISOString().split("T")[0],
        };

        setFormData((prev) => ({
          ...prev,
          ...normalized,

          saleTime: full.saleTime || prev.saleTime,
          todayTime: full.todayTime || prev.todayTime,
        }));

        if (full.documents) {
          const previews = {};

          if (full.documents.aadhaarUploadMode) {
            setAadhaarUploadMode(full.documents.aadhaarUploadMode);
          } else {
            const sameUrl =
              full.documents.aadhaar?.front === full.documents.aadhaar?.back;
            setAadhaarUploadMode(
              sameUrl && full.documents.aadhaar?.front ? "single" : "separate",
            );
          }

          if (full.documents.vehicleRCUploadMode) {
            setVehicleRCUploadMode(full.documents.vehicleRCUploadMode);
          } else {
            const sameUrl =
              full.documents.vehicleRC?.front ===
              full.documents.vehicleRC?.back;
            setVehicleRCUploadMode(
              sameUrl && full.documents.vehicleRC?.front
                ? "single"
                : "separate",
            );
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
          if (full.documents.deliveryPhoto || full.documents.vehicleKM)
            previews.deliveryPhoto =
              full.documents.deliveryPhoto || full.documents.vehicleKM || null;

          if (full.documents.insuranceCertificateUploadMode) {
            setInsuranceCertificateUploadMode(
              full.documents.insuranceCertificateUploadMode,
            );
          } else {
            const pages = full.documents.insuranceCertificate?.pages || [];
            setInsuranceCertificateUploadMode(
              pages.length <= 1 ? "single" : "separate",
            );
          }
          // Handle both old format (direct array) and new format (pages array)
          if (full.documents.insuranceCertificate) {
            if (Array.isArray(full.documents.insuranceCertificate.pages)) {
              previews.insuranceCertificate =
                full.documents.insuranceCertificate.pages.slice();
            } else if (Array.isArray(full.documents.insuranceCertificate)) {
              previews.insuranceCertificate =
                full.documents.insuranceCertificate.slice();
            }
          }

          if (full.documents.vehicleNOCUploadMode) {
            setVehicleNOCUploadMode(full.documents.vehicleNOCUploadMode);
          } else {
            const pages = full.documents.vehicleNOC?.pages || [];
            setVehicleNOCUploadMode(pages.length <= 1 ? "single" : "separate");
          }
          // Handle both old format (direct array) and new format (pages array)
          if (full.documents.vehicleNOC) {
            if (Array.isArray(full.documents.vehicleNOC.pages)) {
              previews.vehicleNOC = full.documents.vehicleNOC.pages.slice();
            } else if (Array.isArray(full.documents.vehicleNOC)) {
              previews.vehicleNOC = full.documents.vehicleNOC.slice();
            }
          }

          if (full.documents.vehicleBuyReceiptUploadMode) {
            setVehicleBuyReceiptUploadMode(
              full.documents.vehicleBuyReceiptUploadMode,
            );
          } else {
            const pages = full.documents.vehicleBuyReceipt?.pages || [];
            setVehicleBuyReceiptUploadMode(
              pages.length <= 1 ? "single" : "separate",
            );
          }
          // Handle both old format (direct array) and new format (pages array)
          if (full.documents.vehicleBuyReceipt) {
            if (Array.isArray(full.documents.vehicleBuyReceipt.pages)) {
              previews.vehicleBuyReceipt =
                full.documents.vehicleBuyReceipt.pages.slice();
            } else if (Array.isArray(full.documents.vehicleBuyReceipt)) {
              previews.vehicleBuyReceipt =
                full.documents.vehicleBuyReceipt.slice();
            }
          }

          setFilePreviews((prev) => ({ ...prev, ...previews }));
        }
      } catch (err) {
        console.error("Failed to load full buy letter for edit:", err);
      }
    };

    loadFullEditLetter();
  }, [editLetter]);

  const validateForm = () => {
    const requiredFields = [
      "sellerName",
      "sellerCurrentAddress",
      "vehicleName",
      "vehicleModel",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "vehiclekm",
      "buyerName",
      "buyerCurrentAddress",
      "saleAmount",
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

    try {
      setErrors(errs);
    } catch (err) {}

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

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const token = localStorage.getItem("token");
      const API_BASE = "https://ok-motor-51l3.vercel.app";
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

  const ProcessingModal = ({ step }) => {
    // step: 1=uploading docs, 2=saving data, 3=generating pdf, 4=done
    const steps = [
      { label: "Uploading Documents", icon: "📤" },
      { label: "Saving Data", icon: "💾" },
      { label: "Generating PDF", icon: "📄" },
    ];
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            padding: "36px 32px",
            width: "320px",
            maxWidth: "90vw",
          }}
        >
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "28px",
              textAlign: "center",
            }}
          >
            Processing Buy Letter
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            {steps.map((s, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <div key={idx}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "18px",
                        backgroundColor: done
                          ? "#16a34a"
                          : active
                            ? "#fff"
                            : "#f1f5f9",
                        border: active
                          ? "2.5px solid #088395"
                          : done
                            ? "none"
                            : "2px solid #cbd5e1",
                        boxShadow: active
                          ? "0 0 0 4px rgba(8,131,149,0.15)"
                          : "none",
                        transition: "all 0.4s ease",
                      }}
                    >
                      {done ? (
                        <span
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "18px",
                          }}
                        >
                          ✓
                        </span>
                      ) : active ? (
                        <span
                          style={{
                            display: "inline-block",
                            width: "20px",
                            height: "20px",
                            border: "3px solid #088395",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "buyLetterSpin 0.8s linear infinite",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "16px" }}>
                          {s.icon}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: active ? "700" : "500",
                        color: done
                          ? "#16a34a"
                          : active
                            ? "#088395"
                            : "#94a3b8",
                        transition: "color 0.3s",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        marginLeft: "19px",
                        width: "2px",
                        height: "28px",
                        backgroundColor: done ? "#16a34a" : "#e2e8f0",
                        transition: "background-color 0.4s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {step === 4 && (
            <p
              style={{
                marginTop: "24px",
                textAlign: "center",
                color: "#16a34a",
                fontWeight: "700",
                fontSize: "1rem",
              }}
            >
              ✓ All done! PDF downloaded.
            </p>
          )}
        </div>
        <style>{`@keyframes buyLetterSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
        " Hundred" +
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    let ds = dateString;
    try {
      if (typeof ds === "string" && ds.includes("T")) ds = ds.split("T")[0];
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (err) {
      return "";
    }
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

  // Compress image files on the frontend before upload to stay under Vercel's 4.5MB body limit
  const compressImageFile = (file, maxWidthPx = 1600, quality = 0.75) => {
    return new Promise((resolve) => {
      // PDFs and non-images pass through unchanged
      if (!file.type.startsWith("image/")) return resolve(file);
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() })),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const saveBuyLetter = async () => {
    try {
      setIsSaving(true);
      let response;

      const isElectron = window.electronAPI !== undefined;

      const {
        _id,
        __v,
        createdAt,
        updatedAt,
        id,
        pdfPath,
        ...formDataWithoutId
      } = formData;

      const dataToSave = {
        ...formDataWithoutId,
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

      const hasFiles =
        filesState.vehicleRCFront ||
        filesState.vehicleRCBack ||
        filesState.aadhaarFront ||
        filesState.aadhaarBack ||
        filesState.panPhoto ||
        filesState.deliveryPhoto ||
        (filesState.insuranceCertificate &&
          filesState.insuranceCertificate.length > 0) ||
        (filesState.vehicleNOC && filesState.vehicleNOC.length > 0) ||
        (filesState.vehicleBuyReceipt &&
          filesState.vehicleBuyReceipt.length > 0);

      if (hasFiles) {
        const form = new FormData();

        Object.entries(dataToSave).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (typeof value === "object") {
            form.append(key, JSON.stringify(value));
          } else {
            form.append(key, String(value));
          }
        });

        form.append("aadhaarUploadMode", aadhaarUploadMode);
        form.append("vehicleRCUploadMode", vehicleRCUploadMode);
        form.append(
          "insuranceCertificateUploadMode",
          insuranceCertificateUploadMode,
        );
        form.append("vehicleNOCUploadMode", vehicleNOCUploadMode);
        form.append("vehicleBuyReceiptUploadMode", vehicleBuyReceiptUploadMode);

        // Compress all image files before appending (PDFs pass through unchanged)
        const [rcFront, rcBack, adhFront, adhBack, pan, delivery] = await Promise.all([
          filesState.vehicleRCFront ? compressImageFile(filesState.vehicleRCFront) : Promise.resolve(null),
          filesState.vehicleRCBack ? compressImageFile(filesState.vehicleRCBack) : Promise.resolve(null),
          filesState.aadhaarFront ? compressImageFile(filesState.aadhaarFront) : Promise.resolve(null),
          filesState.aadhaarBack ? compressImageFile(filesState.aadhaarBack) : Promise.resolve(null),
          filesState.panPhoto ? compressImageFile(filesState.panPhoto) : Promise.resolve(null),
          filesState.deliveryPhoto ? compressImageFile(filesState.deliveryPhoto) : Promise.resolve(null),
        ]);
        if (rcFront) form.append("vehicleRCFront", rcFront);
        if (rcBack) form.append("vehicleRCBack", rcBack);
        if (adhFront) form.append("aadhaarFront", adhFront);
        if (adhBack) form.append("aadhaarBack", adhBack);
        if (pan) form.append("panPhoto", pan);
        if (delivery) form.append("deliveryPhoto", delivery);

        if (filesState.insuranceCertificate && filesState.insuranceCertificate.length) {
          const compressed = await Promise.all(filesState.insuranceCertificate.map((f) => compressImageFile(f)));
          for (const f of compressed) form.append("insuranceCertificate", f);
        }
        if (filesState.vehicleNOC && filesState.vehicleNOC.length) {
          const compressed = await Promise.all(filesState.vehicleNOC.map((f) => compressImageFile(f)));
          for (const f of compressed) form.append("vehicleNOC", f);
        }
        if (filesState.vehicleBuyReceipt && filesState.vehicleBuyReceipt.length) {
          const compressed = await Promise.all(filesState.vehicleBuyReceipt.map((f) => compressImageFile(f)));
          for (const f of compressed) form.append("vehicleBuyReceipt", f);
        }

        if (editLetter?._id && editLetter.documents) {
          const preservedDocs = {};

          if (!filesState.vehicleRCFront && filePreviews.vehicleRCFront) {
            preservedDocs.vehicleRCFront = filePreviews.vehicleRCFront;
          }
          if (!filesState.vehicleRCBack && filePreviews.vehicleRCBack) {
            preservedDocs.vehicleRCBack = filePreviews.vehicleRCBack;
          }

          if (!filesState.aadhaarFront && filePreviews.aadhaarFront) {
            preservedDocs.aadhaarFront = filePreviews.aadhaarFront;
          }
          if (!filesState.aadhaarBack && filePreviews.aadhaarBack) {
            preservedDocs.aadhaarBack = filePreviews.aadhaarBack;
          }

          if (!filesState.panPhoto && filePreviews.panPhoto) {
            preservedDocs.panPhoto = filePreviews.panPhoto;
          }
          if (!filesState.deliveryPhoto && filePreviews.deliveryPhoto) {
            preservedDocs.deliveryPhoto = filePreviews.deliveryPhoto;
          }

          if (
            (!filesState.vehiclePhotos ||
              filesState.vehiclePhotos.length === 0) &&
            filePreviews.vehiclePhotos &&
            filePreviews.vehiclePhotos.length > 0
          ) {
            preservedDocs.vehiclePhotos = filePreviews.vehiclePhotos;
          }

          if (
            !filesState.insuranceCertificate ||
            filesState.insuranceCertificate.length === 0
          ) {
            if (
              filePreviews.insuranceCertificate &&
              Array.isArray(filePreviews.insuranceCertificate)
            ) {
              preservedDocs.insuranceCertificate =
                filePreviews.insuranceCertificate;
            }
          }

          if (!filesState.vehicleNOC || filesState.vehicleNOC.length === 0) {
            if (
              filePreviews.vehicleNOC &&
              Array.isArray(filePreviews.vehicleNOC)
            ) {
              preservedDocs.vehicleNOC = filePreviews.vehicleNOC;
            }
          }

          if (
            !filesState.vehicleBuyReceipt ||
            filesState.vehicleBuyReceipt.length === 0
          ) {
            if (
              filePreviews.vehicleBuyReceipt &&
              Array.isArray(filePreviews.vehicleBuyReceipt)
            ) {
              preservedDocs.vehicleBuyReceipt = filePreviews.vehicleBuyReceipt;
            }
          }

          if (Object.keys(preservedDocs).length > 0) {
            form.append("preservedDocuments", JSON.stringify(preservedDocs));
          }
        }

        if (isElectron) {
          response = await apiService.post("/api/buy-letters", form);
        } else {
          response = await axios.post(
            "https://ok-motor-51l3.vercel.app/api/buy-letters",
            form,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 300000, // 5 minutes timeout
              onUploadProgress: (evt) => {
                if (evt.total && evt.loaded >= evt.total) {
                  setProgressStep(2); // upload done → saving
                }
              },
            },
          );
        }
      } else {
        // Even when no new files are selected, if we're editing we must
        // preserve existing documents by sending them as preservedDocuments.
        if (editLetter?._id && editLetter.documents) {
          const form = new FormData();

          Object.entries(dataToSave).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (typeof value === "object") {
              form.append(key, JSON.stringify(value));
            } else {
              form.append(key, String(value));
            }
          });

          form.append("aadhaarUploadMode", aadhaarUploadMode);
          form.append("vehicleRCUploadMode", vehicleRCUploadMode);
          form.append("insuranceCertificateUploadMode", insuranceCertificateUploadMode);
          form.append("vehicleNOCUploadMode", vehicleNOCUploadMode);
          form.append("vehicleBuyReceiptUploadMode", vehicleBuyReceiptUploadMode);

          // Build preservedDocs from filePreviews (which hold the existing URLs)
          const preservedDocs = {};
          const docMap = [
            "vehicleRCFront", "vehicleRCBack",
            "aadhaarFront", "aadhaarBack",
            "panPhoto", "deliveryPhoto",
          ];
          docMap.forEach((key) => {
            if (filePreviews[key]) preservedDocs[key] = filePreviews[key];
          });
          if (filePreviews.vehiclePhotos?.length) preservedDocs.vehiclePhotos = filePreviews.vehiclePhotos;
          if (filePreviews.insuranceCertificate?.length) preservedDocs.insuranceCertificate = filePreviews.insuranceCertificate;
          if (filePreviews.vehicleNOC?.length) preservedDocs.vehicleNOC = filePreviews.vehicleNOC;
          if (filePreviews.vehicleBuyReceipt?.length) preservedDocs.vehicleBuyReceipt = filePreviews.vehicleBuyReceipt;

          // Also send the full existing documents object as an ultimate fallback
          form.append("preservedDocuments", JSON.stringify(preservedDocs));
          form.append("existingDocuments", JSON.stringify(editLetter.documents));

          if (isElectron) {
            response = await apiService.post("/api/buy-letters", form);
          } else {
            response = await axios.post(
              "https://ok-motor-51l3.vercel.app/api/buy-letters",
              form,
              {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 300000,
              },
            );
          }
        } else {
          // New letter with no files — plain JSON is fine
          const payload = { ...dataToSave };
          if (isElectron) {
            response = await apiService.post("/api/buy-letters", payload);
          } else {
            response = await axios.post(
              "https://ok-motor-51l3.vercel.app/api/buy-letters",
              payload,
              { timeout: 300000 },
            );
          }
        }
      }

      if (editLetter?._id) {
        alert("Buy letter saved as new version! Original remains unchanged.");
      } else {
        alert("Buy letter saved successfully!");
      }

      const normalizedResponse =
        response && response.data ? response.data : response;
      return normalizedResponse;
    } catch (error) {
      console.error("Error saving/updating buy letter:", error);
      let errorMessage = "Failed to save/update buy letter. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      alert(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileInput = (fieldName, allowPdf = false) => {
    setUploadModalFieldName(fieldName);
    setUploadModalAllowPdf(allowPdf);

    setUploadModalAllowMultiple(
      fieldName === "insuranceCertificate" ||
        fieldName === "vehicleNOC" ||
        fieldName === "vehicleBuyReceipt",
    );
    setShowFileUploadModal(true);
  };

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
      if (Array.isArray(file)) {
        const filesArr = file;

        if (
          uploadModalFieldName === "insuranceCertificate" ||
          uploadModalFieldName === "vehicleNOC" ||
          uploadModalFieldName === "vehicleBuyReceipt"
        ) {
          setFilesState((prev) => ({
            ...prev,
            [uploadModalFieldName]: filesArr,
          }));

          const previews = [];
          for (const f of filesArr) {
            if (isImageFile(f)) {
              previews.push(URL.createObjectURL(f));
            } else if (isPdfFile(f)) {
              try {
                const pdfImages = await convertPdfToImages(f);
                if (Array.isArray(pdfImages) && pdfImages.length) {
                  pdfImages.forEach((p) => previews.push(p.data));
                } else {
                  previews.push(URL.createObjectURL(f));
                }
              } catch (err) {
                previews.push(URL.createObjectURL(f));
              }
            } else {
              previews.push(URL.createObjectURL(f));
            }
          }

          setFilePreviews((prev) => ({
            ...prev,
            [uploadModalFieldName]: previews,
          }));
          setShowFileUploadModal(false);
          return;
        }

        file = file[0];
      }

      if (isPdfFile(file)) {
        try {
          const pdfImages = await convertPdfToImages(file);
          if (Array.isArray(pdfImages) && pdfImages[0]?.data) {
          }
        } catch (err) {
          console.warn("PDF to image conversion failed", err);
        }

        try {
          await extractImagesFromPdf(file);
        } catch (e) {}
      }

      if (isImageFile(file)) {
        const url = URL.createObjectURL(file);
        setCropImageSrc(url);
        setCropFieldName(uploadModalFieldName);
        setCropFileName(file.name);
        setShowFileUploadModal(false);
        setShowCropper(true);
        return;
      }

      // Handle PDF files for single-file fields when allowPdf is true
      if (isPdfFile(file) && uploadModalAllowPdf) {
        setFilesState((prev) => ({
          ...prev,
          [uploadModalFieldName]: file,
        }));

        // Create preview for PDF
        try {
          const pdfImages = await convertPdfToImages(file);
          if (Array.isArray(pdfImages) && pdfImages[0]?.data) {
            setFilePreviews((prev) => ({
              ...prev,
              [uploadModalFieldName]: pdfImages[0].data,
            }));
          } else {
            setFilePreviews((prev) => ({
              ...prev,
              [uploadModalFieldName]: URL.createObjectURL(file),
            }));
          }
        } catch (err) {
          console.warn("PDF preview generation failed", err);
          setFilePreviews((prev) => ({
            ...prev,
            [uploadModalFieldName]: URL.createObjectURL(file),
          }));
        }

        setShowFileUploadModal(false);
        return;
      }

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

    if (cropFieldName === "aadhaarFront" && aadhaarUploadMode === "single") {
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
    } else if (
      cropFieldName === "vehicleRCFront" &&
      vehicleRCUploadMode === "single"
    ) {
      setFilesState((prev) => ({
        ...prev,
        vehicleRCFront: file,
        vehicleRCBack: file,
      }));
      const url = URL.createObjectURL(file);
      setFilePreviews((prev) => ({
        ...prev,
        vehicleRCFront: url,
        vehicleRCBack: url,
      }));
    } else if (
      cropFieldName === "insuranceCertificate" ||
      cropFieldName === "vehicleNOC" ||
      cropFieldName === "vehicleBuyReceipt"
    ) {
      // Handle multi-page documents - store as array
      setFilesState((prev) => ({
        ...prev,
        [cropFieldName]: [file],
      }));
      const url = URL.createObjectURL(file);
      setFilePreviews((prev) => ({
        ...prev,
        [cropFieldName]: [url],
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

  const handleSaveAndDownload = async () => {
    try {
      const errs = validateForm();
      if (Object.keys(errs || {}).length > 0) return;

      const hasFiles =
        filesState.vehicleRCFront ||
        filesState.vehicleRCBack ||
        filesState.aadhaarFront ||
        filesState.aadhaarBack ||
        filesState.panPhoto ||
        filesState.deliveryPhoto ||
        (filesState.insuranceCertificate &&
          filesState.insuranceCertificate.length > 0) ||
        (filesState.vehicleNOC && filesState.vehicleNOC.length > 0) ||
        (filesState.vehicleBuyReceipt &&
          filesState.vehicleBuyReceipt.length > 0);

      // Step 1: uploading documents (only if files present, else skip to step 2)
      setProgressStep(hasFiles ? 1 : 2);
      setIsDownloading(true);
      setIsSaving(true);

      const savedLetter = await saveBuyLetter();

      // Step 3: generating PDF
      setProgressStep(3);

      if (selectedLanguage === "hindi") {
        await fillAndDownloadHindiPdf(savedLetter, false);
      } else {
        await fillAndDownloadEnglishPdf(savedLetter, false);
      }

      setProgressStep(4);
      setTimeout(() => {
        setProgressStep(0);
        setIsDownloading(false);
      }, 1500);

      return savedLetter;
    } catch (error) {
      console.error("Error checking/saving buy letter:", error);
      setProgressStep(0);
      let errorMessage = "Failed to process buy letter. Please try again.";
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
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "buyerName") {
        newData.buyerName1 = value;
      }
      if (name === "sellerName") {
        newData.sellerName1 = value;
      }
      if (name === "sellerFatherName") {
        newData.sellerFatherName1 = value;
      }
      if (name === "sellerCurrentAddress") {
        newData.sellerCurrentAddress1 = value;
      }
      if (name === "buyerFatherName") {
        newData.buyerFatherName1 = value;
      }
      if (name === "buyerCurrentAddress") {
        newData.buyerCurrentAddress1 = value;
      }
      if (name === "todayDate") {
        newData.todayDate1 = formatDate(value);
      }
      if (name === "todayTime") {
        newData.todayTime1 = value;
      }

      return newData;
    });
  }, []);

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

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    const actualPath = typeof path === "function" ? path(user?.role) : path;
    navigate(actualPath);
  };
  const fieldPositions = {
    sellerName: { x: 34, y: 632, size: 11 },
    sellerFatherName: { x: 322, y: 632, size: 11 },
    sellerCurrentAddress: { x: 50, y: 610, size: 11 },
    vehicleName: { x: 235, y: 590, size: 11 },
    vehicleModel: { x: 384, y: 590, size: 11 },
    vehicleColor: { x: 531, y: 590, size: 11 },
    registrationNumber: { x: 142, y: 571, size: 11 },
    chassisNumber: { x: 289, y: 571, size: 11 },
    engineNumber: { x: 476, y: 571, size: 11 },
    vehiclekm: { x: 81, y: 552, size: 11 },
    buyerName: { x: 345, y: 552, size: 11 },
    buyerFatherName: { x: 55, y: 533, size: 11 },
    buyerCurrentAddress: { x: 249, y: 533, size: 11 },
    saleDate: { x: 109, y: 514, size: 11 },
    saleTime: { x: 206, y: 514, size: 11 },
    saleAmount: { x: 297, y: 514, size: 11 },
    todayDate: { x: 176, y: 495, size: 11 },
    todayTime: { x: 300, y: 495, size: 11 },
    sellerName1: { x: 26, y: 457, size: 11 },
    sellerFatherName1: { x: 292, y: 457, size: 11 },
    buyerName1: { x: 26, y: 418, size: 11 },
    buyerFatherName1: { x: 334, y: 418, size: 11 },
    todayDate1: { x: 95, y: 438, size: 11 },
    todayTime1: { x: 193, y: 438, size: 11 },
    dealername: { x: 256, y: 380, size: 11 },
    dealeraddress: { x: 27, y: 362, size: 11 },
    selleraadhar: { x: 393, y: 215, size: 10 },
    sellerpan: { x: 391, y: 195, size: 10 },
    selleraadharphone: { x: 395, y: 176, size: 10 },
    selleraadharphone2: { x: 455, y: 176, size: 10 },
    witnessname: { x: 390, y: 87, size: 10 },
    witnessphone: { x: 390, y: 70, size: 10 },
    returnpersonname: { x: 427, y: 323, size: 10 },
    note: { x: 58, y: 18, size: 10 },
  };

  const fillAndDownloadHindiPdf = async (
    providedLetterData = null,
    includeDocuments = false,
  ) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();
      setIsSaving(true);

      const isElectron = window.electronAPI !== undefined;

      let savedLetterData;

      if (providedLetterData) {
        savedLetterData = providedLetterData;
      } else {
        let existingLetter;
        if (isElectron) {
          existingLetter = await apiService.get(
            `/api/buy-letters/by-registration?registrationNumber=${formData.registrationNumber}`,
          );
        } else {
          existingLetter = await apiService.get(
            `/api/buy-letters/by-registration?registrationNumber=${formData.registrationNumber}`,
          );
        }

        const existingList =
          existingLetter && existingLetter.data !== undefined
            ? existingLetter.data
            : existingLetter;

        if (existingList && existingList.length > 0) {
          savedLetterData = existingList[0];
        } else {
          let response = await apiService.post("/api/buy-letters", formData);

          savedLetterData =
            response && response.data ? response.data : response;
        }
      }
      const existingPdfBytes = await loadPDFTemplate("buyletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const firstPage = pdfDoc.getPages()[0];

      const formattedData = {
        ...formData,
        saleDate: formatDate(formData.saleDate),
        todayDate: formatDate(formData.todayDate),
        todayDate1: formatDate(formData.todayDate),
        todayTime: formatTime(formData.todayTime),
        todayTime1: formatTime(formData.todayTime),
        saleTime: formatTime(formData.saleTime),
        saleAmount: formatRupee(formData.saleAmount),
        vehiclekm: formatKm(formData.vehiclekm),
        amountInWords: formatIndianAmountInWords(formData.saleAmount),
      };
      formattedData.witnessname =
        formattedData.witnessname && String(formattedData.witnessname).trim()
          ? formattedData.witnessname
          : "N/A";
      formattedData.witnessphone =
        formattedData.witnessphone && String(formattedData.witnessphone).trim()
          ? formattedData.witnessphone
          : "0000000000";

      for (const [fieldName, position] of Object.entries(fieldPositions)) {
        if (
          fieldName === "selleraadharphone" &&
          formattedData.selleraadharphone
        ) {
          const combinedPhones = `${formattedData.selleraadharphone}${
            formattedData.selleraadharphone2
              ? ` , ${formattedData.selleraadharphone2}`
              : ""
          }`;
          firstPage.drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        } else if (
          fieldName !== "selleraadharphone2" &&
          formattedData[fieldName]
        ) {
          firstPage.drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      const saleAmountText = formattedData.saleAmount || "";
      const saleAmountWidth =
        saleAmountText.length * (fieldPositions.saleAmount.size / 2);
      const amountInWordsX =
        fieldPositions.saleAmount.x +
        saleAmountWidth +
        1.4 * (fieldPositions.saleAmount.size / 2);

      firstPage.drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: fieldPositions.saleAmount.y,
        size: fieldPositions.saleAmount.size,
        color: rgb(0, 0, 0),
      });

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

        const renderSingleImagePerPage = async (
          pagesArray,
          pageTitlePrefix,
        ) => {
          if (!pagesArray || !pagesArray.length) return;
          for (let p = 0; p < pagesArray.length; p++) {
            const url = pagesArray[p];
            const page = pdfDoc.addPage([595, 842]);

            try {
              const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
              const logoUrl = logo1;
              const logoBytes = await fetch(logoUrl).then((r) =>
                r.arrayBuffer(),
              );
              const logoImg = await pdfDoc.embedPng(logoBytes);

              page.drawRectangle({
                x: 0,
                y: 780,
                width: 595,
                height: 80,
                color: rgb(0.047, 0.098, 0.196),
              });
              page.drawImage(logoImg, {
                x: 50,
                y: 743,
                width: 150,
                height: 120,
              });
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
                color: rgb(1, 1, 1),
                font: fontB,
              });
              page.drawText("GSTIN: 22ABCDE1234F1Z5", {
                x: 330,
                y: 785,
                size: 18,
                color: rgb(1, 1, 1),
                font: fontB,
              });

              try {
                const thank = "Thank you for your business!";
                const addr =
                  "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
                const thankW = fontB.widthOfTextAtSize(thank, 12);
                const addrFont = await pdfDoc.embedFont(
                  StandardFonts.Helvetica,
                );
                const addrW = addrFont.widthOfTextAtSize(addr, 9);
                const centerXThank = (595 - thankW) / 2;
                const centerXAddr = (595 - addrW) / 2;
                page.drawLine({
                  start: { x: 20, y: 52 },
                  end: { x: 575, y: 52 },
                  thickness: 0.5,
                  color: rgb(0.8, 0.8, 0.8),
                });
                page.drawText(thank, {
                  x: centerXThank,
                  y: 40,
                  size: 12,
                  color: rgb(0, 0, 0),
                  font: fontB,
                });
                page.drawText(addr, {
                  x: centerXAddr,
                  y: 26,
                  size: 9,
                  color: rgb(0.45, 0.45, 0.45),
                  font: addrFont,
                });
              } catch (e) {}
              page.drawRectangle({
                x: 0,
                y: 750,
                width: 595,
                height: 30,
                color: rgb(0.9, 0.9, 0.9),
              });
            } catch (err) {}

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(`${pageTitlePrefix} - Page ${p + 1}`, {
              x: 50,
              y: 700,
              size: 12,
              font: titleFont,
            });

            try {
              const res = await fetch(url);
              const contentType = (
                res.headers.get("content-type") || ""
              ).toLowerCase();
              const bytes = await res.arrayBuffer();

              if (
                contentType.includes("pdf") ||
                url.toLowerCase().endsWith(".pdf")
              ) {
                const embedded = await pdfDoc.embedPdf(bytes);
                const embeddedPage =
                  Array.isArray(embedded) && embedded.length
                    ? embedded[0]
                    : null;
                if (embeddedPage) {
                  const embeddedWidth =
                    embeddedPage.width || embeddedPage.getWidth?.() || 595;
                  const embeddedHeight =
                    embeddedPage.height || embeddedPage.getHeight?.() || 842;
                  const pageWidth = 595;
                  const margin = 50;
                  const maxWidth = pageWidth - 2 * margin;
                  const maxHeight = 660;
                  let drawW = maxWidth;
                  let drawH = (embeddedHeight / embeddedWidth) * drawW;
                  if (drawH > maxHeight) {
                    drawH = maxHeight;
                    drawW = (embeddedWidth / embeddedHeight) * drawH;
                  }
                  const xPos = (pageWidth - drawW) / 2;
                  const yPos = 690 - drawH;
                  try {
                    page.drawPage(embeddedPage, {
                      x: xPos,
                      y: yPos,
                      width: drawW,
                      height: drawH,
                    });
                  } catch (err) {
                    try {
                      const asImg = await pdfDoc.embedJpg(bytes);
                      page.drawImage(asImg, {
                        x: xPos,
                        y: yPos,
                        width: drawW,
                        height: drawH,
                      });
                    } catch (err2) {
                      console.warn(
                        "Failed to render embedded pdf page",
                        url,
                        err2,
                      );
                    }
                  }
                }
              } else {
                let embedded;
                if (contentType.includes("png"))
                  embedded = await pdfDoc.embedPng(bytes);
                else embedded = await pdfDoc.embedJpg(bytes);
                const { width, height } = embedded.scale(1);
                const pageWidth = 595;
                const margin = 50;
                const maxWidth = pageWidth - 2 * margin;
                const maxHeight = 660;
                let drawW = maxWidth;
                let drawH = (height / width) * drawW;
                if (drawH > maxHeight) {
                  drawH = maxHeight;
                  drawW = (width / height) * drawH;
                }
                const xPos = (pageWidth - drawW) / 2;
                const yPos = 690 - drawH;
                page.drawImage(embedded, {
                  x: xPos,
                  y: yPos,
                  width: drawW,
                  height: drawH,
                });
              }
            } catch (err) {
              console.warn("Failed to render document page", url, err);
            }
          }
        };

        if (
          documentsObj.insuranceCertificate &&
          Array.isArray(documentsObj.insuranceCertificate.pages) &&
          documentsObj.insuranceCertificate.pages.length
        ) {
          await renderSingleImagePerPage(
            documentsObj.insuranceCertificate.pages,
            "Insurance Certificate",
          );
        }
        if (
          documentsObj.vehicleNOC &&
          Array.isArray(documentsObj.vehicleNOC.pages) &&
          documentsObj.vehicleNOC.pages.length
        ) {
          await renderSingleImagePerPage(
            documentsObj.vehicleNOC.pages,
            "Vehicle NOC",
          );
        }
        if (
          documentsObj.vehicleBuyReceipt &&
          Array.isArray(documentsObj.vehicleBuyReceipt.pages) &&
          documentsObj.vehicleBuyReceipt.pages.length
        ) {
          await renderSingleImagePerPage(
            documentsObj.vehicleBuyReceipt.pages,
            "Vehicle Buy Receipt",
          );
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

        if (documentsObj.deliveryPhoto || documentsObj.vehicleKM)
          items.push({
            title: "Delivery Photo",
            url: documentsObj.deliveryPhoto || documentsObj.vehicleKM,
          });
        if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
          documentsObj.vehiclePhotos.forEach((u, i) =>
            items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
          );
        }

        for (let i = 0; i < items.length; i += 4) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);

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
              color: rgb(1, 1, 1),
              font,
            });
            page.drawText("GSTIN: 22ABCDE1234F1Z5", {
              x: 330,
              y: 785,
              size: 18,
              color: rgb(1, 1, 1),
              font,
            });

            try {
              const thank = "Thank you for your business!";
              const addr =
                "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
              const thankW = font.widthOfTextAtSize(thank, 12);
              const addrFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
              const addrW = addrFont.widthOfTextAtSize(addr, 9);
              const centerXThank = (595 - thankW) / 2;
              const centerXAddr = (595 - addrW) / 2;
              page.drawLine({
                start: { x: 20, y: 52 },
                end: { x: 575, y: 52 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8),
              });
              page.drawText(thank, {
                x: centerXThank,
                y: 40,
                size: 12,
                color: rgb(0, 0, 0),
                font,
              });
              page.drawText(addr, {
                x: centerXAddr,
                y: 26,
                size: 9,
                color: rgb(0.45, 0.45, 0.45),
                font: addrFont,
              });
            } catch (e) {}
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

      if (includeDocuments && savedLetterData?.documents) {
        await addDocumentPages(savedLetterData.documents);
      }

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const pdfBytes = await pdfDoc.save();
      const filename = `vehicle_buy_agreement_${
        formData.registrationNumber || "document"
      }.pdf`;
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      try {
        const saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          pdfBytes,
          "buy",
        );
        if (saveRes && saveRes.success) {
          if (window.electronAPI) {
            alert(`PDF saved to ${saveRes.path || "default PDF folder"}`);
          }
        } else {
          saveAs(blob, filename);
        }
      } catch (err) {
        console.warn("Silent save failed for buy letter:", err);
        saveAs(blob, filename);
      }

      return savedLetterData;
    } catch (error) {
      console.error("Error generating Hindi PDF:", error);

      let errorMessage = "Failed to generate Hindi PDF. Please try again.";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }

      alert(errorMessage);
      throw error;
    } finally {
      setIsDownloading(false);
      setIsSaving(false);
    }
  };

  const englishFieldPositions = {
    sellerName: { x: 29, y: 628, size: 11 },
    sellerFatherName: { x: 327, y: 628, size: 11 },
    sellerCurrentAddress: { x: 83, y: 605, size: 11 },
    vehicleName: { x: 282, y: 586, size: 11 },
    vehicleModel: { x: 468, y: 586, size: 11 },
    vehicleColor: { x: 60, y: 567, size: 11 },
    registrationNumber: { x: 244, y: 567, size: 11 },
    chassisNumber: { x: 417, y: 567, size: 11 },
    engineNumber: { x: 92, y: 544, size: 11 },
    vehiclekm: { x: 323, y: 544, size: 11 },
    buyerName: { x: 74, y: 526, size: 11 },
    buyerFatherName: { x: 385, y: 526, size: 11 },
    buyerCurrentAddress: { x: 89, y: 508, size: 11 },
    saleDate: { x: 483, y: 508, size: 11 },
    saleTime: { x: 23, y: 490, size: 11 },
    saleAmount: { x: 190, y: 490, size: 11 },
    todayDate: { x: 132, y: 472, size: 11 },
    todayTime: { x: 273, y: 472, size: 11 },
    sellerName1: { x: 73, y: 440, size: 11 },
    sellerFatherName1: { x: 349, y: 440, size: 11 },
    buyerName1: { x: 26, y: 403, size: 11 },
    buyerFatherName1: { x: 382, y: 403, size: 11 },
    todayDate1: { x: 170, y: 421, size: 11 },
    todayTime1: { x: 305, y: 421, size: 11 },
    dealername: { x: 136, y: 351, size: 11 },
    dealeraddress: { x: 368, y: 351, size: 11 },
    selleraadhar: { x: 403, y: 221, size: 10 },
    sellerpan: { x: 403, y: 207, size: 10 },
    selleraadharphone: { x: 405, y: 192, size: 10 },
    selleraadharphone2: { x: 470, y: 192, size: 10 },
    witnessname: { x: 400, y: 96, size: 10 },
    witnessphone: { x: 400, y: 80, size: 10 },
    note: { x: 58, y: 20, size: 10 },
    returnpersonname: { x: 332, y: 298, size: 10 },
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
  const formatAadhar = (val) =>
    val
      .replace(/\D/g, "")
      .match(/.{1,4}/g)
      ?.join("-") || "";
  const formatRupee = (val) => {
    const num = parseFloat(val.toString().replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : `${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };

  const fillAndDownloadEnglishPdf = async (
    providedLetterData = null,
    includeDocuments = false,
  ) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();
      setIsSaving(true);

      let savedLetterData;

      if (providedLetterData) {
        savedLetterData = providedLetterData;
      } else {
        let existingLetter = await apiService.get(
          `/api/buy-letters/by-registration?registrationNumber=${formData.registrationNumber}`,
        );

        const existingList =
          existingLetter && existingLetter.data !== undefined
            ? existingLetter.data
            : existingLetter;

        if (existingList && existingList.length > 0) {
          savedLetterData = existingList[0];
        } else {
          const resp = await apiService.post("/api/buy-letters", formData);
          savedLetterData = resp && resp.data ? resp.data : resp;
        }
      }

      const existingPdfBytes = await loadPDFTemplate("englishbuyletter.pdf");
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const firstPage = pdfDoc.getPages()[0];

      const formattedData = {
        ...formData,
        saleDate: formatDate(formData.saleDate),
        todayDate: formatDate(formData.todayDate),
        todayDate1: formatDate(formData.todayDate),
        todayTime: formatTime(formData.todayTime),
        todayTime1: formatTime(formData.todayTime),
        saleTime: formatTime(formData.saleTime),
        saleAmount: formatRupee(formData.saleAmount),
        vehiclekm: formatKm(formData.vehiclekm),
        amountInWords: formatIndianAmountInWords(
          formData.saleAmount
            ? formData.saleAmount.toString().replace(/\D/g, "")
            : "0",
        ),
      };

      for (const [fieldName, position] of Object.entries(
        englishFieldPositions,
      )) {
        if (
          fieldName === "selleraadharphone" &&
          formattedData.selleraadharphone
        ) {
          const combinedPhones = `${formattedData.selleraadharphone}${
            formattedData.selleraadharphone2
              ? ` , ${formattedData.selleraadharphone2}`
              : ""
          }`;
          firstPage.drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        } else if (
          fieldName !== "selleraadharphone2" &&
          formattedData[fieldName]
        ) {
          firstPage.drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      if (formattedData.saleAmount && formattedData.amountInWords) {
        const saleAmountText = formattedData.saleAmount || "";
        const saleAmountWidth =
          saleAmountText.length * (englishFieldPositions.saleAmount.size / 2);
        const amountInWordsX =
          englishFieldPositions.saleAmount.x +
          saleAmountWidth +
          3 * (englishFieldPositions.saleAmount.size / 2);

        firstPage.drawText(formattedData.amountInWords, {
          x: amountInWordsX,
          y: englishFieldPositions.saleAmount.y,
          size: englishFieldPositions.saleAmount.size,
          color: rgb(0, 0, 0),
        });
      }

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

        const renderSingleImagePerPageLocal = async (
          pageItems,
          pageTitlePrefix,
        ) => {
          if (!pageItems || !pageItems.length) return;
          for (let idx = 0; idx < pageItems.length; idx++) {
            const url = pageItems[idx];
            const page = pdfDoc.addPage([595, 842]);
            try {
              const headerFont = await pdfDoc.embedFont(
                StandardFonts.HelveticaBold,
              );
              const logoBytes = await fetch(logo1).then((r) => r.arrayBuffer());
              const logoImg = await pdfDoc.embedPng(logoBytes);
              page.drawRectangle({
                x: 0,
                y: 780,
                width: 595,
                height: 80,
                color: rgb(0.047, 0.098, 0.196),
              });
              page.drawImage(logoImg, {
                x: 50,
                y: 743,
                width: 150,
                height: 120,
              });
              page.drawText("UDAYAM-BR-26-0028550", {
                x: 330,
                y: 805,
                size: 18,
                color: rgb(1, 1, 1),
                font: headerFont,
              });
              page.drawText("GSTIN: 22ABCDE1234F1Z5", {
                x: 330,
                y: 785,
                size: 18,
                color: rgb(1, 1, 1),
                font: headerFont,
              });
              page.drawRectangle({
                x: 0,
                y: 750,
                width: 595,
                height: 30,
                color: rgb(0.9, 0.9, 0.9),
              });
            } catch (err) {}

            const titleFont = await pdfDoc.embedFont(
              StandardFonts.HelveticaBold,
            );
            page.drawText(`${pageTitlePrefix} - Page ${idx + 1}`, {
              x: 50,
              y: 700,
              size: 12,
              font: titleFont,
            });

            try {
              const res = await fetch(url);
              const contentType = (
                res.headers.get("content-type") || ""
              ).toLowerCase();
              const bytes = await res.arrayBuffer();
              const pageWidth = 595;
              const margin = 50;
              const maxWidth = pageWidth - 2 * margin;
              const maxHeight = 660;

              if (
                contentType.includes("pdf") ||
                url.toLowerCase().endsWith(".pdf")
              ) {
                const embedded = await pdfDoc.embedPdf(bytes);
                const embeddedPage =
                  Array.isArray(embedded) && embedded.length
                    ? embedded[0]
                    : null;
                if (embeddedPage) {
                  const embeddedWidth =
                    embeddedPage.width || embeddedPage.getWidth?.() || 595;
                  const embeddedHeight =
                    embeddedPage.height || embeddedPage.getHeight?.() || 842;
                  let drawW = maxWidth;
                  let drawH = (embeddedHeight / embeddedWidth) * drawW;
                  if (drawH > maxHeight) {
                    drawH = maxHeight;
                    drawW = (embeddedWidth / embeddedHeight) * drawH;
                  }
                  const xPos = (pageWidth - drawW) / 2;
                  const yPos = 690 - drawH;
                  try {
                    page.drawPage(embeddedPage, {
                      x: xPos,
                      y: yPos,
                      width: drawW,
                      height: drawH,
                    });
                  } catch (err) {
                    try {
                      const asImg = await pdfDoc.embedJpg(bytes);
                      page.drawImage(asImg, {
                        x: xPos,
                        y: yPos,
                        width: drawW,
                        height: drawH,
                      });
                    } catch (e) {}
                  }
                }
              } else {
                let embedded;
                if (contentType.includes("png"))
                  embedded = await pdfDoc.embedPng(bytes);
                else embedded = await pdfDoc.embedJpg(bytes);
                const { width, height } = embedded.scale(1);
                let drawW = maxWidth;
                let drawH = (height / width) * drawW;
                if (drawH > maxHeight) {
                  drawH = maxHeight;
                  drawW = (width / height) * drawH;
                }
                const xPos = (pageWidth - drawW) / 2;
                const yPos = 690 - drawH;
                page.drawImage(embedded, {
                  x: xPos,
                  y: yPos,
                  width: drawW,
                  height: drawH,
                });
              }
            } catch (err) {
              console.warn("Error rendering multi-page doc", url, err);
            }
          }
        };

        if (documentsObj.insuranceCertificate) {
          if (Array.isArray(documentsObj.insuranceCertificate.pages)) {
            await renderSingleImagePerPageLocal(
              documentsObj.insuranceCertificate.pages,
              "Insurance Certificate",
            );
          } else if (Array.isArray(documentsObj.insuranceCertificate)) {
            await renderSingleImagePerPageLocal(
              documentsObj.insuranceCertificate,
              "Insurance Certificate",
            );
          }
        }

        if (documentsObj.vehicleNOC) {
          if (Array.isArray(documentsObj.vehicleNOC.pages)) {
            await renderSingleImagePerPageLocal(
              documentsObj.vehicleNOC.pages,
              "Vehicle NOC",
            );
          } else if (Array.isArray(documentsObj.vehicleNOC)) {
            await renderSingleImagePerPageLocal(
              documentsObj.vehicleNOC,
              "Vehicle NOC",
            );
          }
        }

        if (documentsObj.vehicleBuyReceipt) {
          if (Array.isArray(documentsObj.vehicleBuyReceipt.pages)) {
            await renderSingleImagePerPageLocal(
              documentsObj.vehicleBuyReceipt.pages,
              "Vehicle Buy Receipt",
            );
          } else if (Array.isArray(documentsObj.vehicleBuyReceipt)) {
            await renderSingleImagePerPageLocal(
              documentsObj.vehicleBuyReceipt,
              "Vehicle Buy Receipt",
            );
          }
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

        for (let i = 0; i < items.length; i += 4) {
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          try {
            const logoUrl = logo1;
            const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
            const logoImg = await pdfDoc.embedPng(logoBytes);

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
              color: rgb(1, 1, 1),
              font,
            });
            page.drawText("GSTIN: 22ABCDE1234F1Z5", {
              x: 330,
              y: 785,
              size: 18,
              color: rgb(1, 1, 1),
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

      if (includeDocuments && savedLetterData?.documents) {
        await addDocumentPages(savedLetterData.documents);
      }

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const pdfBytes = await pdfDoc.save();
      const filename = `vehicle_purchase_agreement_${
        formData.registrationNumber || "document"
      }_en.pdf`;
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      try {
        const saveRes = await fileSaveService.savePdfToDefaultDir(
          filename,
          pdfBytes,
          "buy",
        );
        if (saveRes && saveRes.success) {
          if (window.electronAPI) {
            alert(`PDF saved to ${saveRes.path || "default PDF folder"}`);
          }
        } else {
          saveAs(blob, filename);
        }
      } catch (err) {
        console.warn("Silent save failed for buy letter (en):", err);
        saveAs(blob, filename);
      }

      return savedLetterData;
    } catch (error) {
      console.error("Error generating English PDF:", error);

      let errorMessage = "Failed to generate English PDF. Please try again.";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }

      alert(errorMessage);
      throw error;
    } finally {
      setIsDownloading(false);
      setIsSaving(false);
    }
  };

  const handlePreview = async (language = "hindi") => {
    try {
      setShowLoadingOverlay(true);
      setPreviewLanguage(language);
      setIsGeneratingPreview(true);

      const errs = validateForm();
      if (Object.keys(errs || {}).length > 0) {
        setIsGeneratingPreview(false);
        setShowLoadingOverlay(false);
        return;
      }

      const templateName =
        language === "hindi" ? "buyletter.pdf" : "englishbuyletter.pdf";
      const existingPdfBytes = await loadPDFTemplate(templateName);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const firstPage = pdfDoc.getPages()[0];

      const formattedData = {
        ...formData,
        saleDate: formatDate(formData.saleDate),
        todayDate: formatDate(formData.todayDate),
        todayDate1: formatDate(formData.todayDate),
        todayTime: formatTime(formData.todayTime),
        todayTime1: formatTime(formData.todayTime),
        saleTime: formatTime(formData.saleTime),
        saleAmount: formatRupee(formData.saleAmount),
        vehiclekm: formatKm(formData.vehiclekm),
        amountInWords: formatIndianAmountInWords(
          formData.saleAmount
            ? formData.saleAmount.toString().replace(/\D/g, "")
            : "0",
        ),
      };

      const positions =
        language === "hindi" ? fieldPositions : englishFieldPositions;
      for (const [fieldName, position] of Object.entries(positions)) {
        if (
          fieldName === "selleraadharphone" &&
          formattedData.selleraadharphone
        ) {
          const combinedPhones = `${formattedData.selleraadharphone}${
            formattedData.selleraadharphone2
              ? ` , ${formattedData.selleraadharphone2}`
              : ""
          }`;
          firstPage.drawText(combinedPhones, {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        } else if (
          fieldName !== "selleraadharphone2" &&
          formattedData[fieldName]
        ) {
          firstPage.drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      if (formattedData.saleAmount && formattedData.amountInWords) {
        const saleAmountText = formattedData.saleAmount || "";
        const saleAmountWidth =
          saleAmountText.length * (positions.saleAmount.size / 2);
        const amountInWordsX =
          positions.saleAmount.x +
          saleAmountWidth +
          3 * (positions.saleAmount.size / 2);

        firstPage.drawText(formattedData.amountInWords, {
          x: amountInWordsX,
          y: positions.saleAmount.y,
          size: positions.saleAmount.size,
          color: rgb(0, 0, 0),
        });
      }

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPreviewPdf(url);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert(`Failed to generate ${language} preview. Please try again.`);
    } finally {
      setShowLoadingOverlay(false);
      setIsGeneratingPreview(false);
    }
  };
  const handleInput = (e) => {
    const { value } = e.target;
    e.target.value = value.toUpperCase();
    handleChange(e);
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
      y: 745,
      width: 150,
      height: 120,
    });

    page.drawImage(logoImage, {
      x: 280,
      y: 150,
      width: 470,
      height: 400,
      opacity: 0.3,
      rotate: degrees(45),
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 805,
      size: 14,
      color: rgb(1, 1, 1),
      font: font,
    });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", {
      x: 330,
      y: 785,
      size: 14,
      color: rgb(1, 1, 1),
      font: font,
    });
    page.drawText(
      "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
      {
        x: 50,
        y: 770,
        size: 8,
        color: rgb(0.8, 0.8, 0.8),
        font: font,
      },
    );
    page.drawRectangle({
      x: 0,
      y: 750,
      width: 595,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("VEHICLE BUY INVOICE", {
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

    page.drawText(`Name: ${formData.sellerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const address = formData.sellerCurrentAddress || "N/A";
    const maxCharsPerLine = 38;
    const lineHeight = 12;
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
        y: 650 - index * lineHeight,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      });
    });
    page.drawText(`Phone: ${formData.selleraadharphone || "N/A"}`, {
      x: 350,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`, ${formData.selleraadharphone2 || "N/A"}`, {
      x: 440,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Aadhar: ${formatAadhar(formData.selleraadhar) || "N/A"}`, {
      x: 350,
      y: 650,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText("VEHICLE DETAILS", {
      x: 50,
      y: 605,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });
    page.drawRectangle({
      x: 50,
      y: 575,
      width: 495,
      height: 20,
      opacity: 0.3,
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText("Condition: " + (formData.vehicleCondition || "N/A"), {
      x: 60,
      y: 581,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
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
    const vehicleHeaderPositions = [60, 120, 175, 235, 300, 405, 485];

    vehicleHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: vehicleHeaderPositions[index],
        y: 555,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font: boldFont,
      });
    });
    const vehicleValues = [
      formData.vehicleName || "N/A",
      formData.vehicleModel || "N/A",
      formData.vehicleColor || "N/A",
      formData.registrationNumber || "N/A",
      formData.chassisNumber || "N/A",
      formData.engineNumber || "N/A",
      formData.vehiclekm ? `${formatKm(formData.vehiclekm)} km` : "N/A",
    ];

    const columnWidths = [60, 40, 60, 80, 80, 40, 60];

    vehicleValues.forEach((value, index) => {
      const maxWidth = columnWidths[index];
      const xPos = vehicleHeaderPositions[index];
      let yPos = 543;

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

    page.drawText("BUY INFORMATION", {
      x: 50,
      y: 510,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(`Buy Date: ${formatDate(formData.saleDate)}`, {
      x: 60,
      y: 490,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Buy Amount: ${formatRupee(formData.saleAmount)}`, {
      x: 200,
      y: 490,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const paymentMethodDisplay = {
      cash: "CASH",
      upi: "UPI",
      bankTransfer: "BANK TRANSFER",
      other: "Other",
    };

    page.drawText(
      `Payment: ${paymentMethodDisplay[formData.paymentMethod] || "CASH"}`,
      {
        x: 350,
        y: 490,
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
        y: 460,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );

    page.drawText("TERMS & CONDITIONS", {
      x: 40,
      y: 430,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    const terms = [
      "1. No refunds after invoice billing, except for transfer issues reported within 15 days.",
      "2. Customer signature confirms acceptance of all terms.",
      `3. OK MOTORS has paid the money amount of ${formatRupee(
        formData.saleAmount,
      )} to ${formData.sellerName}.`,
      "4. The seller confirms that the vehicle is free from any loans, liabilities, or pending challans at the time of sale.",
      "5. The seller agrees to provide all original documents including RC, insurance, and ID proof at the time of sale.",
      "6. OK MOTORS is not responsible for any past violations, legal disputes, or ownership claims before the date of purchase.",
      "7. The seller confirms that the bike has not been involved in any major accidents or insurance claims.",
      "8. Vehicle handover includes all keys, documents, and accessories as agreed.",
      "9. The seller confirms that the chassis and engine numbers are intact and not tampered with.",
    ];

    terms.forEach((term, index) => {
      page.drawText(term, {
        x: 40,
        y: 410 - index * 15,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: font,
      });
    });

    page.drawText("Seller Signature", {
      x: 110,
      y: 170,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 185 },
      end: { x: 250, y: 185 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Authorized Signatory", {
      x: 350,
      y: 170,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 185 },
      end: { x: 500, y: 185 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    try {
      const thank = "Thank you for your business!";
      const addr =
        "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
      const thankW = boldFont.widthOfTextAtSize(thank, 12);
      const addrW = font.widthOfTextAtSize(addr, 9);
      const centerXThank = (595 - thankW) / 2;
      const centerXAddr = (595 - addrW) / 2;
      page.drawLine({
        start: { x: 20, y: 70 },
        end: { x: 575, y: 70 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      page.drawText(thank, {
        x: centerXThank,
        y: 50,
        size: 12,
        color: rgb(0.047, 0.098, 0.196),
        font: boldFont,
      });
      page.drawText(addr, {
        x: centerXAddr,
        y: 30,
        size: 9,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      });
    } catch (e) {}
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
          display: isMobile && !isSidebarOpen ? "flex" : "none",
        }}
      >
        <div
          style={styles.hamburgerMenu}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={35} color="#ffffff" /> : <Menu size={35} color="#ffffff" />}
        </div>
        <img src={logoheader} alt="logo" style={styles.topBarLogo} />
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

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div>
                <h1 style={styles.pageTitle}>Create Buy Letter</h1>
                <p style={styles.pageSubtitle}>
                  Fill in the details to generate a vehicle purchase agreement
                </p>
              </div>
            </div>
          </div>

          <form className="form" style={styles.form}>
            {}
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
                <User style={styles.sectionIcon} /> Seller Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Name || विक्रेता का नाम
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("sellerName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "sellerName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 35 : 35}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Father's Name || विक्रेता के पिता का नाम
                  </label>
                  <input
                    type="text"
                    name="sellerFatherName"
                    value={formData.sellerFatherName}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("sellerFatherName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "sellerFatherName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 36 : 37}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Current Address || विक्रेता का वर्तमान पता
                  </label>
                  <input
                    type="text"
                    name="sellerCurrentAddress"
                    value={formData.sellerCurrentAddress}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("sellerCurrentAddress")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "sellerCurrentAddress"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 64 : 57}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Aadhar Number || विक्रेता का आधार नंबर
                  </label>
                  <input
                    type="text"
                    name="selleraadhar"
                    value={formData.selleraadhar}
                    onChange={(e) => {
                      let value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                      let formatted = value.match(/.{1,4}/g)?.join("-") || "";
                      setFormData((prev) => ({
                        ...prev,
                        selleraadhar: formatted,
                      }));
                    }}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("selleraadhar")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "selleraadhar"
                        ? styles.inputFocused
                        : {}),
                    }}
                    placeholder="1234-5678-9012"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller PAN Number || विक्रेता का पैन नंबर
                  </label>
                  <input
                    type="text"
                    name="sellerpan"
                    value={formData.sellerpan}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("sellerpan")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "sellerpan"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Aadhar Linked Phone || विक्रेता का आधार नंबर संलग्न
                    फोन
                  </label>
                  <input
                    type="type"
                    name="selleraadharphone"
                    value={formData.selleraadharphone}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("selleraadharphone")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "selleraadharphone"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={10}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Seller Alternate Phone || विक्रेता का वैकल्पिक फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="selleraadharphone2"
                    value={formData.selleraadharphone2}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("selleraadharphone2")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "selleraadharphone2"
                        ? styles.inputFocused
                        : {}),
                    }}
                    maxLength={10}
                  />
                </div>
                {/* Document uploads (vehicle RC, Aadhaar, PAN, KM photos) */}

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Witness Name || गवाह का नाम
                  </label>
                  <input
                    type="text"
                    name="witnessname"
                    value={formData.witnessname}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("witnessname")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "witnessname"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 30 : 40}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Witness Phone || गवाह का फोन नंबर
                  </label>
                  <input
                    type="text"
                    name="witnessphone"
                    value={formData.witnessphone}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("witnessphone")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "witnessphone"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={10}
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
                    Vehicle Brand || वाहन का ब्रांड
                  </label>
                  <input
                    type="text"
                    name="vehicleName"
                    value={formData.vehicleName}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("vehicleName")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehicleName"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 14 : 19}
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
                    maxLength={selectedLanguage === "hindi" ? 15 : 16}
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
                    maxLength={selectedLanguage === "hindi" ? 9 : 8}
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
                    onFocus={() => setFocusedInput("registrationNumber")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "registrationNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 11 : 14}
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
                    maxLength={selectedLanguage === "hindi" ? 17 : 17}
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
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("engineNumber")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "engineNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 18 : 12}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Kilometers || वाहन किलोमीटर
                  </label>
                  <input
                    type="text"
                    name="vehiclekm"
                    value={formData.vehiclekm}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9.]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        vehiclekm: rawValue,
                      }));
                    }}
                    onFocus={() => setFocusedInput("vehiclekm")}
                    onBlur={() => {
                      if (formData.vehiclekm !== "") {
                      }
                      setFocusedInput(null);
                    }}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "vehiclekm"
                        ? styles.inputFocused
                        : {}),
                    }}
                    placeholder="e.g. 1,200.00"
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
                    onFocus={() => setFocusedInput("vehicleCondition")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formSelect,
                      ...(focusedInput === "vehicleCondition"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                  >
                    <option value="running">Running</option>
                    <option value="notRunning">Not Running</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <FileText style={styles.sectionIcon} /> Documents Upload
              </h2>
              <div style={styles.formGrid}>
                {/* Vehicle RC Upload Mode Toggle */}
                <div style={{ ...styles.formField, width: "100%" }}>
                  <label style={{ ...styles.formLabel, marginBottom: "12px" }}>
                    Vehicle RC Upload Mode
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="vehicleRCUploadMode"
                        value="single"
                        checked={vehicleRCUploadMode === "single"}
                        onChange={(e) => {
                          setVehicleRCUploadMode(e.target.value);
                          setFilesState((prev) => ({
                            ...prev,
                            vehicleRCFront: null,
                            vehicleRCBack: null,
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            vehicleRCFront: null,
                            vehicleRCBack: null,
                          }));
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px" }}>
                        Single File (Front + Back in one PDF/Image)
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="vehicleRCUploadMode"
                        value="separate"
                        checked={vehicleRCUploadMode === "separate"}
                        onChange={(e) => {
                          setVehicleRCUploadMode(e.target.value);
                          setFilesState((prev) => ({
                            ...prev,
                            vehicleRCFront: null,
                            vehicleRCBack: null,
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            vehicleRCFront: null,
                            vehicleRCBack: null,
                          }));
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px" }}>
                        Two Separate Images (Front & Back)
                      </span>
                    </label>
                  </div>
                </div>

                {vehicleRCUploadMode === "single" ? (
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Vehicle RC (Front and Back)
                    </label>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <button
                        type="button"
                        onClick={() => handleFileInput("vehicleRCFront", true)}
                        style={styles.uploadBtn}
                      >
                        <Image size={20} />{" "}
                        {filePreviews.vehicleRCFront ? "Change" : "Choose File"}
                      </button>
                      {filePreviews.vehicleRCFront && (
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveFile("vehicleRCFront");
                            setFilesState((prev) => ({
                              ...prev,
                              vehicleRCBack: null,
                            }));
                            setFilePreviews((prev) => ({
                              ...prev,
                              vehicleRCBack: null,
                            }));
                          }}
                          style={{
                            ...styles.uploadBtn,
                            backgroundColor: "#ef4444",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {filePreviews.vehicleRCFront && (
                      <img
                        src={filePreviews.vehicleRCFront}
                        alt="rc-front"
                        style={styles.previewImg}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap",
                      width: "100%",
                    }}
                  >
                    <div style={{ ...styles.formField, flex: "1 1 200px" }}>
                      <label style={styles.formLabel}>Vehicle RC - Front</label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleFileInput("vehicleRCFront", true)
                          }
                          style={styles.uploadBtn}
                        >
                          <Image size={20} />{" "}
                          {filePreviews.vehicleRCFront
                            ? "Change"
                            : "Choose File"}
                        </button>
                        {filePreviews.vehicleRCFront && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("vehicleRCFront")}
                            style={{
                              ...styles.uploadBtn,
                              backgroundColor: "#ef4444",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {filePreviews.vehicleRCFront && (
                        <img
                          src={filePreviews.vehicleRCFront}
                          alt="rc-front"
                          style={styles.previewImg}
                        />
                      )}
                    </div>

                    <div style={{ ...styles.formField, flex: "1 1 200px" }}>
                      <label style={styles.formLabel}>Vehicle RC - Back</label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleFileInput("vehicleRCBack", true)}
                          style={styles.uploadBtn}
                        >
                          <Image size={20} />{" "}
                          {filePreviews.vehicleRCBack
                            ? "Change"
                            : "Choose File"}
                        </button>
                        {filePreviews.vehicleRCBack && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("vehicleRCBack")}
                            style={{
                              ...styles.uploadBtn,
                              backgroundColor: "#ef4444",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {filePreviews.vehicleRCBack && (
                        <img
                          src={filePreviews.vehicleRCBack}
                          alt="rc-back"
                          style={styles.previewImg}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Insurance Certificate (multi-page) */}
                <div style={{ ...styles.formField, width: "100%" }}>
                  <label style={styles.formLabel}>
                    Insurance Certificate Pages
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleFileInput("insuranceCertificate", true)
                      }
                      style={styles.uploadBtn}
                    >
                      <Image size={20} />{" "}
                      {filePreviews.insuranceCertificate
                        ? "Change"
                        : "Upload Pages"}
                    </button>
                    {filePreviews.insuranceCertificate && (
                      <div style={{ fontSize: "14px", color: "#333" }}>
                        {Array.isArray(filePreviews.insuranceCertificate)
                          ? `${filePreviews.insuranceCertificate.length} page(s)`
                          : "1 page"}
                      </div>
                    )}
                    {filePreviews.insuranceCertificate && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilesState((prev) => ({
                            ...prev,
                            insuranceCertificate: [],
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            insuranceCertificate: null,
                          }));
                        }}
                        style={{
                          ...styles.uploadBtn,
                          backgroundColor: "#ef4444",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {filePreviews.insuranceCertificate &&
                    Array.isArray(filePreviews.insuranceCertificate) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {filePreviews.insuranceCertificate
                          .slice(0, 6)
                          .map((u, idx) => (
                            <img
                              key={idx}
                              src={u}
                              alt={`insurance-cert-${idx + 1}`}
                              style={{
                                width: 100,
                                height: 80,
                                objectFit: "cover",
                              }}
                            />
                          ))}
                      </div>
                    )}
                </div>

                {/* Vehicle NOC (multi-page) */}
                <div style={{ ...styles.formField, width: "100%" }}>
                  <label style={styles.formLabel}>Vehicle NOC Pages</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleFileInput("vehicleNOC", true)}
                      style={styles.uploadBtn}
                    >
                      <Image size={20} />{" "}
                      {filePreviews.vehicleNOC ? "Change" : "Upload Pages"}
                    </button>
                    {filePreviews.vehicleNOC && (
                      <div style={{ fontSize: "14px", color: "#333" }}>
                        {Array.isArray(filePreviews.vehicleNOC)
                          ? `${filePreviews.vehicleNOC.length} page(s)`
                          : "1 page"}
                      </div>
                    )}
                    {filePreviews.vehicleNOC && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilesState((prev) => ({
                            ...prev,
                            vehicleNOC: [],
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            vehicleNOC: null,
                          }));
                        }}
                        style={{
                          ...styles.uploadBtn,
                          backgroundColor: "#ef4444",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {filePreviews.vehicleNOC &&
                    Array.isArray(filePreviews.vehicleNOC) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {filePreviews.vehicleNOC.slice(0, 6).map((u, idx) => (
                          <img
                            key={idx}
                            src={u}
                            alt={`vehicle-noc-${idx + 1}`}
                            style={{
                              width: 100,
                              height: 80,
                              objectFit: "cover",
                            }}
                          />
                        ))}
                      </div>
                    )}
                </div>

                {/* Vehicle Buy Receipt (multi-page) */}
                <div style={{ ...styles.formField, width: "100%" }}>
                  <label style={styles.formLabel}>
                    Vehicle Buy Receipt Pages
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleFileInput("vehicleBuyReceipt", true)}
                      style={styles.uploadBtn}
                    >
                      <Image size={20} />{" "}
                      {filePreviews.vehicleBuyReceipt
                        ? "Change"
                        : "Upload Pages"}
                    </button>
                    {filePreviews.vehicleBuyReceipt && (
                      <div style={{ fontSize: "14px", color: "#333" }}>
                        {Array.isArray(filePreviews.vehicleBuyReceipt)
                          ? `${filePreviews.vehicleBuyReceipt.length} page(s)`
                          : "1 page"}
                      </div>
                    )}
                    {filePreviews.vehicleBuyReceipt && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilesState((prev) => ({
                            ...prev,
                            vehicleBuyReceipt: [],
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            vehicleBuyReceipt: null,
                          }));
                        }}
                        style={{
                          ...styles.uploadBtn,
                          backgroundColor: "#ef4444",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {filePreviews.vehicleBuyReceipt &&
                    Array.isArray(filePreviews.vehicleBuyReceipt) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {filePreviews.vehicleBuyReceipt
                          .slice(0, 6)
                          .map((u, idx) => (
                            <img
                              key={idx}
                              src={u}
                              alt={`vehicle-buy-receipt-${idx + 1}`}
                              style={{
                                width: 100,
                                height: 80,
                                objectFit: "cover",
                              }}
                            />
                          ))}
                      </div>
                    )}
                </div>

                {/* Aadhaar Upload Mode Toggle */}
                <div style={{ ...styles.formField, width: "100%" }}>
                  <label style={{ ...styles.formLabel, marginBottom: "12px" }}>
                    Aadhaar Upload Mode
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="aadhaarUploadMode"
                        value="single"
                        checked={aadhaarUploadMode === "single"}
                        onChange={(e) => {
                          setAadhaarUploadMode(e.target.value);
                          // Clear aadhaar files when switching modes
                          setFilesState((prev) => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px" }}>
                        Single File (Front + Back in one PDF/Image)
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="aadhaarUploadMode"
                        value="separate"
                        checked={aadhaarUploadMode === "separate"}
                        onChange={(e) => {
                          setAadhaarUploadMode(e.target.value);
                          // Clear aadhaar files when switching modes
                          setFilesState((prev) => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                          setFilePreviews((prev) => ({
                            ...prev,
                            aadhaarFront: null,
                            aadhaarBack: null,
                          }));
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px" }}>
                        Two Separate Images (Front & Back)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Render upload fields based on mode */}
                {aadhaarUploadMode === "single" ? (
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>
                      Aadhaar (Front and Back)
                    </label>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <button
                        type="button"
                        onClick={() => handleFileInput("aadhaarFront", true)}
                        style={styles.uploadBtn}
                      >
                        <Image size={20} />{" "}
                        {filePreviews.aadhaarFront ? "Change" : "Choose File"}
                      </button>
                      {filePreviews.aadhaarFront && (
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveFile("aadhaarFront");
                            setFilesState((prev) => ({
                              ...prev,
                              aadhaarBack: null,
                            }));
                            setFilePreviews((prev) => ({
                              ...prev,
                              aadhaarBack: null,
                            }));
                          }}
                          style={{
                            ...styles.uploadBtn,
                            backgroundColor: "#ef4444",
                          }}
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
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap",
                      width: "100%",
                    }}
                  >
                    <div style={{ ...styles.formField, flex: "1 1 200px" }}>
                      <label style={styles.formLabel}>Aadhaar (Front)</label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleFileInput("aadhaarFront", true)}
                          style={styles.uploadBtn}
                        >
                          <Image size={20} />{" "}
                          {filePreviews.aadhaarFront ? "Change" : "Choose File"}
                        </button>
                        {filePreviews.aadhaarFront && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("aadhaarFront")}
                            style={{
                              ...styles.uploadBtn,
                              backgroundColor: "#ef4444",
                            }}
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

                    <div style={{ ...styles.formField, flex: "1 1 200px" }}>
                      <label style={styles.formLabel}>Aadhaar (Back)</label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleFileInput("aadhaarBack", true)}
                          style={styles.uploadBtn}
                        >
                          <Image size={20} />{" "}
                          {filePreviews.aadhaarBack ? "Change" : "Choose File"}
                        </button>
                        {filePreviews.aadhaarBack && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile("aadhaarBack")}
                            style={{
                              ...styles.uploadBtn,
                              backgroundColor: "#ef4444",
                            }}
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
                  </div>
                )}

                <div style={styles.formField}>
                  <label style={styles.formLabel}>PAN Card Photo</label>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <button
                      type="button"
                      onClick={() => handleFileInput("panPhoto", true)}
                      style={styles.uploadBtn}
                    >
                      <Image size={20} />{" "}
                      {filePreviews.panPhoto ? "Change" : "Choose File"}
                    </button>
                    {filePreviews.panPhoto && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("panPhoto")}
                        style={{
                          ...styles.uploadBtn,
                          backgroundColor: "#ef4444",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {filePreviews.panPhoto && (
                    <img
                      src={filePreviews.panPhoto}
                      alt="pan"
                      style={styles.previewImg}
                    />
                  )}
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Delivery Photo</label>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <button
                      type="button"
                      onClick={() => handleFileInput("deliveryPhoto", true)}
                      style={styles.uploadBtn}
                    >
                      <Image size={20} />{" "}
                      {filePreviews.deliveryPhoto ? "Change" : "Choose File"}
                    </button>
                    {filePreviews.deliveryPhoto && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("deliveryPhoto")}
                        style={{
                          ...styles.uploadBtn,
                          backgroundColor: "#ef4444",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {filePreviews.deliveryPhoto && (
                    <img
                      src={filePreviews.deliveryPhoto}
                      alt="delivery"
                      style={styles.previewImg}
                    />
                  )}
                </div>

                {/* Aadhaar Upload Mode Toggle */}
              </div>
            </div>

            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Calendar style={styles.sectionIcon} /> PUC & Insurance
              </h2>
              <div style={styles.formGrid}>
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
                    onFocus={() => setFocusedInput("pucIssueDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "pucIssueDate"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    onFocus={() => setFocusedInput("pucExpiryDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "pucExpiryDate"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    onFocus={() => setFocusedInput("pucStatus")}
                    onBlur={() => setFocusedInput(null)}
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
                    onFocus={() => setFocusedInput("insuranceExpiryDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "insuranceExpiryDate"
                        ? styles.inputFocused
                        : {}),
                    }}
                  />
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
                    onFocus={() => setFocusedInput("insuranceStatus")}
                    onBlur={() => setFocusedInput(null)}
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
                    <User style={styles.formIcon} />
                    Insurance Company || बीमा कंपनी
                  </label>
                  <input
                    type="text"
                    name="insuranceCompany"
                    value={formData.insuranceCompany || ""}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("insuranceCompany")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "insuranceCompany"
                        ? styles.inputFocused
                        : {}),
                    }}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Insurance Policy Number || पॉलिसी संख्या
                  </label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber || ""}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("insurancePolicyNumber")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "insurancePolicyNumber"
                        ? styles.inputFocused
                        : {}),
                    }}
                  />
                </div>
              </div>

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
                    maxLength={selectedLanguage === "hindi" ? 27 : 30}
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
                    maxLength={selectedLanguage === "hindi" ? 20 : 25}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Buyer Current Address || खरीददार का वर्तमान पता
                  </label>
                  <input
                    type="text"
                    name="buyerCurrentAddress"
                    value={formData.buyerCurrentAddress}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("buyerCurrentAddress")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "buyerCurrentAddress"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 100 : 40}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Purchase Through || वाहन का माध्यम
                  </label>
                  <input
                    type="text"
                    name="dealername"
                    value={formData.dealername}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("dealername")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "dealername"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 30 : 14}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Address || माध्यम का पता
                  </label>
                  <input
                    type="text"
                    name="dealeraddress"
                    value={formData.dealeraddress}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("dealeraddress")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "dealeraddress"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 100 : 29}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Return Person Name || वापसी व्यक्ति का नाम
                  </label>
                  <input
                    type="text"
                    name="returnpersonname"
                    value={formData.returnpersonname}
                    onChange={handleChange}
                    onInput={handleInput}
                    onFocus={() => setFocusedInput("returnpersonname")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "returnpersonname"
                        ? styles.inputFocused
                        : {}),
                    }}
                    required
                    maxLength={selectedLanguage === "hindi" ? 20 : 36}
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
                    onFocus={() => setFocusedInput("saleDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "saleDate"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    onFocus={() => setFocusedInput("saleTime")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "saleTime"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    onFocus={() => setFocusedInput("paymentMethod")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formSelect,
                      ...(focusedInput === "paymentMethod"
                        ? styles.inputFocused
                        : {}),
                    }}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bankTransfer">Bank Transfer</option>
                    <option value="loan">Loan</option>
                    <option value="soldloan">Sold on Loan</option>
                    <option value="other">Other</option>
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
                    onFocus={() => setFocusedInput("todayDate")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "todayDate"
                        ? styles.inputFocused
                        : {}),
                    }}
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
                    onFocus={() => setFocusedInput("todayTime")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...styles.formInput,
                      ...(focusedInput === "todayTime"
                        ? styles.inputFocused
                        : {}),
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <FileText style={styles.sectionIcon} /> Additional Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formCheckboxField}>
                  <input
                    type="checkbox"
                    name="documentsVerified1"
                    checked={formData.documentsVerified1}
                    onChange={handleChange}
                    style={{
                      ...styles.formCheckbox,
                      ...(focusedInput === "documentsVerified1"
                        ? styles.inputFocused
                        : {}),
                    }}
                  />
                  <label style={styles.formCheckboxLabel}>
                    <CheckCircle style={styles.formIcon} />
                    All documents verified and satisfactory (Line 2) || सभी
                    दस्तावेज सत्यापित और संतोषजनक (लाइन 2)
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
                    maxLength={selectedLanguage === "hindi" ? 80 : 100}
                    rows={3}
                  />
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
                  disabled={isSaving || isGeneratingPreview}
                >
                  <FileText style={styles.buttonIcon} /> Preview
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
        {progressStep > 0 && <ProcessingModal step={progressStep} />}

        {showPreviewModal && (
          <div style={styles.modalOverlay}>
            <div
              style={{
                ...styles.modalContent,
                width: isMobile ? "95vw" : "1400px",
                maxWidth: isMobile ? "95vw" : "95%",
                height: isMobile ? "85vh" : "90vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={styles.modalTitle}>
                Document Preview -{" "}
                {previewLanguage === "hindi" ? "Hindi" : "English"}
              </h3>
              <div
                style={{
                  flex: 1,
                  width: "100%",
                  marginBottom: "20px",
                  minHeight: 0,
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
        {showLoadingOverlay && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingContent}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Generating PDF Preview...</p>
              <p style={styles.loadingSubtext}>This may take a few seconds</p>
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
            allowMultiple={uploadModalAllowMultiple}
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
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  queueCount: {
    fontSize: "0.75rem",
    backgroundColor: "#f59e0b",
    color: "white",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  syncButton: {
    fontSize: "0.75rem",
    backgroundColor: "#088395",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#2DA2AD",
    },
  },
  pageTitle: {
    fontSize: "1.875rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
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
    backgroundColor: "#fff5f5",
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
    gap: "2px",
  },
  formField: {
    marginBottom: "16px",
    width: "90%",
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
  },
  formIcon: {
    width: "18px",
    height: "18px",
    color: "#64748b",
  },

  formInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    backgroundColor: "#ffffff",
    ":focus": {
      outline: "none",
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "black",
    },
  },

  formSelect: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    backgroundColor: "#ffffff",
    transition: "all 0.2s ease",
    appearance: "none",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "1em",
    ":focus": {
      outline: "none",
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "red",
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
    backgroundColor: "#ffffff",
    ":focus": {
      outline: "none",
      borderColor: "#088395",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#f8fafc",
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
  previewImg: {
    width: "100%",
    height: "150px",
    objectFit: "contain",
    marginTop: "8px",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    backgroundColor: "#f8fafc",
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
    height: "80px",
    objectFit: "cover",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  removePreviewBtn: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "12px",
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
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#071952",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    zIndex: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 1rem",
  },
  topBarLogo: {
    width: "250px",
    height: "auto",
    margin: "-40px",
    padding: 0,
    display: "block",
  },
  hamburgerMenu: {
    cursor: "pointer",
    padding: "8px",
    position: "absolute",
    left: "1rem",
    color: "#ffffff",
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
export default BuyLetterForm;
