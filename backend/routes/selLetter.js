// routes/sellLetter.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSellLetter,
  getSellLetters,
  getSellLetterById,
  updateSellLetter,
  deleteSellLetter,
  getMySellLetters // Add this new controller
} = require('../controllers/sellLetterController');

// Protect all routes
router.use(protect);

router.route('/')
  .post(createSellLetter)
  .get(getSellLetters);

router.route('/my-letters')
  .get(getMySellLetters); // Add this new route

router.route('/:id')
  .get(getSellLetterById)
  .put(updateSellLetter)
  .delete(deleteSellLetter);

module.exports = router;