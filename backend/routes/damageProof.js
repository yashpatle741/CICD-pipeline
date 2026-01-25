const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  uploadStartPhotos,
  uploadEndPhotos,
  reportDamage,
  getDamageProof,
  comparePhotos
} = require('../controllers/damageProofController');
const { uploadMultiple, uploadToCloudinary } = require('../utils/cloudinary');

// @route   POST /api/damage-proof/:bookingId/start-photos
// @desc    Upload start photos (during handover)
// @access  Private
router.post('/:bookingId/start-photos', auth, uploadMultiple('photos', 10), uploadStartPhotos);

// @route   POST /api/damage-proof/:bookingId/end-photos
// @desc    Upload end photos (during return)
// @access  Private
router.post('/:bookingId/end-photos', auth, uploadMultiple('photos', 10), uploadEndPhotos);

// @route   POST /api/damage-proof/:bookingId/report-damage
// @desc    Report damage
// @access  Private
router.post('/:bookingId/report-damage', auth, uploadMultiple('damagePhotos', 5), reportDamage);

// @route   GET /api/damage-proof/:bookingId
// @desc    Get damage proof for booking
// @access  Private
router.get('/:bookingId', auth, getDamageProof);

// @route   GET /api/damage-proof/:bookingId/compare
// @desc    Compare before/after photos (Admin)
// @access  Private (Admin)
router.get('/:bookingId/compare', auth, comparePhotos);

module.exports = router;

