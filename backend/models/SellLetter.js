const mongoose = require("mongoose");

const SellLetterSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      index: true,
    },

    vehicleName: { type: String },
    vehicleModel: { type: String },
    vehicleColor: { type: String },
    registrationNumber: {
      type: String,
      index: true,
    },
    chassisNumber: { type: String },
    engineNumber: { type: String },
    vehiclekm: { type: String },
    vehicleCondition: { type: String, enum: ["running", "notRunning"] },

    pucIssueDate: { type: Date },
    pucExpiryDate: { type: Date },
    pucStatus: {
      type: String,
      enum: ["Valid", "Expired", "Not Available"],
    },

    insuranceStatus: {
      type: String,
      enum: ["Valid", "Expired", "Not Available"],
    },
    insuranceExpiryDate: {
      type: Date,
    },
    insuranceCompany: {
      type: String,
      trim: true,
    },
    insurancePolicyNumber: {
      type: String,
      trim: true,
    },

    buyerName: { type: String, required: true },
    buyerFatherName: { type: String, required: true },
    buyerAddress: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    buyerPhone2: { type: String, required: true },
    buyerEmail: { type: String },
    buyerAadhar: { type: String, required: true },

    saleDate: { type: Date, required: true, default: Date.now },
    saleTime: { type: String },
    saleAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "upi", "bankTransfer", "loan", "soldloan", "other"],
    },
    todayDate: { type: Date },
    todayTime: { type: String },
    previousDate: { type: Date },
    previousTime: { type: String },

    witnessName: { type: String, required: true },
    witnessPhone: { type: String, required: true },

    note: { type: String },

    documentsVerified: { type: Boolean, default: true },

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
      vehicleKM: { type: String },
      vehiclePhotos: [{ type: String }],
      meta: { type: Object },
    },

    originalDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellLetter",
      default: null,
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellLetter",
      default: null,
    },
    version: { type: Number, default: 1 },
    editedAt: { type: Date },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SellLetter", SellLetterSchema);
