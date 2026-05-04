const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileId: { type: String, required: true },
  name: { type: String },
});

const SellRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    brand: { type: String },
    model: { type: String },
    year: { type: String },
    price: { type: Number },
    images: [ImageSchema],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SellRequest", SellRequestSchema);
