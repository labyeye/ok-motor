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

// Protect all routes
router.use(protect);

router.route("/").post(createBuyLetter).get(getBuyLetters);
router.route("/by-registration").get(getBuyLettersByRegistration);

router
  .route("/:id")
  .get(getBuyLetterById)
  .put(admin,updateBuyLetter)
  .delete(admin,deleteBuyLetter);

module.exports = router;
