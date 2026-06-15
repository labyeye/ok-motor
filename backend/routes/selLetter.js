const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const {
  createSellLetter,
  getSellLetters,
  getSellLetterById,
  updateSellLetter,
  deleteSellLetter,
  getMySellLetters,
  getSellLettersByRegistration,
  getVehicleDetails,
} = require("../controllers/sellLetterController");
const multer = require("multer");
const upload = multer();

router.use(protect);

router.route("/by-registration").get(getSellLettersByRegistration);
router.route("/my-letters").get(getMySellLetters);
router.route("/all").get(getMySellLetters);

router.route("/").post(createSellLetter).get(getSellLetters);

router.route("/vehicle-details").get(getVehicleDetails);
router
  .route("/:id")
  .get(getSellLetterById)
  .put(updateSellLetter)
  .delete(admin, deleteSellLetter);

module.exports = router;
