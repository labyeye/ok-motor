const mongoose = require("mongoose");

const LetterHeadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    letterNumber: { type: String, unique: true },
    date: { type: Date, required: true, default: Date.now },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LetterHeadSchema.pre("save", async function (next) {
  if (!this.letterNumber) {
    let letterNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const count = await this.constructor.countDocuments();
        letterNumber = `LTR-${new Date().getFullYear()}-${(count + 1 + attempts)
          .toString()
          .padStart(5, "0")}`;

        const existing = await this.constructor.findOne({ letterNumber });
        if (!existing) {
          this.letterNumber = letterNumber;
          break;
        }
        attempts++;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          this.letterNumber = `LTR-${new Date().getFullYear()}-${Date.now()
            .toString()
            .slice(-5)}`;
          break;
        }
      }
    }
  }
  next();
});

module.exports = mongoose.model("LetterHead", LetterHeadSchema);
