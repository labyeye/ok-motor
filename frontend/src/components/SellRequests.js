import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
const API_BASE =
  process.env.REACT_APP_API_URL || "https://ok-motor-51l3.vercel.app";

const SellRequests = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`${API_BASE}/api/sell-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load sell requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    fetchRequests();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openDetails = (req) => setSelected(req);
  const closeDetails = () => setSelected(null);

  const updateStatus = async (id, status) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token") || "";
      const res = await axios.patch(
        `${API_BASE}/api/sell-request/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setRequests((prev) =>
        prev.map((p) => (p._id === id ? res.data.data : p)),
      );
      if (selected && selected._id === id) setSelected(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
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
        paddingTop: isMobile ? "72px" : undefined,
      }}
    >
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 style={styles.pageTitle}>Sell Requests</h1>
                <p style={styles.pageSubtitle}>
                  Manage incoming sell form submissions
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="card" style={{ padding: 16 }}>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <div>
                <p style={{ color: "red" }}>{error}</p>
                <button onClick={fetchRequests}>Retry</button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 900,
                  }}
                >
                  <thead style={{ background: "#f1f5f9" }}>
                    <tr>
                      <th style={th}>Date</th>
                      <th style={th}>Name</th>
                      <th style={th}>Phone</th>
                      <th style={th}>Email</th>
                      <th style={th}>Vehicle</th>
                      <th style={th}>Price</th>
                      <th style={th}>Images</th>
                      <th style={th}>Status</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id} style={tr}>
                        <td style={td}>
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td style={td}>{r.name}</td>
                        <td style={td}>{r.phone}</td>
                        <td style={td}>{r.email}</td>
                        <td style={td}>{`${r.brand || ""} ${r.model || ""} ${
                          r.year || ""
                        }`}</td>
                        <td style={td}>{r.price ? `₹${r.price}` : "-"}</td>
                        <td style={td}>
                          {r.images?.length ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              {r.images.slice(0, 3).map((img) => (
                                <img
                                  key={img.fileId}
                                  src={img.url}
                                  alt={img.name || "img"}
                                  style={{
                                    width: 80,
                                    height: 56,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    border: "1px solid #e6e6e6",
                                  }}
                                />
                              ))}
                              {r.images.length > 3 && (
                                <span>+{r.images.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td style={td}>
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              background:
                                r.status === "Approved"
                                  ? "#ecfccb"
                                  : r.status === "Rejected"
                                    ? "#fee2e2"
                                    : "#f1f5f9",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => openDetails(r)}
                            style={{ marginRight: 8 }}
                          >
                            View
                          </button>
                          <select
                            value={r.status}
                            onChange={(e) =>
                              updateStatus(r._id, e.target.value)
                            }
                            disabled={updating}
                            style={{ marginLeft: 8 }}
                          >
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div style={modalStyle} onClick={closeDetails}>
              <div style={modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>Sell Request Details</h3>
                <p>
                  <strong>Name:</strong> {selected.name}
                </p>
                <p>
                  <strong>Phone:</strong> {selected.phone}
                </p>
                <p>
                  <strong>Email:</strong> {selected.email}
                </p>
                <p>
                  <strong>Vehicle:</strong>{" "}
                  {`${selected.brand || ""} ${selected.model || ""} ${
                    selected.year || ""
                  }`}
                </p>
                <p>
                  <strong>Price:</strong>{" "}
                  {selected.price ? `₹${selected.price}` : "-"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.images?.map((img) => (
                    <a
                      key={img.fileId}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={img.url}
                        alt={img.name || "img"}
                        style={{
                          width: 180,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    </a>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <strong>Status:</strong>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected._id, e.target.value)}
                    disabled={updating}
                    style={{ marginLeft: 8 }}
                  >
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={closeDetails}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const th = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e6eef6",
  fontSize: 14,
  color: "#0f172a",
};
const td = {
  padding: 12,
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
  fontSize: 13,
};
const tr = { background: "#fff" };
const modalStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};
const modalContent = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  maxWidth: 900,
  width: "92%",
  maxHeight: "86%",
  overflowY: "auto",
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#EBF4F6",
    fontFamily: "Arial, sans-serif",
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
  nav: {
    padding: "16px 0",
    flex: "1 1 auto",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
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
  menuItemContent: { display: "flex", alignItems: "center" },
  menuIcon: { marginRight: "12px", color: "#94a3b8" },
  menuText: { fontSize: "0.9375rem", fontWeight: "500" },
  submenu: { backgroundColor: "#1a2536" },
  submenuItem: {
    padding: "10px 24px 10px 64px",
    cursor: "pointer",
    color: "#cbd5e1",
    fontSize: "0.875rem",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    color: "#f87171",
    marginTop: "16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  mainContent: { flex: 1, overflow: "auto" },
  contentPadding: { padding: "32px" },
  header: { marginBottom: "24px" },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  pageSubtitle: { color: "#6b7280", marginTop: "8px", margin: "8px 0 0 0" },
};

export default SellRequests;
