import React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const AlertModal = ({ isOpen, onClose, message, type = "success" }) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

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
      fontFamily: "Poppins, sans-serif",
    },
    modal: {
      backgroundColor: "#ffffff",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      width: "90%",
      maxWidth: "400px",
      textAlign: "center",
      position: "relative",
    },
    closeButton: {
      position: "absolute",
      top: "12px",
      right: "12px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#9ca3af",
    },
    iconContainer: {
      marginBottom: "16px",
    },
    message: {
      fontSize: "1rem",
      color: "#4b5563",
      marginBottom: "24px",
    },
    button: {
      padding: "10px 24px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1rem",
      color: "#ffffff",
      backgroundColor: isSuccess ? "#2563eb" : "#dc2626",
    },
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={modalStyles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>
        <div style={modalStyles.iconContainer}>
          {isSuccess ? (
            <CheckCircle size={48} color="#16a34a" />
          ) : (
            <XCircle size={48} color="#dc2626" />
          )}
        </div>
        <p style={modalStyles.message}>{message}</p>
        <button style={modalStyles.button} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
