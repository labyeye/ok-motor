const express = require("express");
const router = express.Router();
const serviceBillController = require("../controllers/serviceBillController");
const { protect, admin } = require("../middleware/auth");

router
  .route("/")
  .get(protect, serviceBillController.getServiceBills)
  .post(protect, serviceBillController.createServiceBill);

// Preview route (doesn't save to database)
router
  .route("/preview")
  .post(protect, serviceBillController.previewServiceBillPDF);

router
  .route("/by-registration")
  .get(protect, serviceBillController.getServiceBillsByRegistration);

// Add more specific routes before the generic /:id route
router
  .route("/:id/pdf")
  .get(protect, serviceBillController.generateServiceBillPDF);

router
  .route("/:id/download")
  .get(protect, serviceBillController.downloadServiceBillPDF);

// Generic /:id route should come last
router
  .route("/:id")
  .get(protect, serviceBillController.getServiceBill)
  .put(admin, serviceBillController.updateServiceBill)
  .delete(protect, serviceBillController.deleteServiceBill);

router
  .route("/vehicle-details")
  .get(protect, serviceBillController.getVehicleDetails);

module.exports = router;
