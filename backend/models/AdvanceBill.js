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
  discount: {
    type: Number,
    min: 0,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'upi', 'bank transfer'],
    lowercase: true
  },
  pdfUrl: { type: String },

  // Bill Information
  billNumber: {
    type: String,
    unique: true,
    sparse: true
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

// Pre-save middleware to calculate amounts
advanceBillSchema.pre('save', function(next) {
  if (this.isModified('totalAmount') || this.isModified('advancePaid')) {
    this.grandTotal = this.totalAmount;
    this.balanceDue = this.grandTotal - this.advancePaid;
  }
  
  // Generate bill number if not provided
  if (!this.billNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.billNumber = `ADV-${year}-${random}`;
  }
  
  next();
});
advanceBillSchema.pre('save', function(next) {
  if (this.isModified('totalAmount') || this.isModified('advancePaid')) {
    this.grandTotal = this.totalAmount;
    this.balanceDue = this.grandTotal - this.advancePaid;
  }
  
  if (!this.billNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.billNumber = `ADV-${year}-${random}`;
  }
  
  next();
});

// Virtual for formatted total amount
advanceBillSchema.virtual('formattedTotalAmount').get(function() {
  return `₹${this.totalAmount.toFixed(2)}`;
});

// Virtual for formatted advance paid
advanceBillSchema.virtual('formattedAdvancePaid').get(function() {
  return `₹${this.advancePaid.toFixed(2)}`;
});

// Virtual for formatted balance due
advanceBillSchema.virtual('formattedBalanceDue').get(function() {
  return `₹${this.balanceDue.toFixed(2)}`;
});

// Ensure virtuals are included in JSON output
advanceBillSchema.set('toJSON', { virtuals: true });
advanceBillSchema.set('toObject', { virtuals: true });

// Index for faster queries
advanceBillSchema.index({ user: 1, createdAt: -1 });
advanceBillSchema.index({ billNumber: 1 });
advanceBillSchema.index({ registrationNumber: 1 });

module.exports = mongoose.model('AdvanceBill', advanceBillSchema);