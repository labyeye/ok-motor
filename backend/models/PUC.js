const mongoose = require("mongoose");

const PUCSchema = new mongoose.Schema(
  {
    personName: { type: String, required: true },
    personPhone: { type: String }, // Phone number
    vehicleModel: { type: String },
    brand: { type: String },
    year: { type: String },
    regNo: { type: String, required: true },
    pucNumber: { type: String },
    pucExpiry: { type: Date, required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PUC", PUCSchema);
