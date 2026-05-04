import { useState, useEffect, useContext } from "react";
import {
  Bike,
  Car,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";
import ConfirmModal from "./ConfirmModal";

const VehicleHistory = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("Available");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const API_BASE = "https://ok-motor-backend.vercel.app";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [currentPage, filterType, filterStatus]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (filterType) params.append("vehicleType", filterType);
      if (filterStatus) params.append("availabilityStatus", filterStatus);

      const response = await axios.get(`${API_BASE}/api/vehicles?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVehicles(response.data.vehicles || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    setConfirmTargetId(vehicleId);
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);

  const performDelete = async () => {
    const vehicleId = confirmTargetId;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Vehicle deleted successfully!");
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert("Failed to delete vehicle");
    } finally {
      setConfirmOpen(false);
      setConfirmTargetId(null);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const search = searchTerm.toLowerCase();
    return (
      vehicle.vehicleName?.toLowerCase().includes(search) ||
      vehicle.vehicleModel?.toLowerCase().includes(search) ||
      vehicle.registrationNumber?.toLowerCase().includes(search)
    );
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
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
      backgroundColor: "rgba(26, 32, 44, 0.7)",
      maxHeight: 0,
      opacity: 0,
      overflow: "hidden",
      transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
    },
    submenuItemActive: {
      backgroundColor: "#2d3748",
      color: "#ffffff",
    },
    submenuItem: {
      padding: "10px 24px 10px 64px",
      cursor: "pointer",
      color: "#cbd5e1",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
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
    },
    mainContent: {
      flex: 1,
      overflow: "auto",
      backgroundColor: "#ffffff",
    },
    contentPadding: {
      background: "#ffffff",
      borderRadius: "12px",
      padding: "24px",
      marginTop: "16px",
    },
    pageSubtitle: {
      fontSize: "1rem",
      color: "#64748b",
      margin: "8px 0 0 0",
    },
    headerActions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
    },
    addButton: {
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
    },
    filters: {
      display: "flex",
      gap: "16px",
      marginBottom: "24px",
      flexWrap: "wrap",
    },
    searchBox: {
      flex: 1,
      minWidth: "300px",
      position: "relative",
    },
    searchInput: {
      width: "94%",
      padding: "10px 12px 10px 40px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "40%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
    },
    select: {
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
      backgroundColor: "#ffffff",
    },
    vehicleGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
      gap: "24px",
      marginBottom: "32px",
    },
    vehicleCard: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      transition: "all 0.2s ease",
    },
    vehicleImage: {
      position: "relative",
      width: "100%",
      height: "220px",
      backgroundColor: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    typeBadge: {
      position: "absolute",
      top: "12px",
      right: "12px",
      backgroundColor: "#088395",
      color: "white",
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    vehicleInfo: {
      padding: "18px",
    },
    vehicleTitle: {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "4px",
    },
    vehicleVariant: {
      fontSize: "0.875rem",
      color: "#64748b",
      marginBottom: "8px",
    },
    vehicleDetails: {
      display: "flex",
      gap: "8px",
      fontSize: "0.875rem",
      color: "#64748b",
      marginBottom: "12px",
      flexWrap: "wrap",
    },
    statusBadge: {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "500",
      marginBottom: "12px",
    },
    vehiclePrice: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: "#088395",
      marginBottom: "16px",
    },
    vehicleActions: {
      display: "flex",
      gap: "8px",
    },
    btn: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      padding: "8px 12px",
      border: "none",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    btnEdit: {
      backgroundColor: "#088395",
      color: "white",
    },
    btnView: {
      backgroundColor: "#607d8b",
      color: "white",
    },
    btnDelete: {
      backgroundColor: "#ef4444",
      color: "white",
    },
    btnDeleteDisabled: {
      backgroundColor: "#f5f5f5",
      color: "#9e9e9e",
      cursor: "not-allowed",
      opacity: 0.6,
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "16px",
      marginTop: "32px",
    },
    paginationBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#ffffff",
      color: "#1e293b",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    loading: {
      textAlign: "center",
      padding: "64px 0",
      fontSize: "1.125rem",
      color: "#64748b",
    },
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
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action will mark it as not active."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.headerActions}>
            <div>
              <h1 style={styles.pageTitle}>Vehicle List</h1>
              <p style={styles.pageSubtitle}>
                View and manage all vehicles in your inventory
              </p>
            </div>
          </div>

          {}
          <div style={styles.filters}>
            <div style={styles.searchBox}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by brand, model, registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.select}
            >
              <option value="">All Types</option>
              <option value="Car">Cars</option>
              <option value="Bike">Bikes</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={styles.select}
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Sold">Sold</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Service">Under Service</option>
            </select>
          </div>

          {}
          {loading ? (
            <div style={styles.loading}>Loading vehicles...</div>
          ) : (
            <>
              <div style={styles.contentPadding}>
                {filteredVehicles.length === 0 ? (
                  <div
                    style={{
                      padding: "48px 12px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No vehicles found.
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
                      <thead>
                        <tr
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #e6eef6",
                          }}
                        >
                          <th style={{ padding: "12px 16px", width: 140 }}>
                            Vehicle
                          </th>
                          <th style={{ padding: "12px 16px" }}>Details</th>
                          <th style={{ padding: "12px 16px", width: 120 }}>
                            Year / KM
                          </th>
                          <th style={{ padding: "12px 16px", width: 140 }}>
                            Price
                          </th>
                          <th style={{ padding: "12px 16px", width: 220 }}>
                            Status
                          </th>
                          <th style={{ padding: "12px 16px", width: 200 }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVehicles.map((vehicle) => (
                          <tr
                            key={vehicle._id}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    width: 120,
                                    height: 80,
                                    background: "#f8fafc",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {vehicle.primaryImage?.url ? (
                                    <img
                                      src={vehicle.primaryImage.url}
                                      alt={vehicle.vehicleName}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : vehicle.vehicleType === "Car" ? (
                                    <Car size={36} color="#94a3b8" />
                                  ) : (
                                    <Bike size={36} color="#94a3b8" />
                                  )}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "1rem",
                                      fontWeight: 600,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {vehicle.vehicleName} {vehicle.vehicleModel}
                                  </div>
                                  <div
                                    style={{ color: "#64748b", marginTop: 4 }}
                                  >
                                    {vehicle.registrationNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                              }}
                            >
                              <div style={{ color: "#475569" }}>
                                {vehicle.vehicleVariant || "-"}
                              </div>
                              <div style={{ color: "#64748b", marginTop: 6 }}>
                                {vehicle.fuelType} • {vehicle.transmission}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>
                                {vehicle.manufacturingYear || "-"}
                              </div>
                              <div style={{ color: "#64748b", marginTop: 6 }}>
                                {vehicle.kilometersRun
                                  ? `${vehicle.kilometersRun.toLocaleString()} km`
                                  : "-"}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                                fontWeight: 700,
                                color: "#10b981",
                              }}
                            >
                              {vehicle.sellingPrice || vehicle.expectedPrice
                                ? `₹${(
                                    vehicle.sellingPrice ||
                                    vehicle.expectedPrice
                                  ).toLocaleString()}`
                                : "-"}
                              {(vehicle.downPayment || vehicle.emi) && (
                                <div
                                  style={{
                                    fontWeight: 500,
                                    color: "#475569",
                                    marginTop: 6,
                                    fontSize: "0.95rem",
                                  }}
                                >
                                  {vehicle.downPayment
                                    ? `Down ₹${vehicle.downPayment.toLocaleString()}`
                                    : ""}
                                  {vehicle.downPayment && vehicle.emi
                                    ? " • "
                                    : ""}
                                  {vehicle.emi
                                    ? `EMI ₹${vehicle.emi.toLocaleString()}/mo`
                                    : ""}
                                </div>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    ...styles.statusBadge,
                                    backgroundColor:
                                      vehicle.availabilityStatus === "Available"
                                        ? "#d1fae5"
                                        : vehicle.availabilityStatus === "Sold"
                                          ? "#fee2e2"
                                          : "#fef3c7",
                                    color:
                                      vehicle.availabilityStatus === "Available"
                                        ? "#059669"
                                        : vehicle.availabilityStatus === "Sold"
                                          ? "#dc2626"
                                          : "#d97706",
                                    display: "inline-block",
                                    padding: "6px 10px",
                                  }}
                                >
                                  {vehicle.availabilityStatus}
                                </span>
                                <div style={{ marginTop: 8, color: "#64748b" }}>
                                  {vehicle.insuranceStatus
                                    ? `Insurance: ${vehicle.insuranceStatus}`
                                    : ""}
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                verticalAlign: "middle",
                              }}
                            >
                              <div style={{ display: "flex", gap: 8 }}>
                                {user?.role !== "staff" && (
                                  <>
                                    <button
                                      style={{
                                        ...styles.btn,
                                        ...styles.btnEdit,
                                      }}
                                      onClick={() =>
                                        navigate(
                                          `/vehicle/create?vehicleId=${vehicle._id}`,
                                        )
                                      }
                                    >
                                      <Edit size={14} /> Edit
                                    </button>
                                    <button
                                      style={{
                                        ...styles.btn,
                                        ...styles.btnDelete,
                                      }}
                                      onClick={() => handleDelete(vehicle._id)}
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      ...styles.paginationBtn,
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.paginationBtn,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Next
                    <ChevronRightIcon size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleHistory;
