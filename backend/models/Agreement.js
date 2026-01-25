const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
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
  // Agreement content
  agreementText: {
    type: String,
    required: true
  },
  // Consent flags
  consentFlags: {
    locationTracking: { type: Boolean, default: false },
    geoFencing: { type: Boolean, default: false },
    damageResponsibility: { type: Boolean, default: false },
    lateReturnPenalty: { type: Boolean, default: false },
    theftFIR: { type: Boolean, default: false },
    securityDeposit: { type: Boolean, default: false },
    ownerHandover: { type: Boolean, default: false },
    aggregatorDisclaimer: { type: Boolean, default: false }
  },
  // Acceptance
  accepted: {
    type: Boolean,
    default: false
  },
  acceptanceMethod: {
    type: String,
    enum: ['checkbox', 'otp'],
    default: 'checkbox'
  },
  otp: String,
  otpVerified: {
    type: Boolean,
    default: false
  },
  // Metadata
  userIP: String,
  userAgent: String,
  acceptedAt: Date,
  // Version tracking
  version: {
    type: String,
    default: '1.0'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
agreementSchema.index({ booking: 1 });
agreementSchema.index({ customer: 1 });

module.exports = mongoose.model('Agreement', agreementSchema);

