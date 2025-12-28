const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  getCurrentAnnouncement,
} = require("../controllers/announcementController");

router.route("/").get(listAnnouncements).post(protect, createAnnouncement);
router.route("/current").get(getCurrentAnnouncement);
router
  .route("/:id")
  .put(protect, updateAnnouncement)
  .delete(protect, deleteAnnouncement);

module.exports = router;
