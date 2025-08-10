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

    // Calculate amounts
    const totalAmount = serviceItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const taxAmount = (otherData.taxRate / 100) * totalAmount;
    const grandTotal = totalAmount + taxAmount - (otherData.discount || 0);
    const balanceDue = grandTotal - (otherData.advancePaid || 0);

    const serviceBillData = {
      ...otherData,
      serviceItems,
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
    const serviceBills = await ServiceBill.find({ $or: [
      { user: req.user.id }, // Records created by the current user
      { visibility: 'staff' }, // Or records marked as visible to staff
      // Or if staff should see all records for the registration number:
      ...(req.user.role === 'staff' ? [{}] : []) // Staff can see all matching registration numbers
    ] }).sort({
      createdAt: -1,
    });

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
        { user: req.user.id }, // Records created by the current user
        { visibility: 'staff' }, // Or records marked as visible to staff
        // Or if staff should see all records for the registration number:
        ...(req.user.role === 'staff' ? [{}] : []) // Staff can see all matching registration numbers
      ]
    }).sort({ createdAt: -1 });

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
  
  try {
    const serviceBillData = req.body;
    
    // Create a temporary service bill object (not saved to database)
    const tempServiceBill = {
      ...serviceBillData,
      _id: "preview", // Temporary ID for preview
    };

    // Generate PDF directly without saving to database
    const pdfBuffer = await generateServiceBillPDF(tempServiceBill, true); // true indicates return buffer

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
    res.status(500).json({ 
      message: "Error generating preview PDF",
      error: error.message 
    });
  }
};

// Add this to your serviceBillController.js
exports.downloadServiceBillPDF = async (req, res) => {
  console.log("Downloading service bill PDF for ID:", req.params.id);
  console.log("User making request:", req.user.email);
  
  try {
    const serviceBill = await ServiceBill.findOne({ _id: req.params.id, user: req.user.id });

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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update service bills" });
    }
    let serviceBill = await ServiceBill.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

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
      serviceBill.totalAmount = serviceBill.serviceItems.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0
      );
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
