const mongoose = require('mongoose');

const damageProofSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bike: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bike',
    required: true
  },
  // Start photos (during handover)
  startPhotos: [{
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // End photos (during return)
  endPhotos: [{
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Damage report
  damageReported: {
    type: Boolean,
    default: false
  },
  damageDescription: String,
  damagePhotos: [String],
  estimatedRepairCost: Number,
  // Admin review
  adminReviewed: {
    type: Boolean,
    default: false
  },
  adminReviewStatus: {
    type: String,
    enum: ['pending', 'no-damage', 'damage-confirmed', 'disputed'],
    default: 'pending'
  },
  adminNotes: String,
  adminReviewedAt: Date,
  // Resolution
  resolutionStatus: {
    type: String,
    enum: ['pending', 'resolved', 'disputed'],
    default: 'pending'
  },
  resolutionAmount: Number,
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
damageProofSchema.index({ booking: 1 });
damageProofSchema.index({ adminReviewed: 1 });

module.exports = mongoose.model('DamageProof', damageProofSchema);

