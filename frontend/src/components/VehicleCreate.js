import React, { useState, useEffect, useContext } from "react";
import {
  FileText,
  Bike,
  Car,
  Upload,
  Save,
  ShipWheel,
  User,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import AppSidebar from "./common/AppSidebar";

const VehicleCreate = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [, setImageKitAuth] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const editVehicleId = searchParams.get("vehicleId");

  const API_BASE = "https://ok-motor-51l3.vercel.app";

  const [formData, setFormData] = useState({
    vehicleType: "Car",
    vehicleName: "",
    vehicleModel: "",
    vehicleVariant: "",
    manufacturingYear: new Date().getFullYear(),
    vehicleColor: "",
    fuelType: "Petrol",
    transmission: "Manual",
    ownershipNumber: 1,
    kilometersRun: 0,
    vehicleCondition: "running",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    seatingCapacity: "",
    bodyType: "",
    purchasePrice: "",
    downPayment: "",
    emi: "",
    sellingPrice: "",
    expectedPrice: "",
    availabilityStatus: "Available",
    description: "",
    features: [],
    visibility: "staff",
    internalNotes: "",
    isActive: true,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    getImageKitAuth();
    if (editVehicleId) {
      loadVehicleForEdit(editVehicleId);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, [editVehicleId]);

  // formatDateForInput function removed - not currently used

  const loadVehicleForEdit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${API_BASE}/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const v = resp.data;

      setFormData((prev) => ({
        ...prev,
        vehicleType: v.vehicleType || prev.vehicleType,
        vehicleName: v.vehicleName || "",
        vehicleModel: v.vehicleModel || "",
        vehicleVariant: v.vehicleVariant || "",
        manufacturingYear: v.manufacturingYear || prev.manufacturingYear,
        vehicleColor: v.vehicleColor || "",
        fuelType: v.fuelType || prev.fuelType,
        transmission: v.transmission || prev.transmission,
        ownershipNumber: v.ownershipNumber || prev.ownershipNumber,
        kilometersRun: v.kilometersRun || prev.kilometersRun,
        vehicleCondition: v.vehicleCondition || prev.vehicleCondition,
        registrationNumber: v.registrationNumber || "",
        chassisNumber: v.chassisNumber || "",
        engineNumber: v.engineNumber || "",
        // insurance fields moved to Sell Letter model; removed from vehicle
        seatingCapacity: v.seatingCapacity || "",
        bodyType: v.bodyType || "",
        purchasePrice: v.purchasePrice || "",
        downPayment: v.downPayment || "",
        emi: v.emi || "",
        sellingPrice: v.sellingPrice || "",
        expectedPrice: v.expectedPrice || "",
        availabilityStatus: v.availabilityStatus || prev.availabilityStatus,
        description: v.description || "",
        features: v.features || [],
        visibility: v.visibility || prev.visibility,
        internalNotes: v.internalNotes || "",
        isActive: typeof v.isActive === "boolean" ? v.isActive : prev.isActive,
      }));

      setUploadedImages(v.images || (v.primaryImage ? [v.primaryImage] : []));
    } catch (err) {
      console.error("Failed to load vehicle for edit:", err);
      alert("Failed to load vehicle data for editing");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getImageKitAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE}/api/vehicles/imagekit-auth`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setImageKitAuth(response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting ImageKit auth:", error);
    }
  };
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);

    try {
      const results = [];

      for (const file of files) {
        try {
          const auth = await getImageKitAuth();

          if (!auth || !auth.token || !auth.signature || !auth.expire) {
            throw new Error("Incomplete authentication parameters");
          }

          const publicKey = String(auth.publicKey || "")
            .replace(/^["']|["']$/g, "")
            .trim();

          const formData = new FormData();
          formData.append("file", file);
          formData.append(
            "fileName",
            `vehicle_${Date.now()}_${Math.random().toString(36).substring(7)}_${
              file.name
            }`,
          );
          formData.append("publicKey", publicKey);
          formData.append("signature", auth.signature);
          formData.append("expire", auth.expire.toString());
          formData.append("token", auth.token);
          formData.append("folder", "/vehicles");

          console.log(
            `Uploading file ${results.length + 1}/${files.length}:`,
            file.name,
          );

          const response = await axios.post(
            "https://upload.imagekit.io/api/v1/files/upload",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            },
          );

          results.push({
            url: response.data.url,
            fileId: response.data.fileId,
            thumbnailUrl: response.data.thumbnailUrl,
            name: response.data.name,
          });

          console.log(
            `✓ Upload successful (${results.length}/${files.length}):`,
            response.data.name,
          );
        } catch (fileError) {
          console.error(`Failed to upload ${file.name}:`, fileError);
          alert(
            `Failed to upload ${file.name}: ${
              fileError.response?.data?.message || fileError.message
            }`,
          );
        }
      }

      if (results.length > 0) {
        setUploadedImages([...uploadedImages, ...results]);
        alert(
          `${results.length} of ${files.length} image(s) uploaded successfully!`,
        );
      } else {
        alert("No images were uploaded successfully");
      }
    } catch (error) {
      console.error("Error during upload process:", error);
      alert(`Upload process failed: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = (fileId) => {
    setUploadedImages(uploadedImages.filter((img) => img.fileId !== fileId));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "isActive" ? value === "true" : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      const vehicleData = {
        ...formData,
        images: uploadedImages,
        primaryImage: uploadedImages[0] || null,
      };

      if (editVehicleId) {
        await axios.put(
          `${API_BASE}/api/vehicles/${editVehicleId}`,
          vehicleData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        alert("Vehicle updated successfully!");
      } else {
        await axios.post(`${API_BASE}/api/vehicles`, vehicleData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Vehicle created successfully!");
      }

      navigate("/vehicle/history");
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert(error.response?.data?.message || "Failed to save vehicle");
    } finally {
      setIsSaving(false);
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
      padding: "32px",
    },
    pageTitle: {
      fontSize: "1.875rem",
      fontWeight: "700",
      color: "#1e293b",
      margin: 0,
      marginBottom: "8px",
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
      marginTop: "24px",
    },
    formSection: {
      marginBottom: "40px",
      paddingBottom: "24px",
      borderBottom: "1px solid #e2e8f0",
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
      width: "20px",
      height: "20px",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "20px",
    },
    formField: {
      marginBottom: "16px",
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
      width: "16px",
      height: "16px",
    },
    formInput: {
      width: "90%",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
      transition: "all 0.2s ease",
      backgroundColor: "#ffffff",
    },
    formSelect: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
      backgroundColor: "#ffffff",
      transition: "all 0.2s ease",
    },
    formTextarea: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "0.875rem",
      minHeight: "80px",
      resize: "vertical",
      transition: "all 0.2s ease",
      backgroundColor: "#ffffff",
    },
    formActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "16px",
      marginTop: "32px",
    },
    saveButton: {
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
    uploadLabel: {
      display: "inline-flex",
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
    uploadedImages: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      marginTop: "16px",
    },
    uploadedImage: {
      position: "relative",
      width: "120px",
      height: "120px",
      borderRadius: "8px",
      overflow: "hidden",
      border: "2px solid #e2e8f0",
    },
    typeSelector: {
      display: "flex",
      gap: "16px",
    },
    typeOption: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      padding: "20px",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    typeOptionActive: {
      borderColor: "#088395",
      backgroundColor: "#EBF4F6",
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

  return (
    <div
      style={{
        ...styles.container,
        paddingTop: isMobile ? "80px" : "0",
      }}
    >
      <AppSidebar user={user} onLogout={handleLogout} />

      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>
              {editVehicleId ? "Edit Vehicle" : "Add New Vehicle"}
            </h1>
            <p style={styles.pageSubtitle}>
              {editVehicleId
                ? "Update the details and save changes"
                : "Fill in the details to add a new vehicle to the inventory"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Vehicle Type Selection */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>
                <ShipWheel size={20} />
                Vehicle Type
              </h3>
              <div style={styles.typeSelector}>
                <label
                  style={{
                    ...styles.typeOption,
                    ...(formData.vehicleType === "Car"
                      ? styles.typeOptionActive
                      : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="vehicleType"
                    value="Car"
                    checked={formData.vehicleType === "Car"}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  <Car size={40} />
                  <span style={{ fontWeight: "500" }}>Car</span>
                </label>
                <label
                  style={{
                    ...styles.typeOption,
                    ...(formData.vehicleType === "Bike"
                      ? styles.typeOptionActive
                      : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="vehicleType"
                    value="Bike"
                    checked={formData.vehicleType === "Bike"}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  <Bike size={40} />
                  <span style={{ fontWeight: "500" }}>Bike</span>
                </label>
              </div>
            </div>

            {/* Vehicle Images */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>
                <Upload size={20} />
                Vehicle Images
              </h3>
              <label style={styles.uploadLabel}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  style={{ display: "none" }}
                />
                <Upload size={16} />
                {uploadingImages ? "Uploading..." : "Upload Images"}
              </label>

              <div style={styles.uploadedImages}>
                {uploadedImages.map((img, index) => (
                  <div key={img.fileId} style={styles.uploadedImage}>
                    <img
                      src={img.thumbnailUrl || img.url}
                      alt={img.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {index === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          backgroundColor: "#10b981",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(img.fileId)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Details */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} />
                Basic Vehicle Details
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Brand/Make *</label>
                  <input
                    type="text"
                    name="vehicleName"
                    required
                    value={formData.vehicleName}
                    onChange={handleChange}
                    style={styles.formInput}
                    placeholder="e.g., Maruti, Honda"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Model *</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    required
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    style={styles.formInput}
                    placeholder="e.g., Swift, Activa"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Variant</label>
                  <input
                    type="text"
                    name="vehicleVariant"
                    value={formData.vehicleVariant}
                    onChange={handleChange}
                    style={styles.formInput}
                    placeholder="e.g., VXI, ZXI"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Year *</label>
                  <input
                    type="number"
                    name="manufacturingYear"
                    required
                    value={formData.manufacturingYear}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Color *</label>
                  <input
                    type="text"
                    name="vehicleColor"
                    required
                    value={formData.vehicleColor}
                    onChange={handleChange}
                    style={styles.formInput}
                    placeholder="e.g., Red, Blue"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Transmission</label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Semi-Automatic">Semi-Automatic</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Kilometers Run</label>
                  <input
                    type="number"
                    name="kilometersRun"
                    value={formData.kilometersRun}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>
                <FileText style={styles.sectionIcon} />
                Registration & Legal
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    placeholder="e.g., BR01AB1234"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Chassis Number *</label>
                  <input
                    type="text"
                    name="chassisNumber"
                    required
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Engine Number *</label>
                  <input
                    type="text"
                    name="engineNumber"
                    required
                    value={formData.engineNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Ownership</label>
                  <select
                    name="ownershipNumber"
                    value={formData.ownershipNumber}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="1">1st Owner</option>
                    <option value="2">2nd Owner</option>
                    <option value="3">3rd Owner</option>
                    <option value="4">4th Owner</option>
                    <option value="5">5+ Owner</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Condition & Specifications */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} />
                Condition & Specifications
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Condition *</label>
                  <select
                    name="vehicleCondition"
                    required
                    value={formData.vehicleCondition}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="running">Running</option>
                    <option value="notRunning">Not Running</option>
                  </select>
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Seating Capacity</label>
                  <input
                    type="number"
                    name="seatingCapacity"
                    value={formData.seatingCapacity}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="1"
                    placeholder="e.g., 5"
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Body Type</label>
                  <input
                    type="text"
                    name="bodyType"
                    value={formData.bodyType}
                    onChange={handleChange}
                    style={styles.formInput}
                    placeholder="e.g., Sedan, Hatchback, SUV"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Pricing Details</h3>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Purchase Price</label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    placeholder="Amount paid"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Selling Price</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    placeholder="Listed price"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Expected Price</label>
                  <input
                    type="number"
                    name="expectedPrice"
                    value={formData.expectedPrice}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    placeholder="Target price"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Down Payment</label>
                  <input
                    type="number"
                    name="downPayment"
                    value={formData.downPayment}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    placeholder="Down payment amount (optional)"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>EMI (per month)</label>
                  <input
                    type="number"
                    name="emi"
                    value={formData.emi}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    placeholder="EMI amount per month (optional)"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Availability Status</label>
                  <select
                    name="availabilityStatus"
                    value={formData.availabilityStatus}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Under Service">Under Service</option>
                    <option value="Not for Sale">Not for Sale</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Additional Information</h3>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  style={styles.formTextarea}
                  placeholder="Enter vehicle description..."
                  maxLength="1000"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Internal Notes</label>
                <textarea
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleChange}
                  style={styles.formTextarea}
                  placeholder="Private notes (not visible to customers)..."
                  maxLength="500"
                />
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    Features (comma separated)
                  </label>
                  <input
                    type="text"
                    name="features"
                    value={formData.features.join(", ")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        features: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    style={styles.formInput}
                    placeholder="e.g., ABS, Airbags, AC, Power Steering"
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Visibility</label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="private">Private</option>
                    <option value="staff">Staff Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Active Status</label>
                  <select
                    name="isActive"
                    value={formData.isActive}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={styles.formActions}>
              <button
                type="submit"
                style={styles.saveButton}
                disabled={isSaving}
              >
                <Save size={16} />
                {isSaving
                  ? "Saving..."
                  : editVehicleId
                    ? "Save Changes"
                    : "Save Vehicle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleCreate;
