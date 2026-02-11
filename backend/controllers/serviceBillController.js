const ServiceBill = require("../models/ServiceBill");
const { generateServiceBillPDF } = require("../utils/pdfGenerator");
const fs = require("fs");
const path = require("path");
const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");
const Vehicle = require("../models/Vehicle");

exports.getVehicleDetails = async (req, res) => {
  try {
    const { registrationNumber } = req.query;

    if (!registrationNumber) {
      return res.status(400).json({
        message: "Registration number is required",
      });
    }
    const regex = new RegExp(registrationNumber, "i");

    const [buyLetter, sellLetter, serviceBill, vehicle] = await Promise.all([
      BuyLetter.findOne({ registrationNumber: regex })
        .sort({ createdAt: -1 })
        .select("vehicleName vehicleModel registrationNumber vehiclekm"),

      SellLetter.findOne({ registrationNumber: regex })
        .sort({ createdAt: -1 })
        .select("vehicleName vehicleModel registrationNumber vehiclekm"),

      ServiceBill.findOne({ registrationNumber: regex })
        .sort({ createdAt: -1 })
        .select("vehicleBrand vehicleModel registrationNumber kmReading"),

      Vehicle.findOne({ registrationNumber: regex, isActive: true }).sort({
        createdAt: -1,
      }),
    ]);

    const vehicleRecord = vehicle || buyLetter || sellLetter || serviceBill;

    if (!vehicleRecord) {
      return res.status(404).json({
        message: "No vehicle found with this registration number",
      });
    }

    const vehicleDetails = {
      vehicleBrand: vehicleRecord.vehicleName || vehicleRecord.vehicleBrand,
      vehicleModel: vehicleRecord.vehicleModel,
      registrationNumber: vehicleRecord.registrationNumber,
      kmReading:
        vehicleRecord.vehiclekm ||
        vehicleRecord.kmReading ||
        vehicleRecord.kilometersRun,
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

exports.createServiceBill = async (req, res) => {
  console.log("Creating service bill...");
  try {
    const { serviceItems, ...otherData } = req.body;

    console.log(
      "Received service bill data:",
      JSON.stringify({ serviceItems, ...otherData }, null, 2)
    );

    if (otherData.vehicle) {
      const vehicle = await Vehicle.findById(otherData.vehicle);
      if (vehicle) {
        otherData.vehicleType = vehicle.vehicleType?.toLowerCase();
        otherData.vehicleBrand = vehicle.vehicleName;
        otherData.vehicleModel = vehicle.vehicleModel;
        otherData.registrationNumber = vehicle.registrationNumber;
        otherData.chassisNumber = vehicle.chassisNumber;
        otherData.engineNumber = vehicle.engineNumber;
        otherData.kmReading = vehicle.kilometersRun;
      }
    }

    const requiredFields = [
      "customerName",
      "customerPhone",
      "customerAddress",
      "vehicleBrand",
      "vehicleModel",
      "registrationNumber",
    ];
    const missingFields = requiredFields.filter((field) => !otherData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const totalAmount = serviceItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount =
        item.amount !== undefined && item.amount !== null && item.amount !== ""
          ? parseFloat(item.amount) || 0
          : rate * qty;
      return sum + amount;
    }, 0);
    const taxAmount =
      ((parseFloat(otherData.taxRate) || 0) / 100) * totalAmount;
    const grandTotal =
      totalAmount + taxAmount - (parseFloat(otherData.discount) || 0);
    const balanceDue = grandTotal - (parseFloat(otherData.advancePaid) || 0);

    const normalizedServiceItems = serviceItems.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount =
        item.amount !== undefined && item.amount !== null && item.amount !== ""
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

    try {
      const { pdfUrl, filePath } = await generateServiceBillPDF(serviceBill);
      serviceBill.pdfUrl = pdfUrl;
      serviceBill.pdfPath = filePath;
      await serviceBill.save();
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
    }

    console.log("Service bill created successfully:", serviceBill._id);
    res.status(201).json({
      success: true,
      data: serviceBill,
    });
  } catch (error) {
    console.error("Error creating service bill:", error);
    if (error && (error.code === 11000 || error.name === "MongoServerError")) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error",
        error: error.keyValue || error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getServiceBills = async (req, res) => {
  try {
    const query =
      req.user.role === "staff" || req.user.role === "admin"
        ? {}
        : { user: req.user.id };
    const serviceBills = await ServiceBill.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name role");

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

exports.getServiceBillsByRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.query;
    if (!registrationNumber) {
      return res
        .status(400)
        .json({ message: "Registration number is required" });
    }

    const serviceBills = await ServiceBill.find({
      registrationNumber: new RegExp(registrationNumber, "i"),
      $or: [
        { user: req.user.id },
        { visibility: "staff" },
        ...(req.user.role === "staff" ? [{}] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .populate("user", "name role");

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

exports.previewServiceBillPDF = async (req, res) => {
  console.log("Generating preview PDF...");
  console.log("User making request:", req.user.email);
  console.log("Request body keys:", Object.keys(req.body));
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    const serviceBillData = req.body;

    if (!serviceBillData.customerName || !serviceBillData.serviceItems) {
      console.log("Missing required fields:", {
        customerName: !!serviceBillData.customerName,
        serviceItems: !!serviceBillData.serviceItems,
      });
      return res.status(400).json({
        message:
          "Missing required fields: customerName and serviceItems are required",
      });
    }

    const tempServiceBill = {
      ...serviceBillData,
      _id: "preview",

      totalAmount: parseFloat(serviceBillData.totalAmount) || 0,
      taxAmount: parseFloat(serviceBillData.taxAmount) || 0,
      discount: parseFloat(serviceBillData.discount) || 0,
      grandTotal: parseFloat(serviceBillData.grandTotal) || 0,
      advancePaid: parseFloat(serviceBillData.advancePaid) || 0,
      balanceDue: parseFloat(serviceBillData.balanceDue) || 0,
      taxRate: parseFloat(serviceBillData.taxRate) || 0,

      serviceItems: serviceBillData.serviceItems.map((item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount =
          item.amount !== undefined &&
          item.amount !== null &&
          item.amount !== ""
            ? parseFloat(item.amount) || 0
            : rate * quantity;
        return {
          ...item,
          quantity,
          rate,
          amount,
        };
      }),
    };

    console.log("Generating PDF with data:", {
      customerName: tempServiceBill.customerName,
      serviceItemsCount: tempServiceBill.serviceItems?.length,
      totalAmount: tempServiceBill.totalAmount,
      serviceItemsSample: tempServiceBill.serviceItems
        ?.slice(0, 2)
        .map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          rateType: typeof item.rate,
        })),
    });

    const pdfBuffer = await generateServiceBillPDF(tempServiceBill, true);

    console.log("PDF generated successfully, buffer size:", pdfBuffer.length);
    console.log("PDF buffer type:", typeof pdfBuffer);
    console.log("PDF buffer constructor:", pdfBuffer.constructor.name);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=service-bill-preview.pdf"
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    console.log("Preview PDF generated successfully");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating preview PDF:", error);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      message: "Error generating preview PDF",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.downloadServiceBillPDF = async (req, res) => {
  console.log("Downloading service bill PDF for ID:", req.params.id);
  console.log("User making request:", req.user.email);

  try {
    let query = { _id: req.params.id };
    if (req.user.role === "admin" || req.user.role === "staff") {
    } else {
      query.user = req.user.id;
    }

    const serviceBill = await ServiceBill.findOne(query);

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    const pdfBuffer = await generateServiceBillPDF(serviceBill, true);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=service-bill-${
        serviceBill.billNumber || serviceBill._id
      }.pdf`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    console.log("Download PDF generated successfully");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

exports.getServiceBill = async (req, res) => {
  try {
    const serviceBill = await ServiceBill.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { visibility: "staff" },

        ...(req.user.role === "staff" ? [{}] : []),
      ],
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

exports.updateServiceBill = async (req, res) => {
  try {
    const serviceBill = await ServiceBill.findById(req.params.id);
    if (!serviceBill) {
      return res.status(404).json({ success: false, message: "Service bill not found" });
    }

    // Permission: allow owner or admin
    if (req.user.role !== "admin" && String(serviceBill.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this service bill" });
    }

    // Prepare update data
    const updateData = { ...req.body };
    // Do not allow changing billNumber on edit
    if (updateData.billNumber) delete updateData.billNumber;

    // If serviceItems / financial fields are present, normalize and recalc totals
    const willRecalc =
      Object.prototype.hasOwnProperty.call(req.body, "serviceItems") ||
      Object.prototype.hasOwnProperty.call(req.body, "discount") ||
      Object.prototype.hasOwnProperty.call(req.body, "discountPercentage") ||
      Object.prototype.hasOwnProperty.call(req.body, "discountType") ||
      Object.prototype.hasOwnProperty.call(req.body, "taxRate") ||
      Object.prototype.hasOwnProperty.call(req.body, "advancePaid");

    if (willRecalc) {
      const items = (req.body.serviceItems && Array.isArray(req.body.serviceItems))
        ? req.body.serviceItems
        : serviceBill.serviceItems || [];

      const normalized = items.map((item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount =
          item.amount !== undefined && item.amount !== null && item.amount !== ""
            ? parseFloat(item.amount) || 0
            : rate * qty;
        return { ...item, quantity: qty, rate: rate, amount };
      });

      updateData.serviceItems = normalized;
      updateData.totalAmount = normalized.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
      updateData.taxAmount = ((parseFloat(req.body.taxRate) || parseFloat(serviceBill.taxRate) || 0) / 100) * updateData.totalAmount;

      let discountAmount = 0;
      const discountType = req.body.discountType || serviceBill.discountType || "fixed";
      if (discountType === "percentage") {
        const pct = parseFloat(req.body.discountPercentage) || parseFloat(serviceBill.discountPercentage) || 0;
        discountAmount = (pct / 100) * updateData.totalAmount;
      } else {
        discountAmount = parseFloat(req.body.discount) || parseFloat(serviceBill.discount) || 0;
      }

      updateData.grandTotal = updateData.totalAmount + updateData.taxAmount - discountAmount;
      updateData.balanceDue = updateData.grandTotal - (parseFloat(req.body.advancePaid) || parseFloat(serviceBill.advancePaid) || 0);
    }

    updateData.editedAt = new Date();
    updateData.editedBy = req.user._id;

    const updated = await ServiceBill.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });

    // Re-generate PDF if financials changed (best-effort)
    if (willRecalc) {
      try {
        const buffer = await generateServiceBillPDF(updated, true);
        // When generateServiceBillPDF returns a Buffer, we can't derive a URL here reliably.
        // Save timestamp to indicate regeneration; frontend can request fresh PDF via download route.
        await ServiceBill.findByIdAndUpdate(updated._id, { $set: { pdfUpdatedAt: new Date() } });
      } catch (pdfErr) {
        console.error("Failed generating PDF after update:", pdfErr);
      }
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating service bill:", error);
    if (error && (error.code === 11000 || error.name === "MongoServerError")) {
      return res.status(409).json({ success: false, message: "Duplicate key error", error: error.keyValue || error.message });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteServiceBill = async (req, res) => {
  try {
    // Find the service bill
    const serviceBill = await ServiceBill.findById(req.params.id);

    if (!serviceBill) {
      return res.status(404).json({
        success: false,
        message: "Service bill not found",
      });
    }

    // Allow deletion by admin or owner
    const isOwner =
      serviceBill.user && serviceBill.user.toString() === req.user.id;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this service bill",
      });
    }

    await serviceBill.deleteOne();

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

exports.generateServiceBillPDF = async (req, res) => {
  try {
    const serviceBill = await ServiceBill.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { visibility: "staff" },

        ...(req.user.role === "staff" ? [{}] : []),
      ],
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

exports.generatePDFBuffer = async (req, res) => {
  try {
    const serviceBillData = req.body;

    if (
      !serviceBillData.serviceItems ||
      !Array.isArray(serviceBillData.serviceItems)
    ) {
      return res.status(400).json({
        success: false,
        message: "Service items are required and must be an array",
      });
    }

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
      error: error.message,
    });
  }
};
