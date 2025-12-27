const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  imageKitFileId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Customer Photo',
  },
  altText: {
    type: String,
    default: 'Happy Customer',
  },
  orderIndex: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

gallerySchema.index({ isActive: 1, orderIndex: 1 });

module.exports = mongoose.model('Gallery', gallerySchema);
