const express = require("express");
const router = express.Router();
const serviceBillController = require("../controllers/serviceBillController");
const { protect, admin } = require("../middleware/auth");

router.get("/debug", (req, res) => {
  res.json({ 
    message: "Service bill API is working", 
    timestamp: new Date().toISOString(),
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    }
  });
});

router
  .route("/")
  .get(protect, serviceBillController.getServiceBills)
  .post(protect, serviceBillController.createServiceBill);

router
  .route("/preview")
  .post(protect, serviceBillController.previewServiceBillPDF);

router
  .route("/generate-pdf")
  .post(protect, serviceBillController.generatePDFBuffer);

router
  .route("/by-registration")
  .get(protect, serviceBillController.getServiceBillsByRegistration);

router
  .route("/:id/pdf")
  .get(protect, serviceBillController.generateServiceBillPDF);

router
  .route("/:id/download")
  .get(protect, serviceBillController.downloadServiceBillPDF);

router
  .route("/:id")
  .get(protect, serviceBillController.getServiceBill)
  .put(protect, serviceBillController.updateServiceBill)
  .delete(protect, serviceBillController.deleteServiceBill);

router
  .route("/vehicle-details")
  .get(protect, serviceBillController.getVehicleDetails);

module.exports = router;
