// models/BuyLetter.js
const mongoose = require("mongoose");

const BuyLetterSchema = new mongoose.Schema({
  // Seller Information
  sellerName: { type: String, required: true },
  sellerFatherName: { type: String, required: true },
  sellerCurrentAddress: { type: String, required: true },
  selleraadhar: { type: String },
  sellerpan: { type: String },
  selleraadharphone: { type: String },
  selleraadharphone2: { type: String },

  // Vehicle Information
  vehicleName: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  vehicleColor: { type: String, required: true },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  chassisNumber: { type: String, required: true },
  engineNumber: { type: String, required: true },
  vehiclekm: { type: String },
  vehicleCondition: {
    type: String,
    required: true,
    enum: ["running", "notRunning"],
  },

  // Buyer Information
  buyerName: { type: String, required: true },
  buyerFatherName: { type: String, required: true },
  buyerCurrentAddress: { type: String, required: true },
  buyernames: { type: String },
  buyerphone: { type: String },

  //Witness Information
  witnessname: { type: String },
  witnessphone: { type: String },

  dealername: { type: String },
  dealeraddress: { type: String },

  //Return Information
  returnpersonname: { type: String },

  // Sale Details
  saleDate: { type: Date, required: true },
  saleTime: { type: String },
  saleAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "check", "bankTransfer", "other"],
  },
  todayDate: { type: Date },
  todayTime: { type: String },

  // Additional Information
  documentsVerified1: { type: Boolean, default: true },
  note: { type: String },

  // Reference to user who created it
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // PDF generation info
  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BuyLetter", BuyLetterSchema);
