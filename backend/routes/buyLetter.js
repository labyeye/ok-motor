const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createBuyLetter,
  getBuyLetters,
  getBuyLetterById,
  updateBuyLetter,
  deleteBuyLetter,
  getBuyLettersByRegistration,
} = require("../controllers/buyLetterController");

// Protect all routes
router.use(protect);

router.route("/").post(createBuyLetter).get(getBuyLetters);
router.route("/by-registration").get(getBuyLettersByRegistration);

router
  .route("/:id")
  .get(getBuyLetterById)
  .put(updateBuyLetter)
  .delete(deleteBuyLetter);

module.exports = router;
