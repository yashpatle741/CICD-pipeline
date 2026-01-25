const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createAgreement,
  getAgreement,
  acceptAgreement,
  verifyAgreementOTP
} = require('../controllers/agreementController');

// @route   POST /api/agreements
// @desc    Create digital agreement
// @access  Private
router.post('/', auth, createAgreement);

// @route   GET /api/agreements/booking/:bookingId
// @desc    Get agreement by booking ID
// @access  Private
router.get('/booking/:bookingId', auth, getAgreement);

// @route   POST /api/agreements/:id/accept
// @desc    Accept agreement (checkbox or OTP)
// @access  Private
router.post('/:id/accept', auth, acceptAgreement);

// @route   POST /api/agreements/:id/verify-otp
// @desc    Verify OTP for agreement acceptance
// @access  Private
router.post('/:id/verify-otp', auth, verifyAgreementOTP);

module.exports = router;

