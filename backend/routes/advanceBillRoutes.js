// routes/advanceBills.js
const express = require("express");
const router = express.Router();
const generateAdvanceBillPDF = require("../utils/generateAdvanceBillPDF");
const AdvanceBill = require("../models/AdvanceBill");
const { protect } = require("../middleware/auth");
router.get("/pdf/:filename", protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads/advance-bills", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found" });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ message: "Error serving PDF" });
  }
});
router.post("/", protect, async (req, res) => {
  try {
    const requiredFields = [
      'customerName', 
      'customerPhone',
      'vehicleType',
      'vehicleBrand',
      'registrationNumber',
      'totalAmount'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
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
    const discountAmount = parseFloat(advanceBillData.discountAmount) || 0;
    const advancePaid = parseFloat(advanceBillData.advancePaid) || 0;
    
    // Calculate amounts
    advanceBillData.grandTotal = (totalAmount - discountAmount).toFixed(2);
    advanceBillData.balanceDue = (advanceBillData.grandTotal - advancePaid).toFixed(2);

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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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