// models/ServiceBill.js
const mongoose = require("mongoose");

const ServiceBillSchema = new mongoose.Schema({
  // Customer Information
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerEmail: { type: String },
  
  // Vehicle Information
  vehicleType: { 
    type: String, 
    required: true, 
    enum: ["bike", "scooter", "car", "other"] 
  },
  vehicleBrand: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  chassisNumber: { type: String },
  engineNumber: { type: String },
  kmReading: { type: Number, required: true },
  
  // Service Details
  serviceDate: { type: Date, required: true, default: Date.now },
  deliveryDate: { type: Date, required: true },
  serviceType: { 
    type: String, 
    required: true,
    enum: ["regular", "premium", "custom"] 
  },
  serviceItems: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      rate: { type: Number, required: true },
      amount: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxEnabled: { type: Boolean, default: false }, // New field for tax toggle
  businessName: { type: String }, // New field
  businessGSTIN: { type: String }, // New field
  businessAddress: { type: String }, // New field
  taxRate: { type: Number, default: 18 }, // Default GST rate
  taxAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  
  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "card", "upi", "online"],
    default: "cash"
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["pending", "partial", "paid"],
    default: "pending"
  },
  advancePaid: { type: Number, default: 0 },
  balanceDue: { type: Number, required: true },
  
  // Additional Information
  issuesReported: { type: String },
  technicianNotes: { type: String },
  warrantyInfo: { type: String },
  
  // Reference to user who created it
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  // PDF generation info
  pdfUrl: { type: String },
  billNumber: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save hook to generate bill number
ServiceBillSchema.pre("save", async function(next) {
  if (!this.billNumber) {
    const count = await this.constructor.countDocuments();
    this.billNumber = `SRV-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
    
    // Calculate amounts if service items are modified
    if (this.isModified('serviceItems') || this.isModified('discount') || this.isModified('taxRate')) {
      this.totalAmount = this.serviceItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      this.taxAmount = (this.taxRate / 100) * this.totalAmount;
      this.grandTotal = this.totalAmount + this.taxAmount - (this.discount || 0);
      this.balanceDue = this.grandTotal - (this.advancePaid || 0);
    }
  }
  next();
});

module.exports = mongoose.model("ServiceBill", ServiceBillSchema);