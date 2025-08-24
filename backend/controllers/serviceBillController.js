const ServiceBill = require("../models/ServiceBill");
const { generateServiceBillPDF } = require("../utils/pdfGenerator");
const fs = require("fs");
const path = require("path");
const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");

exports.getVehicleDetails = async (req, res) => {
  try {
    const { registrationNumber } = req.query;

    if (!registrationNumber) {
      return res.status(400).json({
        message: "Registration number is required",
      });
    }
    const regex = new RegExp(registrationNumber, "i");

    const [buyLetter, sellLetter, serviceBill] = await Promise.all([
      BuyLetter.findOne({ registrationNumber: regex })
        .sort({ createdAt: -1 })
        .select("vehicleName vehicleModel registrationNumber vehiclekm"),

      SellLetter.findOne({ registrationNumber: regex })
        .sort({ createdAt: -1 })
        .select("vehicleName vehicleModel registrationNumber vehiclekm"),

      ServiceBill.findOne({ registrationNumber: regex })
        .sort({ createdAt: -1 })
        .select("vehicleBrand vehicleModel registrationNumber kmReading"),
    ]);
    const vehicleRecord = buyLetter || sellLetter || serviceBill;

    if (!vehicleRecord) {
      return res.status(404).json({
        message: "No vehicle found with this registration number",
      });
    }
    const vehicleDetails = {
      vehicleBrand: vehicleRecord.vehicleName || vehicleRecord.vehicleBrand,
      vehicleModel: vehicleRecord.vehicleModel,
      registrationNumber: vehicleRecord.registrationNumber,
      kmReading: vehicleRecord.vehiclekm || vehicleRecord.kmReading,
    };

    res.json(vehicleDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
// Create a new service bill
exports.createServiceBill = async (req, res) => {
  console.log("Creating service bill...");
  try {
    const { serviceItems, ...otherData } = req.body;
    
    console.log("Received service bill data:", JSON.stringify({ serviceItems, ...otherData }, null, 2));

    // Validate required fields
    const requiredFields = ['customerName', 'customerPhone', 'customerAddress', 'vehicleBrand', 'vehicleModel', 'registrationNumber'];
    const missingFields = requiredFields.filter(field => !otherData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Calculate amounts. Use item.amount when provided (actual charged amount),
    // otherwise fall back to rate * quantity so discounts can be represented.
    const totalAmount = serviceItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = (item.amount !== undefined && item.amount !== null && item.amount !== "")
        ? parseFloat(item.amount) || 0
        : rate * qty;
      return sum + amount;
    }, 0);
    const taxAmount = ((parseFloat(otherData.taxRate) || 0) / 100) * totalAmount;
    const grandTotal = totalAmount + taxAmount - (parseFloat(otherData.discount) || 0);
    const balanceDue = grandTotal - (parseFloat(otherData.advancePaid) || 0);

    // Ensure service items have an amount field when not provided so downstream
    // consumers (PDF, UI) can rely on a concrete value.
    const normalizedServiceItems = serviceItems.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = (item.amount !== undefined && item.amount !== null && item.amount !== "")
        ? parseFloat(item.amount) || 0
        : rate * qty;
      return {
        ...item,
        quantity: qty,
        rate: rate,
        amount: amount,
      };
    });

    const serviceBillData = {
      ...otherData,
      serviceItems: normalizedServiceItems,
      totalAmount,
      taxAmount,
      grandTotal,
      balanceDue,
      user: req.user.id,
    };

    const serviceBill = new ServiceBill(serviceBillData);
    await serviceBill.save();

    // Generate PDF asynchronously to avoid blocking the response
    try {
      const { pdfUrl, filePath } = await generateServiceBillPDF(serviceBill);
      serviceBill.pdfUrl = pdfUrl;
      serviceBill.pdfPath = filePath;
      await serviceBill.save();
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
      // Don't fail the entire request if PDF generation fails
    }

    console.log("Service bill created successfully:", serviceBill._id);
    res.status(201).json({
      success: true,
      data: serviceBill,
    });
  } catch (error) {
    console.error("Error creating service bill:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all service bills
exports.getServiceBills = async (req, res) => {
  try {
    // Staff and admin can see all bills, others only their own
    const query = (req.user.role === 'staff' || req.user.role === 'admin')
      ? {}
      : { user: req.user.id };
    const serviceBills = await ServiceBill.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name role');

    res.status(200).json({
      success: true,
      count: serviceBills.length,
      data: serviceBills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// Add to serviceBillController.js
exports.getServiceBillsByRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    if (!registrationNumber) {
      return res.status(400).json({ message: "Registration number is required" });
    }

    const serviceBills = await ServiceBill.find({ 
      registrationNumber: new RegExp(registrationNumber, 'i'),
      $or: [
        { user: req.user.id },
        { visibility: 'staff' },
        ...(req.user.role === 'staff' ? [{}] : [])
      ]
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name role');

    res.status(200).json({
      success: true,
      data: serviceBills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Preview service bill PDF without saving to database
exports.previewServiceBillPDF = async (req, res) => {
  console.log("Generating preview PDF...");
  console.log("User making request:", req.user.email);
  console.log("Request body keys:", Object.keys(req.body));
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  try {
    const serviceBillData = req.body;
    
    // Validate required fields
    if (!serviceBillData.customerName || !serviceBillData.serviceItems) {
      console.log("Missing required fields:", {
        customerName: !!serviceBillData.customerName,
        serviceItems: !!serviceBillData.serviceItems
      });
      return res.status(400).json({
        message: "Missing required fields: customerName and serviceItems are required"
      });
    }
    
  // Create a temporary service bill object (not saved to database)
    // Ensure all numeric fields are properly converted
    const tempServiceBill = {
      ...serviceBillData,
      _id: "preview", // Temporary ID for preview
      // Convert numeric fields to ensure they're numbers
      totalAmount: parseFloat(serviceBillData.totalAmount) || 0,
      taxAmount: parseFloat(serviceBillData.taxAmount) || 0,
      discount: parseFloat(serviceBillData.discount) || 0,
      grandTotal: parseFloat(serviceBillData.grandTotal) || 0,
      advancePaid: parseFloat(serviceBillData.advancePaid) || 0,
      balanceDue: parseFloat(serviceBillData.balanceDue) || 0,
      taxRate: parseFloat(serviceBillData.taxRate) || 0,
      // Ensure service items have proper numeric values and an amount field
      serviceItems: serviceBillData.serviceItems.map(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = (item.amount !== undefined && item.amount !== null && item.amount !== "")
          ? parseFloat(item.amount) || 0
          : rate * quantity;
        return {
          ...item,
          quantity,
          rate,
          amount,
        };
      })
    };

    console.log("Generating PDF with data:", {
      customerName: tempServiceBill.customerName,
      serviceItemsCount: tempServiceBill.serviceItems?.length,
      totalAmount: tempServiceBill.totalAmount,
      serviceItemsSample: tempServiceBill.serviceItems?.slice(0, 2).map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        rateType: typeof item.rate
      }))
    });

    // Generate PDF directly without saving to database
    const pdfBuffer = await generateServiceBillPDF(tempServiceBill, true); // true indicates return buffer

    console.log("PDF generated successfully, buffer size:", pdfBuffer.length);
    console.log("PDF buffer type:", typeof pdfBuffer);
    console.log("PDF buffer constructor:", pdfBuffer.constructor.name);

    // Send PDF directly as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=service-bill-preview.pdf');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log("Preview PDF generated successfully");
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Error generating preview PDF:", error);
    console.error("Error stack:", error.stack);
    
    // Send a more detailed error response
    res.status(500).json({ 
      message: "Error generating preview PDF",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Add this to your serviceBillController.js
exports.downloadServiceBillPDF = async (req, res) => {
  console.log("Downloading service bill PDF for ID:", req.params.id);
  console.log("User making request:", req.user.email);
  
  try {
    // Allow admin to download any bill, staff to download their own or bills with visibility 'staff'
    let query = { _id: req.params.id };
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      // Admin and staff can download any bill
      // No extra filter
    } else {
      // Other users: only their own bills
      query.user = req.user.id;
    }

    const serviceBill = await ServiceBill.findOne(query);

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    // Generate PDF directly from service bill data
    const pdfBuffer = await generateServiceBillPDF(serviceBill, true); // true indicates return buffer

    // Send PDF directly as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=service-bill-${serviceBill.billNumber || serviceBill._id}.pdf`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log("Download PDF generated successfully");
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ 
      success: false,
      message: "Error generating PDF",
      error: error.message 
    });
  }
};
// Get single service bill
exports.getServiceBill = async (req, res) => {
  try {
    const serviceBill = await ServiceBill.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: 'staff' }, // Or records marked as visible to staff
        // Or if staff should see all records for the registration number:
        ...(req.user.role === 'staff' ? [{}] : []) // Staff can see all matching registration numbers
      ]
    });

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    res.status(200).json({
      success: true,
      data: serviceBill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update service bill
exports.updateServiceBill = async (req, res) => {
  try {
    // Allow staff and admin to update their own bills
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }
    let serviceBill = await ServiceBill.findOne(query);

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    // Update fields
    serviceBill = Object.assign(serviceBill, req.body);

    // Recalculate amounts if relevant fields are updated
    if (
      req.body.serviceItems ||
      req.body.discount ||
      req.body.taxRate ||
      req.body.advancePaid
    ) {
      serviceBill.totalAmount = serviceBill.serviceItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = (item.amount !== undefined && item.amount !== null && item.amount !== "")
          ? parseFloat(item.amount) || 0
          : rate * qty;
        return sum + amount;
      }, 0);
      serviceBill.taxAmount =
        (serviceBill.taxRate / 100) * serviceBill.totalAmount;
      serviceBill.grandTotal =
        serviceBill.totalAmount +
        serviceBill.taxAmount -
        (serviceBill.discount || 0);
      serviceBill.balanceDue =
        serviceBill.grandTotal - (serviceBill.advancePaid || 0);
    }

    await serviceBill.save();

    // Regenerate PDF if needed
    if (
      req.body.serviceItems ||
      req.body.taxRate ||
      req.body.discount ||
      req.body.advancePaid
    ) {
      const pdfUrl = await generateServiceBillPDF(serviceBill);
      serviceBill.pdfUrl = pdfUrl;
      await serviceBill.save();
    }

    res.status(200).json({
      success: true,
      data: serviceBill,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete service bill
exports.deleteServiceBill = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update service bills" });
    }
    const serviceBill = await ServiceBill.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Generate PDF for service bill
exports.generateServiceBillPDF = async (req, res) => {
  try {
    const serviceBill = await ServiceBill.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: 'staff' }, // Or records marked as visible to staff
        // Or if staff should see all records for the registration number:
        ...(req.user.role === 'staff' ? [{}] : []) // Staff can see all matching registration numbers
      ]
    });

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    const pdfBuffer = await generateServiceBillPDF(serviceBill, true);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=service-bill-${serviceBill.billNumber}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
    });
  }
};

// Generate PDF buffer for offline use
exports.generatePDFBuffer = async (req, res) => {
  try {
    const serviceBillData = req.body;
    
    // Validate required fields
    if (!serviceBillData.serviceItems || !Array.isArray(serviceBillData.serviceItems)) {
      return res.status(400).json({
        success: false,
        message: "Service items are required and must be an array"
      });
    }

    // Generate PDF buffer without saving to database
    const pdfBuffer = await generateServiceBillPDF(serviceBillData, true);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=service-bill-${Date.now()}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF buffer:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message
    });
  }
};
