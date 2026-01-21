const mongoose = require("mongoose");

const advanceBillSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    customerAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    customerEmail: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    vehicleType: {
      type: String,
      enum: ["bike", "scooter", "car", "other"],
      lowercase: true,
    },
    vehicleBrand: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    vehicleModel: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
    },
    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    kmReading: {
      type: Number,
      min: 0,
      default: 0,
    },

    serviceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    advancePaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "card", "upi", "bank transfer"],
      lowercase: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    pdfUrl: { type: String },

    billNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    originalDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdvanceBill",
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdvanceBill",
    },
    version: {
      type: Number,
      default: 1,
    },
    editedAt: {
      type: Date,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

advanceBillSchema.pre("save", async function (next) {
  try {
    if (
      this.isModified("totalAmount") ||
      this.isModified("advancePaid") ||
      this.isModified("discount")
    ) {
      this.grandTotal = this.totalAmount - (this.discount || 0);
      this.balanceDue = this.grandTotal - this.advancePaid;
    }

    if (!this.billNumber) {
      const getFinancialYear = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = d.getMonth();
        if (month >= 3) {
          return `${year}-${String(year + 1).slice(-2)}`;
        } else {
          return `${year - 1}-${String(year).slice(-2)}`;
        }
      };

      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        try {
          const count = await this.constructor.countDocuments();
          const fy = getFinancialYear();
          const candidate = `OKMTR-ADV-${fy}-${(count + 1 + attempts)
            .toString()
            .padStart(5, "0")}`;

          const existing = await this.constructor
            .findOne({ billNumber: candidate })
            .lean()
            .exec();
          if (!existing) {
            this.billNumber = candidate;
            break;
          }
          attempts += 1;
        } catch (err) {
          attempts += 1;
        }
      }

      if (!this.billNumber) {
        const fy = getFinancialYear();
        this.billNumber = `OKMTR-ADV-${fy}-${Date.now().toString().slice(-5)}`;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

advanceBillSchema.virtual("formattedTotalAmount").get(function () {
  const val = this.totalAmount != null ? Number(this.totalAmount) : 0;
  return `₹${val.toFixed(2)}`;
});

advanceBillSchema.virtual("formattedAdvancePaid").get(function () {
  const val = this.advancePaid != null ? Number(this.advancePaid) : 0;
  return `₹${val.toFixed(2)}`;
});

advanceBillSchema.virtual("formattedBalanceDue").get(function () {
  const val = this.balanceDue != null ? Number(this.balanceDue) : 0;
  return `₹${val.toFixed(2)}`;
});
advanceBillSchema.virtual("formattedDiscount").get(function () {
  const val = this.discount != null ? Number(this.discount) : 0;
  return `₹${val.toFixed(2)}`;
});

advanceBillSchema.set("toJSON", { virtuals: true });
advanceBillSchema.set("toObject", { virtuals: true });

advanceBillSchema.index({ user: 1, createdAt: -1 });
advanceBillSchema.index({ billNumber: 1 });
advanceBillSchema.index({ registrationNumber: 1 });

module.exports = mongoose.model("AdvanceBill", advanceBillSchema);
