// routes/sellLetter.js
const express = require('express');
const router = express.Router();
const { protect ,admin} = require('../middleware/auth');
const {
  createSellLetter,
  getSellLetters,
  getSellLetterById,
  updateSellLetter,
  deleteSellLetter,
  getMySellLetters,
  getSellLettersByRegistration,
  getVehicleDetails
} = require('../controllers/sellLetterController');
const generateSellLetterPDF = require("../utils/generateSellLetterPDF");

// Protect all routes
router.use(protect);

// Generate PDF buffer route (for offline use)
router.post("/generate-pdf", protect, async (req, res) => {
  try {
    const { language = "hindi" } = req.query;
    const sellLetterData = req.body;

    // Validate required fields
    if (!sellLetterData) {
      return res.status(400).json({
        success: false,
        message: "Sell letter data is required"
      });
    }

    // Generate PDF buffer without saving to database
    const pdfBuffer = await generateSellLetterPDF(sellLetterData, true, language);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=sell-letter-${Date.now()}.pdf`,
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

// Specific routes first
router.route('/by-registration').get(getSellLettersByRegistration); // Changed from /get-sell
router.route('/my-letters').get(getMySellLetters); // Changed from /my-letters

// General routes
router.route('/')
  .post(createSellLetter)
  .get(getSellLetters);

router.route('/vehicle-details').get(getVehicleDetails)
router.route('/:id')
  .get(getSellLetterById)
  .put(admin,updateSellLetter)
  .delete(admin,deleteSellLetter);

module.exports = router;