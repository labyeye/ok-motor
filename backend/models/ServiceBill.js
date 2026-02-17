const mongoose = require("mongoose");

const ServiceBillSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      index: true,
    },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerEmail: { type: String },

    vehicleType: {
      type: String,
      enum: ["bike", "scooter", "car", "other"],
    },
    vehicleBrand: { type: String },
    vehicleModel: { type: String },
    registrationNumber: { type: String },
    chassisNumber: { type: String },
    engineNumber: { type: String },
    kmReading: { type: Number },

    serviceDate: { type: Date, required: true, default: Date.now },
    deliveryDate: { type: Date, required: true },
    serviceType: {
      type: String,
      required: true,
      enum: ["regular", "free"],
    },
    serviceItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        rate: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    discountPercentage: { type: Number, default: 0 },
    taxEnabled: { type: Boolean, default: false },
    businessName: { type: String },
    businessGSTIN: { type: String },
    businessAddress: { type: String },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "card", "upi", "bank transfer"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    advancePaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    customServiceDescription: { type: String },

    issuesReported: { type: String },
    technicianNotes: { type: String },
    warrantyInfo: { type: String },

    originalDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBill",
      default: null,
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBill",
      default: null,
    },
    version: { type: Number, default: 1 },
    editedAt: { type: Date },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visibility: {
      type: String,
      enum: ["admin", "staff", "all"],
      default: "staff",
    },

    pdfUrl: { type: String },
    billNumber: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ServiceBillSchema.pre("save", async function (next) {
  if (!this.billNumber) {
    let billNumber;
    let attempts = 0;
    const maxAttempts = 10;

    const getFinancialYear = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-11 (Jan is 0)
      if (month >= 3) {
        // April onwards
        return `${year}-${String(year + 1).slice(-2)}`;
      } else {
        return `${year - 1}-${String(year).slice(-2)}`;
      }
    };

    while (attempts < maxAttempts) {
      try {
        const count = await this.constructor.countDocuments();
        const fy = getFinancialYear();
        billNumber = `OKMTR-${fy}-${(count + 1 + attempts)
          .toString()
          .padStart(5, "0")}`;

        const existing = await this.constructor.findOne({ billNumber });
        if (!existing) {
          this.billNumber = billNumber;
          break;
        }
        attempts++;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          const fy = getFinancialYear();
          this.billNumber = `OKMTR-${fy}-${Date.now().toString().slice(-5)}`;
          break;
        }
      }
    }
  }

  if (
    this.isModified("serviceItems") ||
    this.isModified("discount") ||
    this.isModified("discountPercentage") ||
    this.isModified("discountType") ||
    this.isModified("taxRate")
  ) {
    this.totalAmount = this.serviceItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0,
    );
    this.taxAmount = (this.taxRate / 100) * this.totalAmount;

    let discountAmount = 0;
    if (this.discountType === "percentage") {
      discountAmount = (this.discountPercentage / 100) * this.totalAmount;
    } else {
      discountAmount = this.discount || 0;
    }

    this.grandTotal = this.totalAmount + this.taxAmount - discountAmount;
    this.balanceDue = this.grandTotal - (this.advancePaid || 0);
  }

  next();
});

module.exports = mongoose.model("ServiceBill", ServiceBillSchema);
