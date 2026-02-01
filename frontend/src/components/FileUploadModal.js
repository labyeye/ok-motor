import React, { useRef } from "react";
import { Camera, Upload, FileText, X } from "lucide-react";

const FileUploadModal = ({ onSelect, onCancel, allowPdf = false }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePdfClick = () => {
    if (pdfInputRef.current) {
      pdfInputRef.current.click();
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file, type);
    }
    e.target.value = null;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Upload Document</h3>
          <button onClick={onCancel} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          <p style={styles.subtitle}>Choose how you want to upload:</p>

          <div style={styles.optionsContainer}>
            {/* Camera Option */}
            <button
              onClick={handleCameraClick}
              style={styles.optionButton}
              type="button"
            >
              <Camera size={48} style={styles.icon} />
              <span style={styles.optionLabel}>Take Photo</span>
              <span style={styles.optionDesc}>Use your device camera</span>
            </button>

            {/* Upload Image Option */}
            <button
              onClick={handleUploadClick}
              style={styles.optionButton}
              type="button"
            >
              <Upload size={48} style={styles.icon} />
              <span style={styles.optionLabel}>Upload Image</span>
              <span style={styles.optionDesc}>
                Choose from gallery or files
              </span>
            </button>

            {/* Upload PDF Option */}
            {allowPdf && (
              <button
                onClick={handlePdfClick}
                style={styles.optionButton}
                type="button"
              >
                <FileText size={48} style={styles.icon} />
                <span style={styles.optionLabel}>Upload PDF</span>
                <span style={styles.optionDesc}>Select PDF file</span>
              </button>
            )}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, "camera")}
          style={{ display: "none" }}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => handleFileSelect(e, "upload")}
          style={{ display: "none" }}
        />
        {allowPdf && (
          <input
            type="file"
            ref={pdfInputRef}
            accept="application/pdf"
            onChange={(e) => handleFileSelect(e, "pdf")}
            style={{ display: "none" }}
          />
        )}
      </div>
    </div>
  );
};

const styles = {
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
    zIndex: 2000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    maxWidth: "500px",
    width: "90%",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #eee",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: "30px 20px",
  },
  subtitle: {
    margin: "0 0 25px 0",
    fontSize: "14px",
    color: "#666",
    textAlign: "center",
  },
  optionsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  optionButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    border: "2px solid #eee",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
  },
  icon: {
    color: "#007bff",
  },
  optionLabel: {
    fontWeight: "600",
    color: "#1a1a1a",
    display: "block",
  },
  optionDesc: {
    fontSize: "12px",
    color: "#999",
    display: "block",
  },
};

export default FileUploadModal;
