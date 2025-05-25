// routes/serviceBillRoutes.js
const express = require("express");
const router = express.Router();
const serviceBillController = require("../controllers/serviceBillController");
const { protect } = require("../middleware/auth");

router
  .route("/")
  .get(protect, serviceBillController.getServiceBills)
  .post(protect, serviceBillController.createServiceBill);
  router
  .route("/by-registration")
  .get(protect, serviceBillController.getServiceBillsByRegistration);
router
  .route("/:id")
  .get(protect, serviceBillController.getServiceBill)
  .put(protect, serviceBillController.updateServiceBill)
  .delete(protect, serviceBillController.deleteServiceBill);

router
  .route("/:id/pdf")
  .get(protect, serviceBillController.generateServiceBillPDF);
// In serviceBillRoutes.js, add a new route
router
  .route("/:id/download")
  .get(protect, serviceBillController.downloadServiceBillPDF);

module.exports = router;
