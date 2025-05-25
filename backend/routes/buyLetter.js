const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBuyLetter,
  getBuyLetters,
  getBuyLetterById,
  updateBuyLetter,
  deleteBuyLetter
} = require('../controllers/buyLetterController');

// Protect all routes
router.use(protect);

router.route('/')
  .post(createBuyLetter)
  .get(getBuyLetters);

router.route('/:id')
  .get(getBuyLetterById)
  .put(updateBuyLetter)
  .delete(deleteBuyLetter);

module.exports = router;