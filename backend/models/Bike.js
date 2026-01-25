const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bikeNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  manufacturingYear: {
    type: Number,
    required: true
  },
  mileage: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: true
  },
  description: String,
  // Images (Uploaded in step 2)
  images: {
    frontView: { type: String },
    backView: { type: String },
    sideView: { type: String },
    meterPhoto: { type: String },
    scratches: String
  },
  // Documents (Uploaded in step 3)
  documents: {
    rc: {
      documentUrl: { type: String },
      verified: { type: Boolean, default: false }
    },
    insurance: {
      documentUrl: String,
      verified: { type: Boolean, default: false },
      expiryDate: Date
    },
    puc: {
      documentUrl: { type: String },
      verified: { type: Boolean, default: false },
      expiryDate: Date
    }
  },
  // Pricing
  pricing: {
    hourly: {
      type: Number,
      required: true
    },
    daily: {
      type: Number,
      required: true
    }
  },
  // Availability
  isAvailable: {
    type: Boolean,
    default: false
  },
  availabilitySchedule: {
    monday: { available: Boolean, hours: String },
    tuesday: { available: Boolean, hours: String },
    wednesday: { available: Boolean, hours: String },
    thursday: { available: Boolean, hours: String },
    friday: { available: Boolean, hours: String },
    saturday: { available: Boolean, hours: String },
    sunday: { available: Boolean, hours: String }
  },
  // Handover location
  handoverLocation: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Admin approval
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNote: String,
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search
bikeSchema.index({ bikeNumber: 1 });
bikeSchema.index({ owner: 1 });
bikeSchema.index({ approvalStatus: 1, isAvailable: 1 });

module.exports = mongoose.model('Bike', bikeSchema);

