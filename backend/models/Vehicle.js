const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: true,
      enum: ["Car", "Bike"],
    },

    vehicleName: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleVariant: {
      type: String,
      trim: true,
    },
    manufacturingYear: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },

    vehicleColor: {
      type: String,
      required: true,
      trim: true,
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "Other"],
    },
    transmission: {
      type: String,
      enum: ["Manual", "Automatic", "Semi-Automatic"],
    },
    ownershipNumber: {
      type: Number,
      min: 1,
      max: 10,
    },

    kilometersRun: {
      type: Number,
      min: 0,
    },

    vehicleCondition: {
      type: String,
      required: true,
      enum: ["running", "notRunning"],
      default: "running",
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    chassisNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    engineNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    seatingCapacity: {
      type: Number,
      min: 1,
    },
    bodyType: {
      type: String,
      trim: true,
    },

    purchasePrice: {
      type: Number,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },

    downPayment: {
      type: Number,
      min: 0,
    },
    emi: {
      type: Number,
      min: 0,
    },
    expectedPrice: {
      type: Number,
      min: 0,
    },

    availabilityStatus: {
      type: String,
      enum: ["Available", "Sold", "Reserved", "Under Service", "Not for Sale"],
      default: "Available",
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        fileId: {
          type: String,
          required: true,
        },
        thumbnailUrl: {
          type: String,
        },
        name: {
          type: String,
        },
      },
    ],

    primaryImage: {
      url: String,
      fileId: String,
      thumbnailUrl: String,
    },

    description: {
      type: String,
      maxlength: 1000,
    },
    features: [
      {
        type: String,
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visibility: {
      type: String,
      enum: ["private", "staff", "public"],
      default: "staff",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    internalNotes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

VehicleSchema.index({ vehicleType: 1, availabilityStatus: 1 });
VehicleSchema.index({ createdAt: -1 });

VehicleSchema.virtual("fullName").get(function () {
  return `${this.vehicleName} ${this.vehicleModel} ${
    this.vehicleVariant || ""
  }`.trim();
});

VehicleSchema.set("toJSON", { virtuals: true });
VehicleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Vehicle", VehicleSchema);
