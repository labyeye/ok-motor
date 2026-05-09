import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Edit, Trash2, UserPlus } from "lucide-react";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";

import ConfirmModal from "./ConfirmModal";

const StaffList = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await axios.get(
          "https://backend.okmotors.in/api/users",
        );
        setStaff(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch staff. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const handleDelete = (id) => {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "staff",
    status: "active",
    password: "",
  });

  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "staff",
      status: user.status || "active",
      password: "",
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditTarget(null);
    setEditForm({
      name: "",
      email: "",
      role: "staff",
      status: "active",
      password: "",
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
      };

      if (editForm.password && editForm.password.trim().length > 0) {
        payload.password = editForm.password;
      }

      const response = await axios.put(
        `https://backend.okmotors.in/api/users/${editTarget._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStaff((prev) =>
        prev.map((u) =>
          u._id === editTarget._id ? { ...u, ...response.data } : u,
        ),
      );
      closeEdit();
    } catch (err) {
      console.error("Edit user failed", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        logout();
        navigate("/login");
      } else {
        setError(
          err.response?.data?.message || err.message || "Failed to update user",
        );
      }
    }
  };

  const performDelete = async () => {
    const id = confirmTargetId;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not authenticated. Please login again.");
        logout();
        navigate("/login");
        return;
      }

      await axios.delete(
        `https://backend.okmotors.in/api/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setStaff((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        logout();
        navigate("/login");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to delete staff members.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to delete staff. Please try again.",
        );
      }
    } finally {
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Staff Member"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.pageTitle}>Staff Members</h1>
                <p style={styles.pageSubtitle}>
                  View and manage all staff accounts
                </p>
              </div>
              <button
                style={styles.addButton}
                onClick={() => navigate("/staff/create")}
              >
                <UserPlus size={18} style={{ marginRight: "8px" }} />
                Add Staff
              </button>
            </div>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          {loading ? (
            <div style={styles.loading}>Loading staff members...</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created At</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(staff) ? staff : []).map((user) => (
                    <tr key={user._id}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <User size={16} style={styles.userIcon} />
                          {user.name}
                        </div>
                      </td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            ...(user.role === "admin"
                              ? styles.adminBadge
                              : styles.staffBadge),
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(user.status === "active"
                              ? styles.activeBadge
                              : styles.inactiveBadge),
                          }}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={styles.editButton}
                            onClick={() => openEdit(user)}
                            title="Edit user"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            style={styles.deleteButton}
                            onClick={() => handleDelete(user._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {editOpen && (
        <div style={styles.editModalOverlay} onClick={closeEdit}>
          <div style={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.editModalHeader}>
              <h3 style={{ margin: 0 }}>Edit User</h3>
            </div>
            <div style={styles.editModalBody}>
              <div style={styles.editFormRow}>
                <label style={styles.editLabel}>Name</label>
                <input
                  style={styles.editInput}
                  value={editForm.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                />
              </div>
              <div style={styles.editFormRow}>
                <label style={styles.editLabel}>Email</label>
                <input
                  style={styles.editInput}
                  value={editForm.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                />
              </div>
              <div style={styles.editFormRow}>
                <label style={styles.editLabel}>Role</label>
                <select
                  style={styles.editInput}
                  value={editForm.role}
                  onChange={(e) => handleEditChange("role", e.target.value)}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={styles.editFormRow}>
                <label style={styles.editLabel}>Status</label>
                <select
                  style={styles.editInput}
                  value={editForm.status}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={styles.editFormRow}>
                <label style={styles.editLabel}>
                  Password (leave blank to keep)
                </label>
                <input
                  type="password"
                  style={styles.editInput}
                  value={editForm.password}
                  onChange={(e) => handleEditChange("password", e.target.value)}
                  placeholder="New password"
                />
              </div>
            </div>
            <div style={styles.editActions}>
              <button style={styles.cancelBtn} onClick={closeEdit}>
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={submitEdit}>
                Save
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
    backgroundColor: "rgba(26, 37, 54, 0.8)",
    maxHeight: "0px",
    overflow: "hidden",
    transition:
      "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: 0,
  },
  submenuItem: {
    padding: "10px 24px 10px 64px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "0.875rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  addButton: {
    display: "flex",
    alignItems: "center",
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
  errorAlert: {
    padding: "12px 16px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "0.875rem",
  },
  loading: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    color: "#1e293b",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
  },
  userIcon: {
    marginRight: "8px",
    color: "#64748b",
  },
  roleBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  adminBadge: {
    backgroundColor: "rgba(8, 131, 149, 0.2)",
    color: "#088395",
  },
  staffBadge: {
    backgroundColor: "#ecfccb",
    color: "#3f6212",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    backgroundColor: "rgba(8, 131, 149, 0.1)",
    color: "#088395",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#bae6fd",
    },
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#fecaca",
    },
  },
  editModalOverlay: {
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
  editModal: {
    width: "92%",
    maxWidth: "520px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  editModalHeader: { padding: "12px 16px", borderBottom: "1px solid #eee" },
  editModalBody: { padding: "16px" },
  editFormRow: { marginBottom: "12px" },
  editLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#0f172a",
    fontSize: "0.9rem",
  },
  editInput: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e6eef6",
    borderRadius: "6px",
  },
  editActions: {
    padding: "12px 16px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  cancelBtn: {
    padding: "8px 12px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "8px 12px",
    background: "#088395",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default StaffList;
