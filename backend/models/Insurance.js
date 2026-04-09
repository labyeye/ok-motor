const mongoose = require("mongoose");

const InsuranceSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    personPhone: { type: String }, // Phone number
    personAlternateNo: { type: String }, // Alternate phone number
    personEmail: { type: String }, // Email address
    sourceType: {
      type: String,
      enum: ["manual", "buy-letter", "sell-letter"],
      default: "manual",
    },
    vehicleModel: { type: String },
    brand: { type: String },
    year: { type: String },
    // legacy field
    regNo: { type: String, required: true },
    // canonical fields used by other modules
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
  { timestamps: true }
);

module.exports = mongoose.model("Insurance", InsuranceSchema);
