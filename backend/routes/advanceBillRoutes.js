// routes/advanceBills.js
const express = require("express");
const router = express.Router();
const generateAdvanceBillPDF = require("../utils/generateAdvanceBillPDF");
const AdvanceBill = require("../models/AdvanceBill");
const { protect } = require("../middleware/auth");
const BuyLetter = require("../models/BuyLetter");
const SellLetter = require("../models/SellLetter");
router.get("/pdf/:filename", protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads/advance-bills", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);

    const fileStream = fs.createReadStream(filePath);
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
    }).sort({ createdAt: -1 });

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

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const advanceBillData = {
      ...req.body,
      user: req.user.id || req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Ensure numeric values
    const totalAmount = parseFloat(advanceBillData.totalAmount) || 0;
    const advancePaid = parseFloat(advanceBillData.advancePaid) || 0;

    // Calculate amounts
    advanceBillData.grandTotal = totalAmount.toFixed(2);
    advanceBillData.balanceDue = (
      advanceBillData.grandTotal - advancePaid
    ).toFixed(2);

    // Save to database
    const advanceBill = new AdvanceBill(advanceBillData);
    const savedBill = await advanceBill.save();

    const filename = await generateAdvanceBillPDF(savedBill, false);

    // Update bill with PDF filename
    savedBill.pdfUrl = `/api/advance-bills/pdf/${filename}`;
    await savedBill.save();

    res.status(201).json({
      success: true,
      message: "Advance bill created successfully",
      data: savedBill,
    });
  } catch (error) {
    console.error("Error creating advance bill:", error);
    res.status(500).json({
      success: false,
      message: error.message, // Include the actual error message
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Download advance bill PDF
router.get("/:id/download", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const advanceBill = await AdvanceBill.findById(id);

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
    const advanceBills = await AdvanceBill.find({
      user: req.user.id || req.user._id,
    }).sort({ createdAt: -1 });

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
    });
  }
});

// Get single advance bill
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
