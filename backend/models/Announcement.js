const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    link: { type: String },
    active: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", AnnouncementSchema);

