import React, { useState, useCallback } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import {
  FileText,
  ArrowLeft,
  User,
  Car,
  Download,
  Calendar,
  IndianRupee,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = {
  user: { name: "John Admin" },
  logout: () => console.log("Logged out"),
};

const ServiceBillForm = () => {
  const { user, logout } = AuthContext;
  const [activeMenu, setActiveMenu] = useState("Create Service Bill");
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    totalAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    balanceDue: 0,
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerEmail: "",
    vehicleType: "bike",
    vehicleBrand: "",
    vehicleModel: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    kmReading: "",
    serviceDate: new Date().toISOString().split("T")[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow's date
    serviceType: "regular",
    serviceItems: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    discount: 0,
    taxRate: 18,
    paymentMethod: "cash",
    paymentStatus: "pending",
    advancePaid: 0,
    issuesReported: "",
    technicianNotes: "",
    warrantyInfo: "",
  });

  const [previewMode, setPreviewMode] = useState(false);
const API_BASE_URL = 'http://localhost:2500/api';
  const calculateAmounts = (data) => {
    const totalAmount = (data.serviceItems || []).reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
      0
    );
    const taxAmount = ((data.taxRate || 0) / 100) * totalAmount;
    const grandTotal = totalAmount + taxAmount - (data.discount || 0);
    const balanceDue = grandTotal - (data.advancePaid || 0);

    return {
      totalAmount,
      taxAmount,
      grandTotal,
      balanceDue,
    };
  };
  const handleServiceItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...formData.serviceItems];
    items[index] = {
      ...items[index],
      [name]:
        name === "quantity" || name === "rate" ? parseFloat(value) || 0 : value,
    };

    items[index].amount = items[index].quantity * items[index].rate;

    setFormData({
      ...formData,
      serviceItems: items,
      ...calculateAmounts({ ...formData, serviceItems: items })
    });
  };

  const addServiceItem = () => {
    setFormData({
      ...formData,
      serviceItems: [
        ...formData.serviceItems,
        { description: "", quantity: 1, rate: 0, amount: 0 },
      ],
    });
  };

  const removeServiceItem = (index) => {
    const items = formData.serviceItems.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      serviceItems: items,
      ...calculateAmounts({ ...formData, serviceItems: items }),
    });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? parseFloat(value) || 0 : value;

    const newData = {
      ...formData,
      [name]: val,
    };

    if (name === "discount" || name === "taxRate" || name === "advancePaid") {
      Object.assign(newData, calculateAmounts(newData));
    }

    setFormData(newData);
  };

  const saveServiceBill = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/service-bills`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert("Service bill saved successfully!");
      return response.data;
    } catch (error) {
      console.error("Error saving service bill:", error);
      alert(`Failed to save service bill: ${error.response?.data?.message || error.message}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndDownload = async () => {
    try {
      setIsSaving(true);
      
      const token = localStorage.getItem('token');
      const saveResponse = await axios.post('http://localhost:2500/api/service-bills', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Save response:', saveResponse.data); 
      
      const billId = saveResponse.data.data._id; 
      if (!billId) {
        throw new Error('No bill ID returned from server');
      }
      
      const pdfResponse = await axios.get(`http://localhost:2500/api/service-bills/${billId}/download`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `service-bill-${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Service bill saved and downloaded successfully!');
    } catch (error) {
      console.error('Error in save and download:', error);
      alert(`Failed to save and download: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateServiceBillPDF = async (billData = formData) => {
    try {
      const templateUrl = "/templates/service-bill.pdf";
      const existingPdfBytes = await fetch(templateUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];

      // Customer Information
      page.drawText(billData.customerName, { x: 50, y: 650, size: 11 });
      page.drawText(billData.customerPhone, { x: 300, y: 650, size: 11 });
      page.drawText(billData.customerAddress, { x: 50, y: 630, size: 11 });

      // Vehicle Information
      page.drawText(billData.vehicleType.toUpperCase(), {
        x: 50,
        y: 600,
        size: 11,
      });
      page.drawText(billData.vehicleBrand, { x: 150, y: 600, size: 11 });
      page.drawText(billData.vehicleModel, { x: 300, y: 600, size: 11 });
      page.drawText(billData.registrationNumber, { x: 450, y: 600, size: 11 });
      page.drawText(billData.chassisNumber || "N/A", {
        x: 50,
        y: 580,
        size: 11,
      });
      page.drawText(billData.engineNumber || "N/A", {
        x: 250,
        y: 580,
        size: 11,
      });
      page.drawText(billData.kmReading.toString(), {
        x: 450,
        y: 580,
        size: 11,
      });

      // Service Details
      page.drawText(billData.serviceDate, { x: 50, y: 550, size: 11 });
      page.drawText(billData.deliveryDate, { x: 200, y: 550, size: 11 });
      page.drawText(billData.serviceType.toUpperCase(), {
        x: 350,
        y: 550,
        size: 11,
      });

      // Service Items
      let yPos = 500;
      billData.serviceItems.forEach((item, index) => {
        page.drawText((index + 1).toString(), { x: 50, y: yPos, size: 10 });
        page.drawText(item.description, { x: 80, y: yPos, size: 10 });
        page.drawText(item.quantity.toString(), { x: 300, y: yPos, size: 10 });
        page.drawText(item.rate.toFixed(2), { x: 350, y: yPos, size: 10 });
        page.drawText(item.amount.toFixed(2), { x: 450, y: yPos, size: 10 });
        yPos -= 20;
      });

      // Totals
      page.drawText(billData.totalAmount.toFixed(2), {
        x: 450,
        y: 350,
        size: 11,
      });
      page.drawText(billData.taxRate + "%", { x: 350, y: 330, size: 11 });
      page.drawText(billData.taxAmount.toFixed(2), {
        x: 450,
        y: 330,
        size: 11,
      });
      page.drawText(billData.discount.toFixed(2), { x: 450, y: 310, size: 11 });
      page.drawText(billData.grandTotal.toFixed(2), {
        x: 450,
        y: 290,
        size: 11,
      });
      page.drawText(billData.advancePaid.toFixed(2), {
        x: 450,
        y: 270,
        size: 11,
      });
      page.drawText(billData.balanceDue.toFixed(2), {
        x: 450,
        y: 250,
        size: 11,
      });

      // Payment Information
      page.drawText(billData.paymentMethod.toUpperCase(), {
        x: 150,
        y: 220,
        size: 11,
      });
      page.drawText(billData.paymentStatus.toUpperCase(), {
        x: 350,
        y: 220,
        size: 11,
      });

      // Additional Info
      page.drawText(billData.issuesReported || "N/A", {
        x: 50,
        y: 180,
        size: 10,
      });
      page.drawText(billData.technicianNotes || "N/A", {
        x: 50,
        y: 150,
        size: 10,
      });
      page.drawText(billData.warrantyInfo || "N/A", {
        x: 50,
        y: 120,
        size: 10,
      });

      const pdfBytes = await pdfDoc.save();
      saveAs(
        new Blob([pdfBytes], { type: "application/pdf" }),
        `service-bill-${new Date().getTime()}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
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
      ],
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
      name: "Staff",
      icon: Users,
      submenu: [
        { name: "Create Staff ID", path: "/staff/create" },
        { name: "Staff List", path: "/staff/list" },
      ],
    },
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuClick = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };

  if (previewMode) {
    return (
      <div style={styles.formPreviewContainer}>
        <div style={styles.formPreviewHeader}>
          <button
            onClick={() => setPreviewMode(false)}
            style={styles.backButton}
          >
            <ArrowLeft style={styles.buttonIcon} /> Back to Edit
          </button>
          <div style={styles.previewActions}>
            <button
              onClick={generateServiceBillPDF}
              style={styles.downloadButton}
            >
              <Download style={styles.buttonIcon} /> Download PDF
            </button>
          </div>
        </div>
        <div style={styles.pdfPreview}>
          <p>PDF Preview would show here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Admin Panel</h2>
          <p style={styles.sidebarSubtitle}>Welcome, {user?.name}</p>
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

              {item.submenu && expandedMenus[item.name] && (
                <div style={styles.submenu}>
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

          <div style={styles.logoutButton} onClick={logout}>
            <LogOut size={20} style={styles.menuIcon} />
            <span style={styles.menuText}>Logout</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentPadding}>
          <div style={styles.header}>
            <h1 style={styles.pageTitle}>Create Service Bill</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details to generate a service bill for the vehicle
            </p>
          </div>

          <form style={styles.form}>
            {/* Customer Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <User style={styles.sectionIcon} /> Customer Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Address
                  </label>
                  <input
                    type="text"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <User style={styles.formIcon} />
                    Customer Email
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Car style={styles.sectionIcon} /> Vehicle Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="car">Car</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Brand
                  </label>
                  <input
                    type="text"
                    name="vehicleBrand"
                    value={formData.vehicleBrand}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    Engine Number
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Car style={styles.formIcon} />
                    KM Reading
                  </label>
                  <input
                    type="number"
                    name="kmReading"
                    value={formData.kmReading}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <Wrench style={styles.sectionIcon} /> Service Details
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Service Date
                  </label>
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Calendar style={styles.formIcon} />
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <Wrench style={styles.formIcon} />
                    Service Type
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    style={styles.formSelect}
                    required
                  >
                    <option value="regular">Regular Service</option>
                    <option value="premium">Premium Service</option>
                    <option value="custom">Custom Service</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Service Items */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <ShoppingCart style={styles.sectionIcon} /> Service Items
              </h2>
              <div style={{ marginBottom: "20px" }}>
                {formData.serviceItems.map((item, index) => (
                  <div key={index} style={styles.serviceItemRow}>
                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>Description</label>
                      <input
                        type="text"
                        name="description"
                        value={item.description}
                        onChange={(e) => handleServiceItemChange(index, e)}
                        style={styles.formInput}
                        required
                      />
                    </div>
                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>Qty</label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleServiceItemChange(index, e)}
                        style={styles.formInput}
                        min="1"
                        required
                      />
                    </div>
                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>Rate (₹)</label>
                      <input
                        type="number"
                        name="rate"
                        value={item.rate}
                        onChange={(e) => handleServiceItemChange(index, e)}
                        style={styles.formInput}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div style={styles.serviceItemField}>
                      <label style={styles.formLabel}>Amount (₹)</label>
                      <input
                        type="text"
                        value={item.amount.toFixed(2)}
                        style={styles.formInput}
                        readOnly
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeServiceItem(index)}
                      style={styles.removeItemButton}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addServiceItem}
                  style={styles.addItemButton}
                >
                  <Plus size={16} /> Add Service Item
                </button>
              </div>
            </div>

            {/* Payment Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <IndianRupee style={styles.sectionIcon} /> Payment Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Sub Total (₹)
                  </label>
                  <input
                    type="number"
                    value={(formData.totalAmount || 0).toFixed(2)}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Tax Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.taxAmount.toFixed(2)}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Grand Total (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.grandTotal.toFixed(2)}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    name="advancePaid"
                    value={formData.advancePaid}
                    onChange={handleChange}
                    style={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Balance Due (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.balanceDue.toFixed(2)}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <IndianRupee style={styles.formIcon} />
                    Payment Status
                  </label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    style={styles.formSelect}
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>
                <AlertCircle style={styles.sectionIcon} /> Additional
                Information
              </h2>
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Issues Reported
                  </label>
                  <textarea
                    name="issuesReported"
                    value={formData.issuesReported}
                    onChange={handleChange}
                    rows={3}
                    style={styles.formTextarea}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Technician Notes
                  </label>
                  <textarea
                    name="technicianNotes"
                    value={formData.technicianNotes}
                    onChange={handleChange}
                    rows={3}
                    style={styles.formTextarea}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    <AlertCircle style={styles.formIcon} />
                    Warranty Information
                  </label>
                  <textarea
                    name="warrantyInfo"
                    value={formData.warrantyInfo}
                    onChange={handleChange}
                    rows={3}
                    style={styles.formTextarea}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                style={styles.previewButton}
              >
                <FileText style={styles.buttonIcon} /> Preview
              </button>
              <button
                type="button"
                onClick={saveServiceBill}
                style={styles.saveButton}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                style={styles.downloadButton}
              >
                <Download style={styles.buttonIcon} /> Save & Download
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "280px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    height: "100vh",
    backgroundImage: "linear-gradient(to bottom, #1e293b, #0f172a)",
  },
  sidebarHeader: {
    padding: "24px",
    borderBottom: "1px solid #334155",
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
      backgroundColor: "#334155",
    },
  },
  menuItemActive: {
    backgroundColor: "#334155",
    borderRight: "3px solid #3b82f6",
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
    backgroundColor: "#1a2536",
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
    borderTop: "1px solid #334155",
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
    color: "#334155",
    marginBottom: "8px",
  },
  formInput: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    backgroundColor: "#f8fafc",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
    },
  },
  formSelect: {
    width: "90%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.875rem",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "1em",
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      backgroundColor: "#ffffff",
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
    backgroundColor: "#f8fafc",
  },
  previewButton: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  saveButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  downloadButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  buttonIcon: {
    marginRight: "8px",
  },
};

export default ServiceBillForm;
