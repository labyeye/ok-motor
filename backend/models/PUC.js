const mongoose = require("mongoose");

const PUCSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    personPhone: { type: String }, // Phone number
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
    pucNumber: { type: String },
    pucIssueDate: { type: Date },
    pucExpiry: { type: Date },
    pucExpiryDate: { type: Date },
    pucStatus: { type: String },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PUC", PUCSchema);
