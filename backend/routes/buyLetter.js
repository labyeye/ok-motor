const express = require("express");
const router = express.Router();
const { protect ,admin} = require("../middleware/auth");
const {
  createBuyLetter,
  getBuyLetters,
  getBuyLetterById,
  updateBuyLetter,
  deleteBuyLetter,
  getBuyLettersByRegistration,
} = require("../controllers/buyLetterController");
const generateBuyLetterPDF = require("../utils/generateBuyLetterPDF");

// Protect all routes
router.use(protect);

// Generate PDF buffer route (for offline use)
router.post("/generate-pdf", protect, async (req, res) => {
  try {
    const { language = "hindi" } = req.query;
    const buyLetterData = req.body;

    // Validate required fields
    if (!buyLetterData) {
      return res.status(400).json({
        success: false,
        message: "Buy letter data is required"
      });
    }

    // Generate PDF buffer without saving to database
    const pdfBuffer = await generateBuyLetterPDF(buyLetterData, true, language);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=buy-letter-${Date.now()}.pdf`,
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

router.route("/").post(createBuyLetter).get(getBuyLetters);
router.route("/by-registration").get(getBuyLettersByRegistration);

router
  .route("/:id")
  .get(getBuyLetterById)
  .put(admin,updateBuyLetter)
  .delete(admin,deleteBuyLetter);

module.exports = router;
