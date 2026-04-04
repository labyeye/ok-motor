import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  Search,
  Download,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { loadPDFTemplate } from "../utils/pdfTemplateLoader";
import logo1 from "../images/okmotorback.png";
import PdfPreview from "./PdfPreview";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
import ConfirmModal from "./ConfirmModal";
import AlertModal from "./common/AlertModal";
import TableFilter from "./common/TableFilter";

const BuyLetterHistory = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [chosenLanguage, setChosenLanguage] = useState(null);
  const [languageAction, setLanguageAction] = useState(null);
  const [docSelections, setDocSelections] = useState({
    letter: true,
    invoice: true,
    vehicleRC: true,
    aadhaar: true,
    pan: true,
    vehicleKM: true,
    vehiclePhotos: true,
    signedDocBuy: true,
    insuranceCertificate: true,
    vehicleNOC: true,
    vehicleBuyReceipt: true,
  });
  const [buyLetters, setBuyLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ year: null, amount: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmTargetType, setConfirmTargetType] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);
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

  const getFieldLabel = (fieldName) => {
    const labels = {
      sellerName: "Seller Name",
      sellerFatherName: "Seller Father Name",
      sellerCurrentAddress: "Seller Address",
      selleraadhar: "Seller Aadhaar",
      sellerpan: "Seller PAN",
      selleraadharphone: "Seller Phone",
      selleraadharphone2: "Seller Phone 2",
      vehicleName: "Vehicle Name",
      vehicleModel: "Vehicle Model",
      vehicleColor: "Vehicle Color",
      registrationNumber: "Registration Number",
      chassisNumber: "Chassis Number",
      engineNumber: "Engine Number",
      vehiclekm: "Vehicle KM",
      vehicleCondition: "Vehicle Condition",
      buyerName: "Buyer Name",
      buyerFatherName: "Buyer Father Name",
      buyerCurrentAddress: "Buyer Address",
      buyernames: "Buyer Names",
      buyerphone: "Buyer Phone",
      witnessname: "Witness Name",
      witnessphone: "Witness Phone",
      dealername: "Dealer Name",
      dealeraddress: "Dealer Address",
      returnpersonname: "Return Person Name",
      saleDate: "Sale Date",
      saleTime: "Sale Time",
      saleAmount: "Sale Amount",
      paymentMethod: "Payment Method",
      todayDate: "Today's Date",
      todayTime: "Today's Time",
      note: "Note",
    };
    labels.pucIssueDate = "PUC Issue Date";
    labels.pucExpiryDate = "PUC Expiry Date";
    labels.pucStatus = "PUC Status";
    labels.insuranceExpiryDate = "Insurance Expiry Date";
    labels.insuranceStatus = "Insurance Status";
    labels.insuranceCompany = "Insurance Company";
    labels.insurancePolicyNumber = "Insurance Policy Number";
    return labels[fieldName] || fieldName;
  };

  const getChanges = (letter) => {
    if (!letter.previousVersionId || letter.version === 1) return null;

    const changes = [];
    const fieldsToCompare = [
      "sellerName",
      "sellerFatherName",
      "sellerCurrentAddress",
      "selleraadhar",
      "sellerpan",
      "selleraadharphone",
      "selleraadharphone2",
      "vehicleName",
      "vehicleModel",
      "vehicleColor",
      "registrationNumber",
      "chassisNumber",
      "engineNumber",
      "vehiclekm",
      "vehicleCondition",
      "buyerName",
      "pucIssueDate",
      "pucExpiryDate",
      "pucStatus",
      "insuranceExpiryDate",
      "insuranceStatus",
      "insuranceCompany",
      "insurancePolicyNumber",
      "buyerFatherName",
      "buyerCurrentAddress",
      "buyernames",
      "buyerphone",
      "witnessname",
      "witnessphone",
      "dealername",
      "dealeraddress",
      "returnpersonname",
      "saleAmount",
      "paymentMethod",
      "note",
    ];

    const normalize = (val) => {
      if (val === null || val === undefined) return "";
      return String(val).trim();
    };

    const normalizeDate = (val) => {
      if (!val) return "";
      try {
        let ds = val;
        if (typeof ds === "string" && ds.includes("T")) ds = ds.split("T")[0];
        const date = new Date(ds);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0];
      } catch (e) {
        return "";
      }
    };

    if (letter.previousVersion) {
      fieldsToCompare.forEach((field) => {
        const oldValue = letter.previousVersion[field];
        const newValue = letter[field];

        if (
          ["pucIssueDate", "pucExpiryDate", "insuranceExpiryDate"].includes(
            field,
          )
        ) {
          if (normalizeDate(oldValue) !== normalizeDate(newValue)) {
            changes.push({
              field: getFieldLabel(field),
              oldValue: formatDate(oldValue) || "(empty)",
              newValue: formatDate(newValue) || "(empty)",
            });
          }
        } else {
          if (normalize(oldValue) !== normalize(newValue)) {
            changes.push({
              field: getFieldLabel(field),
              oldValue: oldValue || "(empty)",
              newValue: newValue || "(empty)",
            });
          }
        }
      });

      const oldSaleDate = normalizeDate(letter.previousVersion.saleDate);
      const newSaleDate = normalizeDate(letter.saleDate);
      if (oldSaleDate !== newSaleDate) {
        changes.push({
          field: "Sale Date",
          oldValue: formatDate(letter.previousVersion.saleDate) || "(empty)",
          newValue: formatDate(letter.saleDate) || "(empty)",
        });
      }

      const oldTodayDate = normalizeDate(letter.previousVersion.todayDate);
      const newTodayDate = normalizeDate(letter.todayDate);
      if (oldTodayDate !== newTodayDate) {
        changes.push({
          field: "Today's Date",
          oldValue: formatDate(letter.previousVersion.todayDate) || "(empty)",
          newValue: formatDate(letter.todayDate) || "(empty)",
        });
      }

      const checkDocumentChange = (docPath, label) => {
        const getNestedValue = (obj, path) =>
          path.split(".").reduce((acc, part) => acc?.[part], obj);
        const oldDoc = getNestedValue(
          letter.previousVersion.documents,
          docPath,
        );
        const newDoc = getNestedValue(letter.documents, docPath);

        if (normalize(oldDoc) !== normalize(newDoc)) {
          if (!oldDoc && newDoc) {
            changes.push({
              field: label,
              oldValue: "Not uploaded",
              newValue: "Uploaded",
            });
          } else if (oldDoc && !newDoc) {
            changes.push({
              field: label,
              oldValue: "Uploaded",
              newValue: "Removed",
            });
          } else if (oldDoc && newDoc && oldDoc !== newDoc) {
            changes.push({
              field: label,
              oldValue: "Updated (old document)",
              newValue: "Updated (new document)",
            });
          }
        }
      };

      checkDocumentChange("vehicleRC.front", "Vehicle RC - Front");
      checkDocumentChange("vehicleRC.back", "Vehicle RC - Back");
      checkDocumentChange("aadhaar.front", "Aadhaar - Front");
      checkDocumentChange("aadhaar.back", "Aadhaar - Back");
      checkDocumentChange("pan", "PAN Card");
      checkDocumentChange("deliveryPhoto", "Delivery Photo") ||
        checkDocumentChange("vehicleKM", "Delivery Photo");
      checkDocumentChange("signedDocBuy", "Signed Doc (Buy)");
      checkDocumentChange("insuranceCertificate", "Insurance Certificate");
      checkDocumentChange("vehicleNOC", "Vehicle NOC");
      checkDocumentChange("vehicleBuyReceipt", "Vehicle Buy Receipt");

      const oldPhotosCount =
        letter.previousVersion.documents?.vehiclePhotos?.length || 0;
      const newPhotosCount = letter.documents?.vehiclePhotos?.length || 0;
      if (oldPhotosCount !== newPhotosCount) {
        changes.push({
          field: "Vehicle Photos",
          oldValue: `${oldPhotosCount} photo${oldPhotosCount !== 1 ? "s" : ""}`,
          newValue: `${newPhotosCount} photo${newPhotosCount !== 1 ? "s" : ""}`,
        });
      }
    }

    return changes.length > 0 ? changes : null;
  };
  useEffect(() => {
    const fetchBuyLetters = async () => {
      try {
        setLoading(true);

        const isOnline = navigator.onLine;

        if (isOnline) {
          const response = await axios.get(
            `https://ok-motor-51l3.vercel.app/api/buy-letter?page=${currentPage}`,
            {
              headers: {},
            },
          );
          console.log("API Response:", response.data);
          setBuyLetters(response.data.buyLetters);
          setTotalPages(response.data.pages);
        } else {
          console.log("Offline mode - loading from local storage");
          const offlineStorage = (await import("../services/offlineStorage"))
            .default;
          const result = await offlineStorage.find("buyLetters");

          if (result.success && result.data) {
            const sortedData = result.data.sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
            setBuyLetters(sortedData);
            setTotalPages(1);
          } else {
            setBuyLetters([]);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error("Error details:", error.response?.data || error.message);

        if (navigator.onLine) {
          console.log("Online fetch failed, trying offline fallback");
          try {
            const offlineStorage = (await import("../services/offlineStorage"))
              .default;
            const result = await offlineStorage.find("buyLetters");

            if (result.success && result.data) {
              const sortedData = result.data.sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
              );
              setBuyLetters(sortedData);
              setTotalPages(1);
            }
          } catch (offlineError) {
            console.error("Offline fallback also failed:", offlineError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBuyLetters();
  }, [currentPage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
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

  const drawHeaderFooter = async (pdfDoc, page) => {
    try {
      const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const logoBytes = await fetch(logo1).then((r) => r.arrayBuffer());
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
      } catch (e) {}
      page.drawText("UDAYAM-BR-26-0028550", {
        x: 330,
        y: 805,
        size: 14,
        color: rgb(1, 1, 1),
        font: headerFont,
      });
      page.drawText("GSTIN: 22ABCDE1234F1Z5", {
        x: 330,
        y: 785,
        size: 14,
        color: rgb(1, 1, 1),
        font: headerFont,
      });

      try {
        const thank = "Thank you for your business!";
        const addr =
          "OK MOTORS | Pillar num.53, Bailey Rd, Raja Bazar, Patna, Bihar 800014";
        const thankW = headerFont.widthOfTextAtSize(thank, 12);
        const addrW = regularFont.widthOfTextAtSize(addr, 9);
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
          font: headerFont,
        });
        page.drawText(addr, {
          x: centerXAddr,
          y: 26,
          size: 9,
          color: rgb(0.45, 0.45, 0.45),
          font: regularFont,
        });
      } catch (e) {}
    } catch (err) {}
  };

  const embedAssetFromUrl = async (pdfDoc, url) => {
    try {
      const res = await fetch(url);
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const bytes = await res.arrayBuffer();

      if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
        const embeddedPages = await pdfDoc.embedPdf(bytes);

        if (Array.isArray(embeddedPages) && embeddedPages.length > 0)
          return { kind: "pdf", embeddedPage: embeddedPages[0] };
        return null;
      }

      if (contentType.includes("png")) {
        const img = await pdfDoc.embedPng(bytes);
        return { kind: "image", embedded: img };
      }

      const img = await pdfDoc.embedJpg(bytes);
      return { kind: "image", embedded: img };
    } catch (err) {
      console.warn("Failed to embed asset from", url, err);
      return null;
    }
  };

  const addDocumentPages = async (pdfDoc, documentsObj) => {
    if (!documentsObj) return;
    const items = [];
    const rcItems = [];
    const aadhaarItems = [];
    const insuranceCertificateItems = [];
    const vehicleNOCItems = [];
    const vehicleBuyReceiptItems = [];
    const signedDocBuyItems = [];

    if (documentsObj.vehicleRC) {
      if (documentsObj.vehicleRC.front && documentsObj.vehicleRC.front !== null)
        rcItems.push({
          title: "Vehicle RC - Front",
          url: documentsObj.vehicleRC.front,
        });
      if (documentsObj.vehicleRC.back && documentsObj.vehicleRC.back !== null)
        rcItems.push({
          title: "Vehicle RC - Back",
          url: documentsObj.vehicleRC.back,
        });
    }

    const singleAadhaarItem = [];
    if (documentsObj.aadhaar) {
      const uploadMode = documentsObj.aadhaarUploadMode || "separate";

      if (uploadMode === "single") {
        if (documentsObj.aadhaar.front) {
          singleAadhaarItem.push({
            title: "Aadhaar (Front and Back)",
            url: documentsObj.aadhaar.front,
          });
        }
      } else {
        if (documentsObj.aadhaar.front && documentsObj.aadhaar.front !== null) {
          aadhaarItems.push({
            title: "Aadhaar - Front",
            url: documentsObj.aadhaar.front,
          });
        }

        if (
          documentsObj.aadhaar.back &&
          documentsObj.aadhaar.back !== null &&
          documentsObj.aadhaar.back !== documentsObj.aadhaar.front
        ) {
          aadhaarItems.push({
            title: "Aadhaar - Back",
            url: documentsObj.aadhaar.back,
          });
        }
      }
    }

    if (documentsObj.insuranceCertificate) {
      if (Array.isArray(documentsObj.insuranceCertificate.pages)) {
        documentsObj.insuranceCertificate.pages.forEach((p, idx) =>
          insuranceCertificateItems.push({
            title: `Insurance Certificate ${idx + 1}`,
            url: p,
          }),
        );
      } else if (Array.isArray(documentsObj.insuranceCertificate)) {
        documentsObj.insuranceCertificate.forEach((p, idx) =>
          insuranceCertificateItems.push({
            title: `Insurance Certificate ${idx + 1}`,
            url: p,
          }),
        );
      }
    }

    if (documentsObj.vehicleNOC) {
      if (Array.isArray(documentsObj.vehicleNOC.pages)) {
        documentsObj.vehicleNOC.pages.forEach((p, idx) =>
          vehicleNOCItems.push({ title: `Vehicle NOC ${idx + 1}`, url: p }),
        );
      } else if (Array.isArray(documentsObj.vehicleNOC)) {
        documentsObj.vehicleNOC.forEach((p, idx) =>
          vehicleNOCItems.push({ title: `Vehicle NOC ${idx + 1}`, url: p }),
        );
      }
    }

    if (documentsObj.vehicleBuyReceipt) {
      if (Array.isArray(documentsObj.vehicleBuyReceipt.pages)) {
        documentsObj.vehicleBuyReceipt.pages.forEach((p, idx) =>
          vehicleBuyReceiptItems.push({
            title: `Vehicle Buy Receipt ${idx + 1}`,
            url: p,
          }),
        );
      } else if (Array.isArray(documentsObj.vehicleBuyReceipt)) {
        documentsObj.vehicleBuyReceipt.forEach((p, idx) =>
          vehicleBuyReceiptItems.push({
            title: `Vehicle Buy Receipt ${idx + 1}`,
            url: p,
          }),
        );
      }
    }
    if (documentsObj.pan && documentsObj.pan !== null)
      items.push({ title: "PAN Card", url: documentsObj.pan });
    if (documentsObj.signedDocBuy && documentsObj.signedDocBuy !== null)
      signedDocBuyItems.push({
        title: "Signed Doc (Buy)",
        url: documentsObj.signedDocBuy,
      });

    const deliveryPhotoUrl =
      (documentsObj.deliveryPhoto &&
        documentsObj.deliveryPhoto !== null &&
        documentsObj.deliveryPhoto) ||
      (documentsObj.vehicleKM &&
        documentsObj.vehicleKM !== null &&
        documentsObj.vehicleKM) ||
      null;
    if (documentsObj.vehiclePhotos && documentsObj.vehiclePhotos.length) {
      documentsObj.vehiclePhotos.forEach((u, i) =>
        items.push({ title: `Vehicle Photo ${i + 1}`, url: u }),
      );
    }
    const renderTwoColumnPage = async (pageItems, pageTitle = null) => {
      const page = pdfDoc.addPage([595, 842]);
      await drawHeaderFooter(pdfDoc, page);
      const margin = 0;
      const colWidth = (595 - 2 * 10) / 2;
      const colGap = margin;
      const maxHeight = 250;

      for (let i = 0; i < pageItems.length; i++) {
        const item = pageItems[i];
        const xPos = 10 + i * (colWidth + colGap);
        const yTop = 700;
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(item.title, {
          x: xPos,
          y: yTop,
          size: 10,
          font: titleFont,
        });

        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (asset) {
          let drawW, drawH;
          let width, height;
          if (asset.kind === "image") {
            const dims = asset.embedded.scale(1);
            width = dims.width;
            height = dims.height;
          } else {
            const p = asset.embeddedPage;
            width = p.width || p.getWidth?.() || 595;
            height = p.height || p.getHeight?.() || 842;
          }

          drawW = colWidth - 20;
          drawH = (height / width) * drawW;

          if (drawH > maxHeight) {
            drawH = maxHeight;
            drawW = (width / height) * drawH;
          }

          const centeredX = xPos + (colWidth - drawW) / 2;
          const drawY = yTop - drawH - 15;

          if (asset.kind === "image") {
            page.drawImage(asset.embedded, {
              x: centeredX,
              y: drawY,
              width: drawW,
              height: drawH,
            });
          } else {
            try {
              page.drawPage(asset.embeddedPage, {
                x: centeredX,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            } catch (e) {}
          }
        }
      }
    };

    const renderSingleImagePerPage = async (pageItems) => {
      for (const item of pageItems) {
        const page = pdfDoc.addPage([595, 842]);
        await drawHeaderFooter(pdfDoc, page);

        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const titleY = 700;
        page.drawText(item.title, {
          x: 50,
          y: titleY,
          size: 12,
          font: titleFont,
        });

        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (!asset) continue;

        const pageWidth = 595;
        const margin = 50;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = 660;

        if (asset.kind === "image") {
          const embedded = asset.embedded;
          const { width, height } = embedded.scale(1);
          let drawW = maxWidth;
          let drawH = (height / width) * drawW;

          if (drawH > maxHeight) {
            drawH = maxHeight;
            drawW = (width / height) * drawH;
          }

          const xPos = (pageWidth - drawW) / 2;
          const yPos = titleY - drawH - 15;

          page.drawImage(embedded, {
            x: xPos,
            y: yPos,
            width: drawW,
            height: drawH,
          });
        } else if (asset.kind === "pdf") {
          const embeddedPage = asset.embeddedPage;
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
          const yPos = titleY - drawH - 15;

          try {
            page.drawPage(embeddedPage, {
              x: xPos,
              y: yPos,
              width: drawW,
              height: drawH,
            });
          } catch (err) {
            try {
              const asImage = await pdfDoc.embedJpg(
                await fetch(item.url).then((r) => r.arrayBuffer()),
              );
              page.drawImage(asImage, {
                x: xPos,
                y: yPos,
                width: drawW,
                height: drawH,
              });
            } catch (err2) {
              console.warn(
                "Failed to draw embedded PDF page for",
                item.url,
                err2,
              );
            }
          }
        }
      }
    };

    if (rcItems.length > 0) {
      await renderTwoColumnPage(rcItems);
    }

    if (singleAadhaarItem.length > 0) {
      const page = pdfDoc.addPage([595, 842]);
      await drawHeaderFooter(pdfDoc, page);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const item = singleAadhaarItem[0];

      page.drawText(item.title, { x: 50, y: 720, size: 14, font });

      const asset = await embedAssetFromUrl(pdfDoc, item.url);
      if (asset) {
        const pageWidth = 595;
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = 660;

        let width, height;
        if (asset.kind === "image") {
          const dims = asset.embedded.scale(1);
          width = dims.width;
          height = dims.height;
        } else {
          const p = asset.embeddedPage;
          width = p.width || p.getWidth?.() || 595;
          height = p.height || p.getHeight?.() || 842;
        }

        let drawW = maxWidth;
        let drawH = (height / width) * drawW;

        if (drawH > maxHeight) {
          drawH = maxHeight;
          drawW = (width / height) * drawH;
        }

        const xPos = (pageWidth - drawW) / 2;
        const yPos = 690 - drawH;

        if (asset.kind === "image") {
          page.drawImage(asset.embedded, {
            x: xPos,
            y: yPos,
            width: drawW,
            height: drawH,
          });
        } else {
          try {
            page.drawPage(asset.embeddedPage, {
              x: xPos,
              y: yPos,
              width: drawW,
              height: drawH,
            });
          } catch (e) {}
        }
      }
    } else if (aadhaarItems.length > 0) {
      await renderTwoColumnPage(aadhaarItems);
    }

    if (insuranceCertificateItems.length > 0) {
      await renderSingleImagePerPage(insuranceCertificateItems);
    }
    if (vehicleNOCItems.length > 0) {
      await renderSingleImagePerPage(vehicleNOCItems);
    }
    if (vehicleBuyReceiptItems.length > 0) {
      await renderSingleImagePerPage(vehicleBuyReceiptItems);
    }

    if (signedDocBuyItems.length > 0) {
      await renderSingleImagePerPage(signedDocBuyItems);
    }

    if (deliveryPhotoUrl) {
      await renderSingleImagePerPage([
        { title: "Delivery Photo", url: deliveryPhotoUrl },
      ]);
    }

    for (let i = 0; i < items.length; i += 2) {
      const page = pdfDoc.addPage([595, 842]);
      await drawHeaderFooter(pdfDoc, page);
      const yPositions = [740, 390];

      for (let cell = 0; cell < 2; cell++) {
        const item = items[i + cell];
        if (!item) continue;

        const x = 50;
        const yTop = yPositions[cell];

        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(item.title, { x, y: yTop, size: 12, font: titleFont });
        const asset = await embedAssetFromUrl(pdfDoc, item.url);
        if (asset) {
          const cellMaxW = 500;
          const cellMaxH = 320;

          let width, height;
          if (asset.kind === "image") {
            const dims = asset.embedded.scale(1);
            width = dims.width;
            height = dims.height;
          } else {
            const p = asset.embeddedPage;
            width = p.width || p.getWidth?.() || 595;
            height = p.height || p.getHeight?.() || 842;
          }

          let drawW = cellMaxW;
          let drawH = (height / width) * drawW;
          if (drawH > cellMaxH) {
            drawH = cellMaxH;
            drawW = (width / height) * drawH;
          }
          const drawY = yTop - drawH - 10;

          if (asset.kind === "image") {
            page.drawImage(asset.embedded, {
              x,
              y: drawY,
              width: drawW,
              height: drawH,
            });
          } else {
            try {
              page.drawPage(asset.embeddedPage, {
                x,
                y: drawY,
                width: drawW,
                height: drawH,
              });
            } catch (e) {}
          }
        }
      }
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

  const formatTimeFromDate = (dateObj) => {
    if (!dateObj) return "";
    try {
      const date = new Date(dateObj);
      if (isNaN(date.getTime())) return "";
      
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      
      const formattedHours = String(hours).padStart(2, "0");
      const formattedMinutes = String(minutes).padStart(2, "0");
      
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch (e) {
      return "";
    }
  };

  const filteredLetters = buyLetters.filter((letter) => {
    const q = String(searchTerm || "").toLowerCase();
    const matchesSearch =
      !q ||
      (letter.sellerName || "").toLowerCase().includes(q) ||
      (letter.buyerName || "").toLowerCase().includes(q) ||
      (letter.registrationNumber || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;

    // Year filter - prefer vehicle.manufacturingYear, fallback to saleDate/createdAt
    const yFilter = filters.year;
    if (yFilter && yFilter.op) {
      // determine year to compare (check multiple vehicle year fields)
      let y = null;
      if (letter.vehicleModel) {
        const parsed = Number(letter.vehicleModel);
        if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) y = parsed;
      }
      if (y === null && letter.vehicle) {
        try {
          // vehicle may be populated object or just an id/string
          if (typeof letter.vehicle === "object") {
            const cand =
              letter.vehicle.manufacturingYear ??
              letter.vehicle.modelYear ??
              letter.vehicle.year ??
              null;
            if (cand !== null && cand !== undefined && cand !== "") {
              const ny = Number(cand);
              if (!isNaN(ny)) y = ny;
            }
          }
        } catch (e) {
          // ignore and fallback
        }
      }
      if (y === null) {
        const d = new Date(letter.saleDate || letter.createdAt || null);
        if (!isNaN(d.getTime())) {
          y = d.getFullYear();
        }
      }
      if (y === null || isNaN(y)) return false;
      const v = Number(yFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (yFilter.op !== "between" && isNaN(v)) return false;
      if (yFilter.op === "eq" && y !== v) return false;
      if (yFilter.op === "gt" && y <= v) return false;
      if (yFilter.op === "lt" && y >= v) return false;
      if (yFilter.op === "between") {
        const v2 = Number(yFilter.value2);
        const hasV1 = !isNaN(v);
        const hasV2 = !isNaN(v2);
        if (!hasV1 && !hasV2) return false;
        if (hasV1 && hasV2) {
          const min = Math.min(v, v2);
          const max = Math.max(v, v2);
          if (y < min || y > max) return false;
        } else if (hasV1) {
          if (y < v) return false;
        } else if (hasV2) {
          if (y > v2) return false;
        }
      }
    }

    // Amount filter
    const aFilter = filters.amount;
    if (aFilter && aFilter.op) {
      const a = Number(letter.saleAmount || letter.saleAmount || 0);
      if (isNaN(a)) return false;
      const v = Number(aFilter.value);
      // require value for non-range ops; for between allow one-sided
      if (aFilter.op !== "between" && isNaN(v)) return false;
      if (aFilter.op === "eq" && a !== v) return false;
      if (aFilter.op === "gt" && a <= v) return false;
      if (aFilter.op === "lt" && a >= v) return false;
      if (aFilter.op === "gte" && a < v) return false;
      if (aFilter.op === "lte" && a > v) return false;
      if (aFilter.op === "between") {
        const v2 = Number(aFilter.value2);
        const hasV1 = !isNaN(v);
        const hasV2 = !isNaN(v2);
        if (!hasV1 && !hasV2) return false;
        if (hasV1 && hasV2) {
          const min = Math.min(v, v2);
          const max = Math.max(v, v2);
          if (a < min || a > max) return false;
        } else if (hasV1) {
          if (a < v) return false;
        } else if (hasV2) {
          if (a > v2) return false;
        }
      }
    }

    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
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
    note: { x: 60, y: 20, size: 10 },
    returnpersonname: { x: 332, y: 298, size: 10 },
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
    note: { x: 60, y: 18, size: 10 },
  };
  const formatIndianAmountInWords = (amount) => {
    if (isNaN(amount)) return "Zero Rupees";

    const num = parseFloat(amount);
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

    const convertLessThanThousand = (num) => {
      if (num === 0) return "";
      if (num < 10) return units[num];
      if (num < 20) return teens[num - 10];
      if (num < 100)
        return (
          tens[Math.floor(num / 10)] +
          (num % 10 !== 0 ? " " + units[num % 10] : "")
        );
      return (
        units[Math.floor(num / 100)] +
        " hundred" +
        (num % 100 !== 0 ? " and " + convertLessThanThousand(num % 100) : "")
      );
    };

    const convert = (num) => {
      if (num === 0) return "Zero Rupees";
      let result = "";
      const crore = Math.floor(num / 10000000);
      if (crore > 0) {
        result += convertLessThanThousand(crore) + " Crore ";
        num %= 10000000;
      }
      const lakh = Math.floor(num / 100000);
      if (lakh > 0) {
        result += convertLessThanThousand(lakh) + " Lakh ";
        num %= 100000;
      }
      const thousand = Math.floor(num / 1000);
      if (thousand > 0) {
        result += convertLessThanThousand(thousand) + " Thousand ";
        num %= 1000;
      }
      const remainder = convertLessThanThousand(num);
      if (remainder) {
        result += remainder;
      }

      return result.trim() + " Only";
    };

    return convert(num);
  };

  const formatRupee = (val) => {
    const num = parseFloat(val);
    return isNaN(num)
      ? "0.00"
      : `Rs. ${new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num)}`;
  };

  const formatKm = (val) => {
    const num = parseFloat(val);
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

  const downloadHindiPDF = async (letter, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();

      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("buyletter.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        const formattedData = {
          ...letter,
          buyerName1: letter.buyerName,
          buyerName2: letter.buyerName,
          sellerName1: letter.sellerName,
          sellerFatherName1: letter.sellerFatherName,
          buyerFatherName1: letter.buyerFatherName,
          buyerCurrentAddress1: letter.buyerCurrentAddress,
          todayDate1: formatDate(letter.todayDate),
          todayTime: formatTime(letter.todayTime),

          todayTime1: formatTime(letter.todayTime),
          buyerCurrentAddress2: "PATNA BIHAR",
          saleDate: formatDate(letter.saleDate),
          saleTime: formatTime(letter.saleTime),
          todayDate: formatDate(letter.todayDate),
          saleAmount: formatRupee(letter.saleAmount),
          vehiclekm: formatKm(letter.vehiclekm),
          amountInWords: formatIndianAmountInWords(letter.saleAmount),
        };

        for (const [fieldName, position] of Object.entries(fieldPositions)) {
          if (formattedData[fieldName]) {
            pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
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

        pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
          x: amountInWordsX,
          y: fieldPositions.saleAmount.y,
          size: fieldPositions.saleAmount.size,
          color: rgb(0, 0, 0),
        });
      } else {
        pdfDoc = await PDFDocument.create();
      }

      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      }

      await addDocumentPages(pdfDoc, documentsToInclude || letter.documents);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg =
        letter.registrationNumber ||
        letter.vehicle?.registrationNumber ||
        letter._id;
      link.setAttribute("download", `OKM-BUY-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadProgress(100);
      setIsDownloading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setAlertInfo({
        isOpen: true,
        message: "Failed to generate PDF. Please try again.",
        type: "error",
      });
      setIsDownloading(false);
    }
  };

  const downloadEnglishPDF = async (letter, documentsToInclude = null) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await simulateProgress();

      let pdfDoc;
      if (documentsToInclude?.letter === true) {
        const existingPdfBytes = await loadPDFTemplate("englishbuyletter.pdf");
        pdfDoc = await PDFDocument.load(existingPdfBytes);

        const formattedData = {
          ...letter,
          buyerName1: letter.buyerName,
          buyerName2: letter.buyerName,
          sellerName1: letter.sellerName,
          sellerFatherName1: letter.sellerFatherName,
          buyerFatherName1: letter.buyerFatherName,
          buyerCurrentAddress1: letter.buyerCurrentAddress,
          todayDate1: formatDate(letter.todayDate),
          todayTime: formatTime(letter.todayTime),
          todayTime1: formatTime(letter.todayTime),
          buyerCurrentAddress2: "PATNA BIHAR",
          saleDate: formatDate(letter.saleDate),
          saleTime: formatTime(letter.saleTime),
          todayDate: formatDate(letter.todayDate),
          saleAmount: formatRupee(letter.saleAmount),
          vehiclekm: formatKm(letter.vehiclekm),
          amountInWords: formatIndianAmountInWords(letter.saleAmount),
        };
        for (const [fieldName, position] of Object.entries(
          englishFieldPositions,
        )) {
          if (formattedData[fieldName]) {
            pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
              x: position.x,
              y: position.y,
              size: position.size,
              color: rgb(0, 0, 0),
            });
          }
        }
        const saleAmountText = formattedData.saleAmount || "";
        const saleAmountWidth =
          saleAmountText.length * (englishFieldPositions.saleAmount.size / 2);
        const amountInWordsX =
          englishFieldPositions.saleAmount.x +
          saleAmountWidth +
          3 * (englishFieldPositions.saleAmount.size / 2);

        pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
          x: amountInWordsX,
          y: englishFieldPositions.saleAmount.y,
          size: englishFieldPositions.saleAmount.size,
          color: rgb(0, 0, 0),
        });
      } else {
        pdfDoc = await PDFDocument.create();
      }

      if (documentsToInclude?.invoice === true) {
        const invoicePage = pdfDoc.addPage([595, 842]);
        await drawVehicleInvoice(invoicePage, pdfDoc, letter);
      }

      await addDocumentPages(pdfDoc, documentsToInclude || letter.documents);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const reg =
        letter.registrationNumber ||
        letter.vehicle?.registrationNumber ||
        letter._id;
      link.setAttribute("download", `OKM-BUY-${reg}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadProgress(100);
      setIsDownloading(false);
    } catch (error) {
      console.error("Error generating English PDF:", error);
      setAlertInfo({
        isOpen: true,
        message: "Failed to generate English PDF. Please try again.",
        type: "error",
      });
      setIsDownloading(false);
    }
  };
  const handleDownload = (letter) => {
    setLanguageAction("download");
    setSelectedLetter(letter);
    setShowLanguageModal(true);
  };

  const handleViewLetter = async (letter, language = "hindi") => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const template =
        language === "english" ? "englishbuyletter.pdf" : "buyletter.pdf";
      const existingPdfBytes = await loadPDFTemplate(template);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const formattedData = {
        ...letter,
        buyerName1: letter.buyerName,
        buyerName2: letter.buyerName,
        sellerName1: letter.sellerName,
        sellerFatherName1: letter.sellerFatherName,
        buyerFatherName1: letter.buyerFatherName,
        buyerCurrentAddress1: letter.buyerCurrentAddress,
        todayDate1: formatDate(letter.todayDate),
        todayTime: formatTime(letter.todayTime),
        todayTime1: formatTime(letter.todayTime),
        buyerCurrentAddress2: "PATNA BIHAR",
        saleDate: formatDate(letter.saleDate),
        saleTime: formatTime(letter.saleTime),
        todayDate: formatDate(letter.todayDate),
        saleAmount: formatRupee(letter.saleAmount),
        vehiclekm: formatKm(letter.vehiclekm),
        amountInWords: formatIndianAmountInWords(letter.saleAmount),
      };

      const positions =
        language === "hindi" ? fieldPositions : englishFieldPositions;
      for (const [fieldName, position] of Object.entries(positions)) {
        if (formattedData[fieldName]) {
          pdfDoc.getPages()[0].drawText(String(formattedData[fieldName]), {
            x: position.x,
            y: position.y,
            size: position.size,
            color: rgb(0, 0, 0),
          });
        }
      }

      const saleAmountText = formattedData.saleAmount || "";
      const saleAmountWidth =
        saleAmountText.length * (positions.saleAmount.size / 2);
      const offsetMultiplier = language === "hindi" ? 1.4 : 3;
      const amountInWordsX =
        positions.saleAmount.x +
        saleAmountWidth +
        offsetMultiplier * (positions.saleAmount.size / 2);

      pdfDoc.getPages()[0].drawText(formattedData.amountInWords, {
        x: amountInWordsX,
        y: positions.saleAmount.y,
        size: positions.saleAmount.size,
        color: rgb(0, 0, 0),
      });

      const invoicePage = pdfDoc.addPage([595, 842]);
      await drawVehicleInvoice(invoicePage, pdfDoc, letter);

      if (letter.documents) {
        await addDocumentPages(pdfDoc, letter.documents);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      clearInterval(progressInterval);
      setDownloadProgress(100);
      setIsDownloading(false);

      setPreviewPdfUrl(url);
      setPreviewLetter(letter);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      setAlertInfo({
        isOpen: true,
        message: "Failed to generate preview. Please try again.",
        type: "error",
      });
      setIsDownloading(false);
    }
  };
  const drawVehicleInvoice = async (page, pdfDoc, letter) => {
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
      y: 740,
      width: 160,
      height: 130,
    });
    page.drawImage(logoImage, {
      x: 280,
      y: 200,
      width: 370,
      height: 300,
      opacity: 0.3,
      rotate: degrees(45),
    });

    page.drawText("UDAYAM-BR-26-0028550", {
      x: 330,
      y: 815,
      size: 14,
      color: rgb(1, 1, 1),
      font: font,
    });
    page.drawText("GSTIN: 22ABCDE1234F1Z5", {
      x: 330,
      y: 795,
      size: 14,
      color: rgb(1, 1, 1),
      font: font,
    });
    try {
      page.drawText(
        "123 Main Street, Patna, Bihar - 800001 | Phone: 9876543210 | GSTIN: 22ABCDE1234F1Z5",
        { x: 50, y: 28, size: 8, color: rgb(1, 1, 1), font },
      );
    } catch (e) {}
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
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}`;

    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: 50,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Date: ${formatDate(letter.todayDate)}`, {
      x: 400,
      y: 720,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`Time: ${formatTime(letter.saleTime)}`, {
      x: 450,
      y: 700,
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

    page.drawText(`Name: ${letter.sellerName || "N/A"}`, {
      x: 60,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    const address = letter.sellerCurrentAddress || "N/A";
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
    page.drawText(`Phone: ${letter.selleraadharphone || "N/A"}`, {
      x: 350,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });
    page.drawText(`, ${letter.selleraadharphone2 || "N/A"}`, {
      x: 440,
      y: 665,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Aadhar: ${formatAadhar(letter.selleraadhar) || "N/A"}`, {
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
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText("Condition: " + (letter.vehicleCondition || "N/A"), {
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
    const vehicleHeaderPositions = [60, 120, 180, 220, 280, 370, 460];

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
      letter.vehicleName || "N/A",
      letter.vehicleModel || "N/A",
      letter.vehicleColor || "N/A",
      letter.registrationNumber || "N/A",
      letter.chassisNumber || "N/A",
      letter.engineNumber || "N/A",
      letter.vehiclekm ? `${formatKm(letter.vehiclekm)} km` : "N/A",
    ];

    const columnWidths = [60, 60, 40, 60, 80, 80, 40, 60];

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

    page.drawText(`Buy Date: ${formatDate(letter.saleDate)}`, {
      x: 60,
      y: 490,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(`Buy Amount: ${formatRupee(letter.saleAmount)}`, {
      x: 200,
      y: 490,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: font,
    });

    page.drawText(
      `Payment: ${
        letter.paymentMethod ? letter.paymentMethod.toUpperCase() : "CASH"
      }`,
      {
        x: 350,
        y: 490,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: font,
      },
    );
    page.drawText(
      `Amount in Words: ${formatIndianAmountInWords(letter.saleAmount)}`,
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
        letter.saleAmount,
      )} to ${letter.sellerName}.`,
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
      y: 120,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 60, y: 115 },
      end: { x: 250, y: 115 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("Authorized Signatory", {
      x: 350,
      y: 120,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: font,
    });

    page.drawLine({
      start: { x: 310, y: 115 },
      end: { x: 500, y: 115 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawLine({
      start: { x: 50, y: 70 },
      end: { x: 545, y: 70 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your business!", {
      x: 220,
      y: 50,
      size: 12,
      color: rgb(0.047, 0.098, 0.196),
      font: boldFont,
    });

    page.drawText(
      "OK MOTORS | Pillar num.53, Bailey Rd,  Raja Bazar,  Patna, Bihar 800014",
      {
        x: 130,
        y: 30,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: font,
      },
    );
  };

  const handleDelete = (id) => {
    setConfirmTargetId(id);
    setConfirmTargetType("buyLetter");
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    const id = confirmTargetId;
    try {
      const token = localStorage.getItem("token");
      const isOnline = navigator.onLine;

      if (isOnline) {
        if (!token) {
          setAlertInfo({
            isOpen: true,
            message: "You are not authenticated. Please login again.",
            type: "error",
          });
          logout();
          navigate("/login");
          return;
        }

        await axios.delete(
          `https://ok-motor-51l3.vercel.app/api/buy-letter/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setBuyLetters((prev) => prev.filter((letter) => letter._id !== id));
        setAlertInfo({
          isOpen: true,
          message: "Buy letter deleted successfully!",
          type: "success",
        });
      } else {
        const offlineStorage = (await import("../services/offlineStorage"))
          .default;
        const result = await offlineStorage.deleteById("buyLetters", id);

        if (result.success) {
          setBuyLetters((prev) => prev.filter((letter) => letter._id !== id));
          setAlertInfo({
            isOpen: true,
            message:
              "Buy letter deleted from offline storage. Will sync when online.",
            type: "info",
          });
        } else {
          throw new Error(
            result.error || "Failed to delete from offline storage",
          );
        }
      }
    } catch (error) {
      console.error("Error deleting buy letter:", error);

      if (error.response?.status === 401) {
        setAlertInfo({
          isOpen: true,
          message: "Your session has expired. Please login again.",
          type: "error",
        });
        logout();
        navigate("/login");
      } else if (error.response?.status === 403) {
        setAlertInfo({
          isOpen: true,
          message: "You don't have permission to delete this item.",
          type: "error",
        });
      } else {
        setAlertInfo({
          isOpen: true,
          message: `Failed to delete: ${
            error.response?.data?.message || error.message || "Unknown error"
          }`,
          type: "error",
        });
      }
    } finally {
      setConfirmOpen(false);
      setConfirmTargetId(null);
      setConfirmTargetType(null);
    }
  };

  const handleEdit = (letter) => {
    navigate("/buy/create", { state: { editLetter: letter } });
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
      <ConfirmModal
        isOpen={confirmOpen}
        title={
          confirmTargetType === "buyLetter"
            ? "Delete Buy Letter"
            : "Confirm Delete"
        }
        message="Are you sure you want to delete this buy letter? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
          setConfirmTargetType(null);
        }}
      />
      <AppSidebar user={user} onLogout={handleLogout} />
      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })}
        message={alertInfo.message}
        type={alertInfo.type}
      />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Buy Letter History</h1>
            <p style={styles.pageSubtitle}>
              View and manage all your generated buy letters
            </p>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search buy letters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <p>Loading...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No buy letters found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              {!isMobile && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Seller Name</th>
                        <th style={styles.tableHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>Year</span>
                            <TableFilter
                              type="number"
                              placeholder="YYYY"
                              rangeOnly={true}
                              onApply={(f) =>
                                setFilters((p) => ({ ...p, year: f }))
                              }
                              onClear={() =>
                                setFilters((p) => ({ ...p, year: null }))
                              }
                            />
                          </div>
                        </th>
                        <th style={styles.tableHeader}>Vehicle</th>
                        <th style={styles.tableHeader}>Veh. Reg No</th>
                        <th style={styles.tableHeader}>Buyer Name</th>
                        <th style={styles.tableHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span>Amount</span>
                            <TableFilter
                              type="number"
                              placeholder="₹"
                              rangeOnly={true}
                              onApply={(f) =>
                                setFilters((p) => ({ ...p, amount: f }))
                              }
                              onClear={() =>
                                setFilters((p) => ({ ...p, amount: null }))
                              }
                            />
                          </div>
                        </th>
                        <th style={styles.tableHeader}>Date</th>
                        <th style={styles.tableHeader}>Create By</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLetters.map((letter) => {
                        const changes = getChanges(letter);
                        return (
                          <React.Fragment key={letter._id}>
                            <tr style={styles.tableRow}>
                              <td style={styles.tableCell}>
                                {letter.sellerName}
                                {letter.version > 1 && (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#ff9800",
                                      marginLeft: "6px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    (v{letter.version})
                                  </span>
                                )}
                              </td>
                              <td style={styles.tableCell}>
                                {letter.vehicleModel}
                              </td>
                              <td style={styles.tableCell}>
                                {`${letter.vehicleName || ""} ${
                                  letter.vehicleModel || ""
                                }`.trim()}
                              </td>
                              <td style={styles.tableCell}>
                                {letter.registrationNumber}
                              </td>
                              <td style={styles.tableCell}>
                                {letter.buyerName}
                              </td>
                              <td style={styles.tableCell}>
                                ₹
                                {new Intl.NumberFormat("en-IN").format(
                                  letter.saleAmount,
                                )}
                              </td>
                              <td style={styles.tableCell}>
                                <div>
                                  <div>
                                    Created:{" "}
                                    {letter.saleDate
                                      ? formatDate(letter.saleDate)
                                      : formatDate(letter.createdAt)}
                                  </div>
                                  {letter.editedAt && (
                                    <div
                                      style={{
                                        color: "#64748b",
                                        fontSize: "0.9em",
                                        marginTop: "4px",
                                      }}
                                    >
                                      Edited: {formatDate(letter.editedAt)}
                                      {letter.editedAt && ` at ${formatTimeFromDate(letter.editedAt)}`}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={styles.tableCell}>
                                {letter.user && letter.user.role === "admin"
                                  ? "admin"
                                  : letter.user && letter.user.name
                                    ? letter.user.name
                                    : ""}
                              </td>
                              <td style={styles.tableCell}>
                                <button
                                  onClick={() => {
                                    setLanguageAction("preview");
                                    setSelectedLetter(letter);
                                    setShowLanguageModal(true);
                                  }}
                                  style={styles.iconButton}
                                  title="View"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownload(letter)}
                                  style={styles.iconButton}
                                  title="Download"
                                >
                                  <Download size={16} />
                                </button>
                                {}
                                {user?.role !== "staff" && (
                                  <>
                                    <button
                                      onClick={() => handleEdit(letter)}
                                      style={styles.iconButton}
                                      title="Edit"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(letter._id)}
                                      style={styles.iconButton}
                                      title="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                            {letter.version > 1 && (
                              <tr
                                style={{
                                  backgroundColor:
                                    changes && changes.length > 0
                                      ? "#fff8e1"
                                      : "#f5f5f5",
                                }}
                              >
                                <td
                                  colSpan="9"
                                  style={{
                                    padding: "12px 16px",
                                    borderBottom: "1px solid #e2e8f0",
                                  }}
                                >
                                  <div style={{ fontSize: "0.85rem" }}>
                                    <div
                                      style={{
                                        fontWeight: "600",
                                        color:
                                          changes && changes.length > 0
                                            ? "#f57c00"
                                            : "#757575",
                                        marginBottom: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <RefreshCw size={14} />
                                      Changes from previous version:
                                    </div>
                                    {changes && changes.length > 0 ? (
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "repeat(auto-fit, minmax(300px, 1fr))",
                                          gap: "8px",
                                        }}
                                      >
                                        {changes.map((change, idx) => (
                                          <div
                                            key={idx}
                                            style={{
                                              padding: "6px 10px",
                                              backgroundColor: "#ffffff",
                                              borderRadius: "4px",
                                              border: "1px solid #ffe0b2",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontWeight: "600",
                                                color: "#424242",
                                                marginBottom: "3px",
                                              }}
                                            >
                                              {change.field}:
                                            </div>
                                            <div
                                              style={{
                                                fontSize: "0.8rem",
                                                color: "#e53935",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  textDecoration:
                                                    "line-through",
                                                }}
                                              >
                                                {change.oldValue}
                                              </span>
                                            </div>
                                            <div
                                              style={{
                                                fontSize: "0.8rem",
                                                color: "#43a047",
                                                fontWeight: "500",
                                              }}
                                            >
                                              → {change.newValue}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          padding: "8px 12px",
                                          backgroundColor: "#ffffff",
                                          borderRadius: "4px",
                                          border: "1px solid #e0e0e0",
                                          color: "#757575",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        No changes detected from previous
                                        version
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Cards */}
              {isMobile && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {filteredLetters.map((letter) => {
                    const changes = getChanges(letter);
                    return (
                      <div
                        key={letter._id}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {/* Card Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "1rem",
                                color: "#1e293b",
                              }}
                            >
                              {letter.registrationNumber}
                              {letter.version > 1 && (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#ff9800",
                                    marginLeft: "6px",
                                    fontWeight: "600",
                                  }}
                                >
                                  (v{letter.version})
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              {letter.saleDate
                                ? formatDate(letter.saleDate)
                                : formatDate(letter.createdAt)}
                            </div>
                          </div>
                          <div
                            style={{
                              backgroundColor: "rgba(8,131,149,0.1)",
                              color: "#071952",
                              borderRadius: "20px",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            Buy Letter
                          </div>
                        </div>

                        {/* Card Details */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: "500",
                              }}
                            >
                              Seller
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#1e293b",
                                fontWeight: "600",
                                textAlign: "right",
                                maxWidth: "60%",
                              }}
                            >
                              {letter.sellerName}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: "500",
                              }}
                            >
                              Buyer
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#1e293b",
                                fontWeight: "600",
                                textAlign: "right",
                                maxWidth: "60%",
                              }}
                            >
                              {letter.buyerName}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: "500",
                              }}
                            >
                              Vehicle
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#1e293b",
                                fontWeight: "600",
                                textAlign: "right",
                                maxWidth: "60%",
                              }}
                            >
                              {`${letter.vehicleName || ""} ${letter.vehicleModel || ""}`.trim()}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: "500",
                              }}
                            >
                              Amount
                            </span>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                color: "#071952",
                                fontWeight: "700",
                              }}
                            >
                              ₹
                              {new Intl.NumberFormat("en-IN").format(
                                letter.saleAmount,
                              )}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#64748b",
                                fontWeight: "500",
                              }}
                            >
                              Created By
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#1e293b",
                                fontWeight: "600",
                              }}
                            >
                              {letter.user && letter.user.role === "admin"
                                ? "admin"
                                : letter.user?.name || ""}
                            </span>
                          </div>
                          {letter.editedAt && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#64748b",
                                  fontWeight: "500",
                                }}
                              >
                                Edited
                              </span>
                              <span
                                style={{ fontSize: "0.8rem", color: "#64748b" }}
                              >
                                {formatDate(letter.editedAt)}
                                {letter.editedAt &&
                                  ` at ${formatTimeFromDate(letter.editedAt)}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Version changes */}
                        {letter.version > 1 &&
                          changes &&
                          changes.length > 0 && (
                            <div
                              style={{
                                backgroundColor: "#fff8e1",
                                borderRadius: "8px",
                                padding: "10px",
                                marginBottom: "10px",
                                border: "1px solid #ffe0b2",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: "600",
                                  color: "#f57c00",
                                  fontSize: "0.78rem",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <RefreshCw size={12} /> Changes from previous
                                version:
                              </div>
                              {changes.map((change, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    fontSize: "0.75rem",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "600",
                                      color: "#424242",
                                    }}
                                  >
                                    {change.field}:{" "}
                                  </span>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#e53935",
                                    }}
                                  >
                                    {change.oldValue}
                                  </span>
                                  <span
                                    style={{
                                      color: "#43a047",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {" "}
                                    → {change.newValue}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: "12px",
                          }}
                        >
                          <button
                            onClick={() => {
                              setLanguageAction("preview");
                              setSelectedLetter(letter);
                              setShowLanguageModal(true);
                            }}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "8px",
                              backgroundColor: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#1e293b",
                              fontWeight: "500",
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => handleDownload(letter)}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "8px",
                              backgroundColor: "#071952",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#ffffff",
                              fontWeight: "500",
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                          {user?.role !== "staff" && (
                            <>
                              <button
                                onClick={() => handleEdit(letter)}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  padding: "8px",
                                  backgroundColor: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontSize: "0.78rem",
                                  color: "#1e293b",
                                  fontWeight: "500",
                                }}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(letter._id)}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  padding: "8px",
                                  backgroundColor: "#fee2e2",
                                  border: "none",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontSize: "0.78rem",
                                  color: "#991b1b",
                                  fontWeight: "500",
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
      {showLanguageModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h2 style={modalStyles.title}>Select PDF Language</h2>
              <button
                onClick={() => setShowLanguageModal(false)}
                style={modalStyles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <p style={{ marginBottom: "24px", color: "#64748b" }}>
                Choose the language for your buy letter:
              </p>
              <div
                style={{ display: "flex", gap: "16px", marginBottom: "24px" }}
              >
                <button
                  onClick={() => {
                    setChosenLanguage("english");
                    setShowLanguageModal(false);
                    if (languageAction === "download") {
                      setDocSelections({
                        vehicleRC: !!selectedLetter.documents?.vehicleRC,
                        aadhaar: !!selectedLetter.documents?.aadhaar,
                        pan: !!selectedLetter.documents?.pan,
                        vehicleKM: !!(
                          selectedLetter.documents?.deliveryPhoto ||
                          selectedLetter.documents?.vehicleKM
                        ),
                        vehiclePhotos: !!(
                          selectedLetter.documents?.vehiclePhotos &&
                          selectedLetter.documents.vehiclePhotos.length
                        ),
                      });
                      setShowDocumentModal(true);
                    } else if (languageAction === "preview") {
                      handleViewLetter(selectedLetter, "english");
                      setLanguageAction(null);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#088395",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    ":hover": {
                      backgroundColor: "#2563eb",
                    },
                  }}
                >
                  English PDF
                </button>
                <button
                  onClick={() => {
                    setChosenLanguage("hindi");
                    setShowLanguageModal(false);
                    if (languageAction === "download") {
                      setDocSelections({
                        vehicleRC: !!selectedLetter.documents?.vehicleRC,
                        aadhaar: !!selectedLetter.documents?.aadhaar,
                        pan: !!selectedLetter.documents?.pan,
                        vehicleKM: !!(
                          selectedLetter.documents?.deliveryPhoto ||
                          selectedLetter.documents?.vehicleKM
                        ),
                        vehiclePhotos: !!(
                          selectedLetter.documents?.vehiclePhotos &&
                          selectedLetter.documents.vehiclePhotos.length
                        ),
                      });
                      setShowDocumentModal(true);
                    } else if (languageAction === "preview") {
                      handleViewLetter(selectedLetter, "hindi");
                      setLanguageAction(null);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#37B7C3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    ":hover": {
                      backgroundColor: "#2563eb",
                    },
                  }}
                >
                  Hindi PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDocumentModal && selectedLetter && (
        <div style={modalStyles.overlay}>
          <div
            style={{
              ...modalStyles.modal,
              maxWidth: "500px",
              padding: 0,
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                Select Items to Include
              </h3>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                Choose which items to include in the PDF
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Main Documents
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    marginBottom: "8px",
                    backgroundColor: docSelections.letter
                      ? "#f0f9ff"
                      : "transparent",
                    border: `2px solid ${docSelections.letter ? "#0284c7" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!docSelections.letter}
                    onChange={(e) =>
                      setDocSelections((s) => ({
                        ...s,
                        letter: e.target.checked,
                      }))
                    }
                    style={{
                      width: "18px",
                      height: "18px",
                      marginRight: "12px",
                      accentColor: "#0284c7",
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1e293b",
                    }}
                  >
                    Buy Letter
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    marginBottom: "8px",
                    backgroundColor: docSelections.invoice
                      ? "#f0f9ff"
                      : "transparent",
                    border: `2px solid ${docSelections.invoice ? "#0284c7" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!docSelections.invoice}
                    onChange={(e) =>
                      setDocSelections((s) => ({
                        ...s,
                        invoice: e.target.checked,
                      }))
                    }
                    style={{
                      width: "18px",
                      height: "18px",
                      marginRight: "12px",
                      accentColor: "#0284c7",
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1e293b",
                    }}
                  >
                    Invoice
                  </span>
                </label>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Supporting Documents
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.vehicleRC
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehicleRC ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehicleRC}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehicleRC: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle RC (Front/Back)
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.aadhaar
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.aadhaar ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.aadhaar}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          aadhaar: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Aadhaar (Front/Back)
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.pan
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.pan ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.pan}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          pan: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      PAN Card
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.vehicleKM
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehicleKM ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehicleKM}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehicleKM: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle KM Photo
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.vehiclePhotos
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehiclePhotos ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehiclePhotos}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehiclePhotos: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle Photos
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.insuranceCertificate
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.insuranceCertificate ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.insuranceCertificate}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          insuranceCertificate: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Insurance Certificate
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.vehicleNOC
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehicleNOC ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehicleNOC}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehicleNOC: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle NOC
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      backgroundColor: docSelections.vehicleBuyReceipt
                        ? "#f0f9ff"
                        : "transparent",
                      border: `2px solid ${docSelections.vehicleBuyReceipt ? "#0284c7" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!docSelections.vehicleBuyReceipt}
                      onChange={(e) =>
                        setDocSelections((s) => ({
                          ...s,
                          vehicleBuyReceipt: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      Vehicle Buy Receipt
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setShowDocumentModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => {
                  const buildFilteredDocs = (docs = {}, sel = {}) => {
                    const out = {
                      letter: sel.letter,
                      invoice: sel.invoice,
                    };
                    if (sel.vehicleRC && docs.vehicleRC)
                      out.vehicleRC = docs.vehicleRC;
                    if (sel.aadhaar && docs.aadhaar) {
                      out.aadhaar = docs.aadhaar;
                      out.aadhaarUploadMode = docs.aadhaarUploadMode;
                    }
                    if (sel.pan && docs.pan) out.pan = docs.pan;
                    if (sel.vehicleKM && (docs.deliveryPhoto || docs.vehicleKM))
                      out.deliveryPhoto = docs.deliveryPhoto || docs.vehicleKM;
                    if (sel.vehiclePhotos && docs.vehiclePhotos)
                      out.vehiclePhotos = docs.vehiclePhotos;
                    if (sel.insuranceCertificate && docs.insuranceCertificate)
                      out.insuranceCertificate = docs.insuranceCertificate;
                    if (sel.vehicleNOC && docs.vehicleNOC)
                      out.vehicleNOC = docs.vehicleNOC;
                    if (sel.vehicleBuyReceipt && docs.vehicleBuyReceipt)
                      out.vehicleBuyReceipt = docs.vehicleBuyReceipt;
                    return out;
                  };

                  const filtered = buildFilteredDocs(
                    selectedLetter.documents,
                    docSelections,
                  );

                  setShowDocumentModal(false);
                  if (chosenLanguage === "hindi") {
                    downloadHindiPDF(selectedLetter, filtered);
                  } else {
                    downloadEnglishPDF(selectedLetter, filtered);
                  }
                }}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {isDownloading && (
        <DownloadProgressModal
          progress={downloadProgress}
          onClose={() => setIsDownloading(false)}
        />
      )}
      {showPreviewModal && previewLetter && previewPdfUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => {
            setShowPreviewModal(false);
            if (previewPdfUrl) {
              URL.revokeObjectURL(previewPdfUrl);
              setPreviewPdfUrl(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              maxWidth: isMobile ? "95vw" : "1400px",
              width: "100%",
              height: isMobile ? "85vh" : "90vh",
              maxHeight: isMobile ? "85vh" : "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={24} color="#088395" />
                Buy Letter Preview
              </h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
                backgroundColor: "#525659",
              }}
            >
              {isMobile ? (
                <PdfPreview pdfUrl={previewPdfUrl} />
              ) : (
                <object
                  data={previewPdfUrl}
                  type="application/pdf"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                  aria-label="Buy Letter PDF Preview"
                >
                  <iframe
                    src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="Buy Letter PDF Preview"
                  />
                </object>
              )}
            </div>
            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                backgroundColor: "#f8fafc",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            >
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
    padding: "10px 12px 10px 40px",
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
  newLetterButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  },
  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    color: "#64748b",
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
    color: "#1e293b",
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
    color: "#000000ff",
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
      color: "#088395",
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
    color: "#1e293b",
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
      color: "#1e293b",
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
    color: "#1e293b",
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
      borderColor: "#088395",
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
    backgroundColor: "#088395",
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
    color: "#1e293b",
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

export default BuyLetterHistory;
