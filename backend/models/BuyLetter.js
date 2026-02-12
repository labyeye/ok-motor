const mongoose = require("mongoose");

const BuyLetterSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    index: true,
  },

  sellerName: { type: String, required: true },
  sellerFatherName: { type: String, required: true },
  sellerCurrentAddress: { type: String, required: true },
  selleraadhar: { type: String },
  sellerpan: { type: String },
  selleraadharphone: { type: String },
  selleraadharphone2: { type: String },

  vehicleName: { type: String },
  vehicleModel: { type: String },
  vehicleColor: { type: String },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  chassisNumber: { type: String },
  engineNumber: { type: String },
  vehiclekm: { type: String },
  vehicleCondition: {
    type: String,
    enum: ["running", "notRunning"],
  },

  buyerName: { type: String, required: true },
  buyerFatherName: { type: String, required: true },
  buyerCurrentAddress: { type: String, required: true },
  buyernames: { type: String },
  buyerphone: { type: String },

  witnessname: { type: String },
  witnessphone: { type: String },

  dealername: { type: String },
  dealeraddress: { type: String },

  returnpersonname: { type: String },

  saleDate: { type: Date, required: true },
  saleTime: { type: String },
  saleAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "upi", "bankTransfer", "loan", "soldloan"],
  },
  todayDate: { type: Date },
  todayTime: { type: String },

  documents: {
    vehicleRC: {
      front: { type: String },
      back: { type: String },
    },
    vehicleRCUploadMode: {
      type: String,
      enum: ["single", "separate"],
      default: "separate",
    },
    aadhaar: {
      front: { type: String },
      back: { type: String },
    },
    aadhaarUploadMode: {
      type: String,
      enum: ["single", "separate"],
      default: "separate",
    },
    pan: { type: String },
    deliveryPhoto: { type: String },
    insuranceNOC: {
      // store NOC as ordered array of page URLs (each page can be image or single-page PDF)
      pages: [{ type: String }],
    },
    insuranceNOCUploadMode: {
      type: String,
      enum: ["single", "separate"],
      default: "separate",
    },
    vehiclePhotos: [{ type: String }],
    meta: {
      uploadedAt: { type: Date },
      uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },

  documentsVerified1: { type: Boolean, default: true },
  note: { type: String },

  originalDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BuyLetter",
    default: null,
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BuyLetter",
    default: null,
  },
  version: { type: Number, default: 1 },
  editedAt: { type: Date },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BuyLetter", BuyLetterSchema);
