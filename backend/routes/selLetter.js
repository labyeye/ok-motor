
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
const multer = require('multer');
const upload = multer();

router.use(protect);

// Note: PDF generation is intentionally handled on the frontend.
// Removed backend PDF route to keep backend responsibilities limited to image upload and data storage.

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