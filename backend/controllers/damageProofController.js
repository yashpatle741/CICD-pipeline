/*
 * DAMAGE PROOF MODULE - DISABLED FOR CURRENT VERSION
 * This module is kept for future scope and is not currently integrated with the frontend.
 * Booking damage handling is strictly managed through agreement terms.
 */
const DamageProof = require('../models/DamageProof');
const Booking = require('../models/Booking');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Upload start photos
// @route   POST /api/damage-proof/:bookingId/start-photos
// @access  Private
exports.uploadStartPhotos = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload photos' });
    }

    let damageProof = await DamageProof.findOne({ booking: booking._id });
    if (!damageProof) {
      damageProof = new DamageProof({
        booking: booking._id,
        customer: booking.customer,
        owner: booking.owner,
        bike: booking.bike
      });
    }

    // Upload photos
    const uploadedPhotos = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, `rydzo/damage-proof/${booking._id}/start`);
      uploadedPhotos.push({
        url: result.secure_url,
        description: '',
        uploadedAt: new Date()
      });
    }

    damageProof.startPhotos = uploadedPhotos;
    await damageProof.save();

    // Update booking
    booking.damageProof.startPhotos = uploadedPhotos.map(p => p.url);
    await booking.save();

    res.json({
      message: 'Start photos uploaded successfully',
      damageProof
    });
  } catch (error) {
    console.error('Upload start photos error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload end photos
// @route   POST /api/damage-proof/:bookingId/end-photos
// @access  Private
exports.uploadEndPhotos = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload photos' });
    }

    let damageProof = await DamageProof.findOne({ booking: booking._id });
    if (!damageProof) {
      damageProof = new DamageProof({
        booking: booking._id,
        customer: booking.customer,
        owner: booking.owner,
        bike: booking.bike
      });
    }

    // Upload photos
    const uploadedPhotos = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, `rydzo/damage-proof/${booking._id}/end`);
      uploadedPhotos.push({
        url: result.secure_url,
        description: '',
        uploadedAt: new Date()
      });
    }

    damageProof.endPhotos = uploadedPhotos;
    await damageProof.save();

    // Update booking
    booking.damageProof.endPhotos = uploadedPhotos.map(p => p.url);
    await booking.save();

    res.json({
      message: 'End photos uploaded successfully',
      damageProof
    });
  } catch (error) {
    console.error('Upload end photos error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Report damage
// @route   POST /api/damage-proof/:bookingId/report-damage
// @access  Private
exports.reportDamage = async (req, res) => {
  try {
    const { description, estimatedCost } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.owner.toString() !== req.user._id.toString() &&
      booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let damageProof = await DamageProof.findOne({ booking: booking._id });
    if (!damageProof) {
      return res.status(400).json({ message: 'Please upload start and end photos first' });
    }

    const damagePhotos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, `rydzo/damage-proof/${booking._id}/damage`);
        damagePhotos.push(result.secure_url);
      }
    }

    damageProof.damageReported = true;
    damageProof.damageDescription = description;
    damageProof.damagePhotos = damagePhotos;
    damageProof.estimatedRepairCost = estimatedCost ? parseFloat(estimatedCost) : 0;
    damageProof.resolutionStatus = 'pending';
    await damageProof.save();

    // Update booking
    booking.damageProof.damageReported = true;
    booking.damageProof.damageDescription = description;
    booking.status = 'disputed';
    await booking.save();

    res.json({
      message: 'Damage reported successfully. Admin will review.',
      damageProof
    });
  } catch (error) {
    console.error('Report damage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get damage proof
// @route   GET /api/damage-proof/:bookingId
// @access  Private
exports.getDamageProof = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer.toString() !== req.user._id.toString() &&
      booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let damageProof = await DamageProof.findOne({ booking: booking._id });
    if (!damageProof) {
      return res.json({
        message: 'No damage proof found',
        startPhotos: [],
        endPhotos: []
      });
    }

    res.json(damageProof);
  } catch (error) {
    console.error('Get damage proof error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Compare photos (Admin)
// @route   GET /api/damage-proof/:bookingId/compare
// @access  Private (Admin)
exports.comparePhotos = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const damageProof = await DamageProof.findOne({ booking: req.params.bookingId })
      .populate('booking')
      .populate('customer')
      .populate('owner')
      .populate('bike');

    if (!damageProof) {
      return res.status(404).json({ message: 'Damage proof not found' });
    }

    res.json({
      startPhotos: damageProof.startPhotos,
      endPhotos: damageProof.endPhotos,
      damageReported: damageProof.damageReported,
      damageDescription: damageProof.damageDescription,
      damagePhotos: damageProof.damagePhotos,
      adminReviewStatus: damageProof.adminReviewStatus,
      adminNotes: damageProof.adminNotes
    });
  } catch (error) {
    console.error('Compare photos error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

