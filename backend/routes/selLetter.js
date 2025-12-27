
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

router.use(protect);

router.post("/generate-pdf", protect, async (req, res) => {
  try {
    const { language = "hindi" } = req.query;
    const sellLetterData = req.body;

    if (!sellLetterData) {
      return res.status(400).json({
        success: false,
        message: "Sell letter data is required"
      });
    }

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

router.route('/by-registration').get(getSellLettersByRegistration); 
router.route('/my-letters').get(getMySellLetters); 

router.route('/')
  .post(createSellLetter)
  .get(getSellLetters);

router.route('/vehicle-details').get(getVehicleDetails)
router.route('/:id')
  .get(getSellLetterById)
  .put(admin,updateSellLetter)
  .delete(admin,deleteSellLetter);

module.exports = router;