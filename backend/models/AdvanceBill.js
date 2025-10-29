// models/AdvanceBill.js
const mongoose = require('mongoose');

const advanceBillSchema = new mongoose.Schema({
  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15
  },
  discount: {
    type: Number,
    min: 0,
    default: 0
  },
  customerAddress: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  customerEmail: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Vehicle Information
  vehicleType: {
    type: String,
    required: true,
    enum: ['bike', 'scooter', 'car', 'other'],
    lowercase: true
  },
  vehicleBrand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  vehicleModel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  registrationNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 15
  },
  chassisNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  engineNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  kmReading: {
    type: Number,
    min: 0,
    default: 0
  },

  // Service Information
  serviceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveryDate: {
    type: Date,
    required: true
  },

  // Payment Information
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  advancePaid: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  balanceDue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'upi', 'bank transfer'],
    lowercase: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: 500
  },
  pdfUrl: { type: String },

  // Bill Information
  billNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Version tracking fields
  originalDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvanceBill'
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvanceBill'
  },
  version: {
    type: Number,
    default: 1
  },
  editedAt: {
    type: Date
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // User who created this bill
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate amounts and generate unique bill number
advanceBillSchema.pre('save', async function(next) {
  try {
    if (this.isModified('totalAmount') || this.isModified('advancePaid') ||
        this.isModified('discount')) {
      // Calculate grand total with discount
      this.grandTotal = this.totalAmount - (this.discount || 0);
      this.balanceDue = this.grandTotal - this.advancePaid;
    }

    if (!this.billNumber) {
      const year = new Date().getFullYear();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        const candidate = `ADV-${year}-${random}`;
        // Check uniqueness
        // eslint-disable-next-line no-await-in-loop
        const existing = await this.constructor.findOne({ billNumber: candidate }).lean().exec();
        if (!existing) {
          this.billNumber = candidate;
          break;
        }
        attempts += 1;
      }

      if (!this.billNumber) {
        // Fallback to timestamp-based bill number to guarantee uniqueness
        this.billNumber = `ADV-${year}-${Date.now().toString().slice(-8)}`;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Virtual for formatted total amount
advanceBillSchema.virtual('formattedTotalAmount').get(function() {
  const val = this.totalAmount != null ? Number(this.totalAmount) : 0;
  return `₹${val.toFixed(2)}`;
});

// Virtual for formatted advance paid
advanceBillSchema.virtual('formattedAdvancePaid').get(function() {
  const val = this.advancePaid != null ? Number(this.advancePaid) : 0;
  return `₹${val.toFixed(2)}`;
});

// Virtual for formatted balance due
advanceBillSchema.virtual('formattedBalanceDue').get(function() {
  const val = this.balanceDue != null ? Number(this.balanceDue) : 0;
  return `₹${val.toFixed(2)}`;
});
advanceBillSchema.virtual('formattedDiscount').get(function() {
  const val = this.discount != null ? Number(this.discount) : 0;
  return `₹${val.toFixed(2)}`;
});

// Ensure virtuals are included in JSON output
advanceBillSchema.set('toJSON', { virtuals: true });
advanceBillSchema.set('toObject', { virtuals: true });

// Index for faster queries
advanceBillSchema.index({ user: 1, createdAt: -1 });
advanceBillSchema.index({ billNumber: 1 });
advanceBillSchema.index({ registrationNumber: 1 });

module.exports = mongoose.model('AdvanceBill', advanceBillSchema);