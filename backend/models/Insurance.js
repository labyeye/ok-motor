const mongoose = require("mongoose");

const InsuranceSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    personPhone: { type: String },
    personAlternateNo: { type: String },
    personEmail: { type: String },
    sourceType: {
      type: String,
      enum: ["manual", "buy-letter", "sell-letter"],
      default: "manual",
    },
    vehicleModel: { type: String },
    brand: { type: String },
    year: { type: String },

    regNo: { type: String, required: true },

    vehicleRegNo: { type: String, index: true },
    insurancePolicyNo: { type: String },
    insurancePolicyNumber: { type: String },
    insuranceCompany: { type: String },
    insuranceExpiry: { type: Date },
    insuranceExpiryDate: { type: Date },
    insuranceStatus: { type: String },

    originalDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Insurance",
      default: null,
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Insurance",
      default: null,
    },
    version: { type: Number, default: 1 },
    editedAt: { type: Date },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Insurance", InsuranceSchema);
