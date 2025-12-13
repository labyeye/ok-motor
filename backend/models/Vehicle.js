// models/Vehicle.js
const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    // Vehicle Type - Primary Classification
    vehicleType: {
      type: String,
      required: true,
      enum: ["Car", "Bike"],
    },

    // Basic Vehicle Information
    vehicleName: {
      type: String,
      required: true,
      trim: true,
    }, // Brand/Make
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

    // Vehicle Specifications
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
    }, // 1st owner, 2nd owner, etc.

    // Odometer Reading
    kilometersRun: {
      type: Number,
      min: 0,
    },

    // Vehicle Condition
    vehicleCondition: {
      type: String,
      required: true,
      enum: ["running", "notRunning"],
      default: "running",
    },

    // Registration & Legal Documents
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

    // Insurance Details
    insuranceStatus: {
      type: String,
      enum: ["Valid", "Expired", "Not Available"],
    },
    insuranceExpiryDate: {
      type: Date,
    },
    insuranceCompany: {
      type: String,
      trim: true,
    },
    insurancePolicyNumber: {
      type: String,
      trim: true,
    },

    // Additional Vehicle Details
    seatingCapacity: {
      type: Number,
      min: 1,
    },
    bodyType: {
      type: String,
      trim: true,
    }, // Sedan, SUV, Hatchback, Sports Bike, Cruiser, etc.

    // Pricing Information
    purchasePrice: {
      type: Number,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },
    // Down payment and EMI information for frontend display
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

    // Vehicle Status
    availabilityStatus: {
      type: String,
      enum: ["Available", "Sold", "Reserved", "Under Service", "Not for Sale"],
      default: "Available",
    },

    // ImageKit Integration - Multiple Images
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

    // Featured/Primary Image
    primaryImage: {
      url: String,
      fileId: String,
      thumbnailUrl: String,
    },

    // Additional Information
    description: {
      type: String,
      maxlength: 1000,
    },
    features: [
      {
        type: String,
      },
    ], // AC, Power Steering, ABS, etc.

    // Reference to user who added it
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Visibility for staff access
    visibility: {
      type: String,
      enum: ["private", "staff", "public"],
      default: "staff",
    },

    // Tracking
    isActive: {
      type: Boolean,
      default: true,
    },

    // Notes for internal use
    internalNotes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
VehicleSchema.index({ vehicleType: 1, availabilityStatus: 1 });
VehicleSchema.index({ registrationNumber: 1 });
VehicleSchema.index({ chassisNumber: 1 });
VehicleSchema.index({ createdAt: -1 });

// Virtual for full vehicle name
VehicleSchema.virtual("fullName").get(function () {
  return `${this.vehicleName} ${this.vehicleModel} ${
    this.vehicleVariant || ""
  }`.trim();
});

// Ensure virtuals are included in JSON
VehicleSchema.set("toJSON", { virtuals: true });
VehicleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Vehicle", VehicleSchema);
