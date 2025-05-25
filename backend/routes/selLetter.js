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
  getSellLettersByRegistration
} = require('../controllers/sellLetterController');

// Protect all routes
router.use(protect);

// Specific routes first
router.route('/by-registration').get(getSellLettersByRegistration); // Changed from /get-sell
router.route('/my-letters').get(getMySellLetters); // Changed from /my-letters

// General routes
router.route('/')
  .post(createSellLetter)
  .get(getSellLetters);

// Parameterized routes last
router.route('/:id')
  .get(getSellLetterById)
  .put(admin,updateSellLetter)
  .delete(admin,deleteSellLetter);

module.exports = router;