const express = require("express");
const router = express.Router();
const {
  createLetterHead,
  getLetterHeads,
  getLetterHeadById,
  updateLetterHead,
  deleteLetterHead,
} = require("../controllers/letterHeadController");
const { protect } = require("../middleware/auth");

router.route("/").post(protect, createLetterHead).get(protect, getLetterHeads);

router
  .route("/:id")
  .get(protect, getLetterHeadById)
  .put(protect, updateLetterHead)
  .delete(protect, deleteLetterHead);

module.exports = router;
