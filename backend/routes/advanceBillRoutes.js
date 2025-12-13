// routes/advanceBills.js
const express = require("express");
const router = express.Router();
const generateAdvanceBillPDF = require("../utils/generateAdvanceBillPDF");
const AdvanceBill = require("../models/AdvanceBill");
const { protect } = require("../middleware/auth");
const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");
const Vehicle = require("../models/Vehicle");
const path = require("path");
const fs = require("fs");

// Preview route (doesn't save to database)
router.post("/preview", protect, async (req, res) => {
  try {
    // Increase timeout for PDF generation
    req.setTimeout(120000); // 2 minutes
    res.setTimeout(120000); // 2 minutes
    
    console.log("Generating advance bill preview PDF...");
    console.log("User making request:", req.user.email);
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const advanceBillData = req.body;
    
    // Create a temporary advance bill object (not saved to database)
    const tempAdvanceBill = {
      ...advanceBillData,
      _id: "preview", // Temporary ID for preview
    };

    // Generate PDF directly without saving to database
    const pdfBuffer = await generateAdvanceBillPDF(tempAdvanceBill, true); // true indicates return buffer

    console.log("PDF generated successfully, buffer size:", pdfBuffer.length);
    console.log("PDF buffer type:", typeof pdfBuffer);
    console.log("PDF buffer constructor:", pdfBuffer.constructor.name);

    // Send PDF directly as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=advance-bill-preview.pdf');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log("Advance bill preview PDF generated successfully");
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Error generating preview PDF:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Error generating preview PDF",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PDF preview for existing advance bill (similar to service bills)
router.get("/:id/pdf", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const advanceBill = await AdvanceBill.findOne({
      _id: id,
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: 'staff' }, // Or records marked as visible to staff
        // Or if staff/admin should see all records:
        ...(req.user.role === 'staff' || req.user.role === 'admin' ? [{}] : [])
      ]
    });

    if (!advanceBill) {
      return res.status(404).json({
        success: false,
        message: "Advance bill not found",
      });
    }

    // Generate PDF buffer for preview
    const pdfBuffer = await generateAdvanceBillPDF(advanceBill, true);

    // Set headers for PDF preview (inline display)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="advance-bill-preview-${id}.pdf"`
    );

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF preview",
      error: error.message,
    });
  }
});

router.get("/pdf/:filename", protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const primaryPath = path.join(__dirname, "../uploads/advance-bills", filename);
    const os = require('os');
    const fallbackPath = path.join(os.tmpdir(), "advance-bills", filename);

    let filePathToServe = null;
    if (fs.existsSync(primaryPath)) {
      filePathToServe = primaryPath;
    } else if (fs.existsSync(fallbackPath)) {
      filePathToServe = fallbackPath;
    } else {
      return res.status(404).json({ message: "PDF file not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);

    const fileStream = fs.createReadStream(filePathToServe);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ message: "Error serving PDF" });
  }
});
// Add this route to advanceBillRoutes.js
router.get("/by-registration", protect, async (req, res) => {
  try {
    const { registrationNumber } = req.query;

    if (!registrationNumber) {
      return res.status(400).json({
        message: "Registration number is required",
      });
    }

    const advanceBills = await AdvanceBill.find({
      registrationNumber: new RegExp(registrationNumber, "i"),
      $or: [
        { user: req.user.id },
        { visibility: "staff" },
        ...(req.user.role === "staff" || req.user.role === "admin" ? [{}] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name role');

    res.json(advanceBills);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
router.get("/vehicle-details", protect, async (req, res) => {
  try {
    const { registrationNumber } = req.query;

    if (!registrationNumber) {
      return res.status(400).json({
        message: "Registration number is required",
      });
    }

    const [buyLetters, sellLetters] = await Promise.all([
      BuyLetter.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        $or: [
          { user: req.user.id },
          { visibility: "staff" },
          ...(req.user.role === "staff" || req.user.role === "admin"
            ? [{}]
            : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(1),

      SellLetter.find({
        registrationNumber: new RegExp(registrationNumber, "i"),
        $or: [
          { user: req.user.id },
          { visibility: "staff" },
          ...(req.user.role === "staff" || req.user.role === "admin"
            ? [{}]
            : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(1),
    ]);

    const vehicleRecord = buyLetters[0] || sellLetters[0];

    if (!vehicleRecord) {
      return res.status(404).json({
        message: "No vehicle found with this registration number",
      });
    }

    const vehicleDetails = {
      vehicleName: vehicleRecord.vehicleName || vehicleRecord.vehicleBrand,
      vehicleModel: vehicleRecord.vehicleModel,
      vehicleColor: vehicleRecord.vehicleColor,
      registrationNumber: vehicleRecord.registrationNumber,
      chassisNumber: vehicleRecord.chassisNumber,
      engineNumber: vehicleRecord.engineNumber,
      vehiclekm: vehicleRecord.vehiclekm || vehicleRecord.kmReading,
    };

    res.json(vehicleDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});
// Delete advance bill
router.delete("/:id", protect, async (req, res) => {
  try {
    const advanceBill = await AdvanceBill.findById(req.params.id);

    if (!advanceBill) {
      return res.status(404).json({
        success: false,
        message: "Advance bill not found",
      });
    }

    // Check if user is authorized to delete (either owner or admin)
    if (advanceBill.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this advance bill",
      });
    }

    await AdvanceBill.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Advance bill deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting advance bill:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete advance bill",
      error: error.message,
    });
  }
});
router.post("/", protect, async (req, res) => {
  try {
    const requiredFields = [
      "customerName",
      "customerPhone",
      "vehicleType",
      "vehicleBrand",
      "registrationNumber",
      "totalAmount",
    ];

    // Build advance bill data safely
    const advanceBillData = Object.assign({}, req.body);
    
    // If vehicle reference is provided, auto-populate vehicle details
    if (advanceBillData.vehicle) {
      const vehicle = await Vehicle.findById(advanceBillData.vehicle);
      if (vehicle) {
        // Auto-populate vehicle fields from Vehicle model
        advanceBillData.vehicleType = vehicle.vehicleType?.toLowerCase();
        advanceBillData.vehicleBrand = vehicle.vehicleName;
        advanceBillData.vehicleModel = vehicle.vehicleModel;
        advanceBillData.registrationNumber = vehicle.registrationNumber;
        advanceBillData.chassisNumber = vehicle.chassisNumber;
        advanceBillData.engineNumber = vehicle.engineNumber;
        advanceBillData.kmReading = vehicle.kilometersRun;
      }
    }

    const missingFields = requiredFields.filter((field) => !advanceBillData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    advanceBillData.user = req.user && (req.user.id || req.user._id);
    advanceBillData.createdAt = new Date();
    advanceBillData.updatedAt = new Date();

    // Ensure numeric values are numbers (store as numbers, not formatted strings)
    const totalAmount = parseFloat(advanceBillData.totalAmount) || 0;
    const advancePaid = parseFloat(advanceBillData.advancePaid) || 0;
    const discount = parseFloat(advanceBillData.discount) || 0;

    // Calculate amounts
    const grandTotalNum = totalAmount - discount;
    const balanceDueNum = grandTotalNum - advancePaid;

    advanceBillData.totalAmount = totalAmount;
    advanceBillData.advancePaid = advancePaid;
    advanceBillData.discount = discount;
    advanceBillData.grandTotal = grandTotalNum;
    advanceBillData.balanceDue = balanceDueNum;

    // Save to database
    const advanceBill = new AdvanceBill(advanceBillData);
    const savedBill = await advanceBill.save();

    // Generate and attach PDF (filename returned)
    const filename = await generateAdvanceBillPDF(savedBill, false);

    if (filename) {
      savedBill.pdfUrl = `/api/advance-bills/pdf/${filename}`;
      await savedBill.save();
    } else {
      console.warn('PDF generator returned empty filename for advance bill', savedBill._id);
    }

    res.status(201).json({ success: true, message: 'Advance bill created successfully', data: savedBill });
  } catch (error) {
    console.error("Error creating advance bill:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Specific routes must come before generic /:id route to avoid conflicts

// Generate PDF buffer route (for offline use)
router.post("/generate-pdf", protect, async (req, res) => {
  try {
    // Increase timeout for PDF generation
    req.setTimeout(120000); // 2 minutes
    res.setTimeout(120000); // 2 minutes
    
    const advanceBillData = req.body;
    
    // Validate required fields
    if (!advanceBillData) {
      return res.status(400).json({
        success: false,
        message: "Advance bill data is required"
      });
    }

    // Generate PDF buffer without saving to database
    const pdfBuffer = await generateAdvanceBillPDF(advanceBillData, true);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=advance-bill-${Date.now()}.pdf`,
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
});

// Download advance bill PDF (specific route)
router.get("/:id/download", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const advanceBill = await AdvanceBill.findOne({
      _id: id,
      $or: [
        { user: req.user.id }, // Records created by the current user
        { visibility: 'staff' }, // Or records marked as visible to staff
        // Or if staff/admin should see all records:
        ...(req.user.role === 'staff' || req.user.role === 'admin' ? [{}] : [])
      ]
    });

    if (!advanceBill) {
      return res.status(404).json({
        success: false,
        message: "Advance bill not found",
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateAdvanceBillPDF(advanceBill, true);

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="advance-bill-${id}.pdf"`
    );

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get all advance bills
router.get("/", protect, async (req, res) => {
  try {
  // Staff and admin can see all bills, others only their own
  const userRole = req.user && req.user.role;
  const userId = req.user && (req.user.id || req.user._id);
  if (!req.user) console.warn('Advance bills list requested without req.user set');

  const query = (userRole === 'staff' || userRole === 'admin') ? {} : { user: userId };
    const advanceBills = await AdvanceBill.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name role');

    res.json({
      success: true,
      data: advanceBills,
    });
  } catch (error) {
    console.error("Error fetching advance bills:", error);
    res.status(500).json({
  success: false,
  message: "Failed to fetch advance bills",
  error: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});
router.get("/:id", protect, async (req, res) => {
  try {
    const advanceBill = await AdvanceBill.findById(req.params.id);
    if (!advanceBill) {
      return res.status(404).json({
        success: false,
        message: "Advance bill not found",
      });
    }

    res.json({
      success: true,
      data: advanceBill,
    });
  } catch (error) {
    console.error("Error fetching advance bill:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advance bill",
      error: error.message,
    });
  }
});

module.exports = router;
