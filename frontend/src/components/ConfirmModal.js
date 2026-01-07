import React from "react";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
        </div>
        <div style={styles.body}>
          <p style={styles.message}>{message}</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button style={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  modal: {
    width: "90%",
    maxWidth: "480px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #eee",
  },
  title: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
  },
  body: {
    padding: "20px",
  },
  message: {
    margin: 0,
    color: "#334155",
  },
  actions: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    borderTop: "1px solid #f1f5f9",
  },
  cancelBtn: {
    padding: "8px 14px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#0f172a",
  },
  confirmBtn: {
    padding: "8px 14px",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
  },
};

export default ConfirmModal;
