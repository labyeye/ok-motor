// models/SellLetter.js
const mongoose = require('mongoose');

const SellLetterSchema = new mongoose.Schema({
  // Vehicle Information
  vehicleName: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  vehicleColor: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  chassisNumber: { type: String, required: true },
  engineNumber: { type: String, required: true },
  vehiclekm: { type: String, required: true },
  vehicleCondition: { type: String, required: true, enum: ['running', 'notRunning'] },
  
  // Buyer Information (named as seller in form but actually buyer)
  buyerName: { type: String, required: true },
  buyerFatherName: { type: String, required: true },
  buyerAddress: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  buyerPhone2: { type: String, required: true },
  buyerAadhar: { type: String, required: true },
  
  // Sale Details
  saleDate: { type: Date, required: true, default: Date.now },
  saleTime: { type: String },
  saleAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['cash', 'upi', 'bankTransfer', 'loan', 'soldloan', 'other'] },
  todayDate: { type: Date },
  todayTime: { type: String },
  previousDate: { type: Date },
  previousTime: { type: String },

  // Witness Information
  witnessName: { type: String, required: true },
  witnessPhone: { type: String, required: true },
  // Legal Terms
    note: { type: String },

  documentsVerified: { type: Boolean, default: true },
  
  // Versioning fields - to track document history
  originalDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellLetter', default: null },
  previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellLetter', default: null },
  version: { type: Number, default: 1 },
  editedAt: { type: Date },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Reference to user who created it
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('SellLetter', SellLetterSchema);