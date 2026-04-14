import React, { useState, useContext, useEffect } from "react";
import { saveAs } from "file-saver";
import axios from "axios";
import {
  FileText,
  Download,
  Calendar,
  Type,
  AlignLeft,
  X,
  Edit,
  Trash2,
  Eye,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
import pdfService from "../services/pdfService";
import PdfPreview from "./PdfPreview";

const LetterHeadForm = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [isPreviewFromHistory, setIsPreviewFromHistory] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    to: "",
    recipientName: "",
    subject: "",
    message: "",
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const API_BASE_URL = "https://ok-motor-backend.vercel.app/api";

  const handleEdit = (letter) => {
    const safeDate = letter?.date
      ? new Date(letter.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setFormData({
      date: safeDate,
      to: letter.to,
      recipientName: letter.recipientName || "",
      subject: letter.subject,
      message: letter.message,
    });
    setEditingId(letter._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      to: "",
      recipientName: "",
      subject: "",
      message: "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this letter head?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/letter-heads/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHistory();
    } catch (error) {
      console.error("Error deleting letter head:", error);
      alert("Failed to delete letter head");
    }
  };

  const handleShowPreview = async () => {
    if (!formData.to || !formData.subject || !formData.message) {
      alert("Please fill in all required fields (To, Subject, Message)");
      return;
    }

    const sanitize = (str) =>
      typeof str === "string" ? str.replace(/\t/g, " ") : str;

    const sanitizedData = {
      ...formData,
      to: sanitize(formData.to),
      recipientName: sanitize(formData.recipientName),
      subject: sanitize(formData.subject),
      message: sanitize(formData.message),
    };

    try {
      const result = await pdfService.generateLetterHeadPDF(
        {
          ...sanitizedData,
          user: user,
        },
        true,
      );

      if (result.success) {
        const pdfUrl = URL.createObjectURL(result.blob);
        setIsPreviewFromHistory(false);
        setPreviewPdfUrl(pdfUrl);
        setPreviewData(sanitizedData);
        setShowPreviewModal(true);
      } else {
        alert(
          "Failed to generate PDF preview: " +
            (result.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview");
    }
  };

  const handleConfirmSaveAndPrint = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setShowPreviewModal(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please login again.");
        logout();
        navigate("/login");
        return;
      }

      if (navigator.onLine) {
        try {
          if (editingId) {
            await axios.put(
              `${API_BASE_URL}/letter-heads/${editingId}`,
              previewData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            );
          } else {
            await axios.post(`${API_BASE_URL}/letter-heads`, previewData, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          }
        } catch (err) {
          console.warn(
            "Failed to save to backend, continuing to PDF generation",
            err,
          );
        }
      }

      const result = await pdfService.generateLetterHeadPDF({
        ...previewData,
        user: user,
      });

      if (result.success) {
        if (result.saved && window.electronAPI) {
          alert(`PDF saved to ${result.savedPath}`);
        } else {
          saveAs(result.blob, `letter-head-${Date.now()}.pdf`);
        }
        await fetchHistory();

        handleCancelEdit();
      } else {
        alert("Failed to generate PDF: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error in Letter Head save/print:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/letter-heads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownloadCopy = async (letter) => {
    try {
      const result = await pdfService.generateLetterHeadPDF({
        ...letter,
        user: user,
      });

      if (result.success) {
        saveAs(
          result.blob,
          `letter-head-${letter.letterNumber || Date.now()}.pdf`,
        );
      } else {
        alert("Failed to generate PDF");
      }
    } catch (error) {
      console.error(error);
      alert("Error downloading copy");
    }
  };

  const handleViewLetter = async (letter) => {
    try {
      const result = await pdfService.generateLetterHeadPDF(
        {
          ...letter,
          user: user,
        },
        true,
      );

      if (result.success) {
        const pdfUrl = URL.createObjectURL(result.blob);
        setIsPreviewFromHistory(true);
        setPreviewPdfUrl(pdfUrl);
        setPreviewData(letter);
        setShowPreviewModal(true);
      } else {
        alert("Failed to generate PDF preview");
      }
    } catch (error) {
      console.error(error);
      alert("Error generating preview");
    }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setIsPreviewFromHistory(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
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
      transition: "transform 0.3s ease-in-out",
    },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 14,
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
      backgroundColor: "#051238",
      overflow: "hidden",
    },
    submenuItem: {
      padding: "10px 24px 10px 64px",
      cursor: "pointer",
      color: "#cbd5e1",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
    },
    submenuItemActive: {
      color: "#37B7C3",
      fontWeight: "500",
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
    },

    mainContent: {
      flex: 1,
      overflowY: "auto",
      height: "100vh",
      backgroundColor: "#ffffffff",
    },
    contentPadding: {
      padding: isMobile ? "24px 16px" : "32px",
      maxWidth: "1200px",
      margin: "0 auto",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "16px",
    },
    titleGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    backButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      border: "1px solid #e2e8f0",
      color: "#64748b",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#0f172a",
      margin: 0,
    },
    formCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      padding: isMobile ? "20px" : "32px",
      marginBottom: "32px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "24px",
      marginBottom: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    inputArgs: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
      color: "#1e293b",
      transition: "border-color 0.2s",
      width: "95%",
    },
    textarea: {
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
      color: "#1e293b",
      minHeight: "300px",
      resize: "vertical",
      lineHeight: "1.6",
      fontFamily: "inherit",
    },
    button: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 24px",
      backgroundColor: "#088395",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      minWidth: "200px",
    },
    buttonDisabled: {
      backgroundColor: "#94a3b8",
      cursor: "not-allowed",
    },

    tableCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      padding: "24px",
      overflowX: "auto",
    },
    tableTitle: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "16px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "600px",
    },
    th: {
      textAlign: "left",
      padding: "12px 16px",
      borderBottom: "2px solid #e2e8f0",
      color: "#475569",
      fontWeight: "600",
      fontSize: "0.875rem",
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #e2e8f0",
      color: "#334155",
      fontSize: "0.875rem",
    },
    actionBtn: {
      padding: "6px 12px",
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      marginRight: "8px",
    },
    deleteBtn: {
      padding: "6px 12px",
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    },
  };

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "60px" : "0",
      }}
    >
      {}
      {isSidebarOpen && isMobile && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {}
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          {}
          <div style={styles.header}>
            <div style={styles.titleGroup}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={24} />
              </div>
              <h1 style={styles.title}>
                {editingId ? "Edit Letter Head" : "Create Letter Head"}
              </h1>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  style={{
                    ...styles.actionBtn,
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    fontSize: "0.875rem",
                    marginLeft: "12px",
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
            <button
              onClick={handleShowPreview}
              disabled={isSaving}
              style={
                isSaving
                  ? { ...styles.button, ...styles.buttonDisabled }
                  : styles.button
              }
            >
              {isSaving ? (
                "Processing..."
              ) : (
                <>
                  <Eye size={20} />
                  Preview & Save
                </>
              )}
            </button>
          </div>

          <div style={styles.formCard}>
            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Calendar size={16} /> Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={styles.inputArgs}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>To (Address/Person)</label>
                <textarea
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  placeholder="e.g. The Manager, SBI Bank, New Delhi..."
                  style={{
                    ...styles.inputArgs,
                    minHeight: "80px",
                    resize: "none",
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Recipient Name (For Signature)
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Name of person signing..."
                  style={styles.inputArgs}
                />
              </div>
            </div>

            <div style={{ ...styles.formGroup, marginBottom: "24px" }}>
              <label style={styles.label}>
                <Type size={16} /> Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject of the letter..."
                style={styles.inputArgs}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <AlignLeft size={16} /> Message Body
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your letter content here..."
                style={styles.textarea}
              />
            </div>
          </div>

          {}
          <div style={styles.tableCard}>
            <h2 style={styles.tableTitle}>Recent Letter Heads</h2>
            {loadingHistory ? (
              <p>Loading history...</p>
            ) : history.length === 0 ? (
              <p style={{ color: "#64748b" }}>No letter heads created yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Letter No</th>
                      <th style={styles.th}>To</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                      )
                      .slice(0, 10)
                      .map((letter) => (
                        <tr key={letter._id}>
                          <td style={styles.td}>
                            {new Date(letter.date).toLocaleDateString("en-IN")}
                          </td>
                          <td style={styles.td}>{letter.letterNumber}</td>
                          <td style={styles.td}>
                            {letter.to.substring(0, 30)}...
                          </td>
                          <td style={styles.td}>
                            {letter.subject.substring(0, 30)}...
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{
                                ...styles.actionBtn,
                                backgroundColor: "#f0f9ff",
                                color: "#0369a1",
                              }}
                              onClick={() => handleViewLetter(letter)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              style={styles.actionBtn}
                              onClick={() => handleDownloadCopy(letter)}
                            >
                              <Download size={14} />
                            </button>
                            <button
                              style={{
                                ...styles.actionBtn,
                                backgroundColor: "#fff7ed",
                                color: "#c2410c",
                              }}
                              onClick={() => handleEdit(letter)}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDelete(letter._id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {showPreviewModal && previewData && previewPdfUrl && (
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
          onClick={closePreviewModal}
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
            {}
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
                Letter Head Preview
              </h2>
              <button
                onClick={closePreviewModal}
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

            {}
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
                  aria-label="Letter Head PDF Preview"
                >
                  <iframe
                    src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                    title="Letter Head PDF Preview"
                  />
                </object>
              )}
            </div>

            {}
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
                onClick={closePreviewModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#fff";
                }}
              >
                {isPreviewFromHistory ? "Close" : "Cancel"}
              </button>
              {!isPreviewFromHistory && (
                <button
                  onClick={handleConfirmSaveAndPrint}
                  disabled={isSaving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    backgroundColor: isSaving ? "#94a3b8" : "#088395",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) e.target.style.backgroundColor = "#076d7d";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) e.target.style.backgroundColor = "#088395";
                  }}
                >
                  {isSaving ? (
                    "Processing..."
                  ) : (
                    <>
                      <Check size={18} />
                      Confirm & Save
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterHeadForm;
