const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const User = require('../models/User');
const Agreement = require('../models/Agreement');
const Notification = require('../models/Notification');
const agreementTemplate = require('../utils/agreementTemplate');

function calculateInsuranceStatus(bike) {
  try {
    const insurance = bike?.documents?.insurance;
    if (!insurance?.documentUrl) return 'No Insurance';
    if (insurance.expiryDate && new Date(insurance.expiryDate) > new Date()) return 'Insurance Available';
    return 'Insurance Expired';
  } catch {
    return 'No Insurance';
  }
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Customer)
exports.createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    // Check if customer is approved
    if (req.user.customerApprovalStatus !== 'approved') {
      return res.status(403).json({
        message: 'Your account is not approved yet. Please wait for admin approval.'
      });
    }

    const { bikeId, bookingType, startDate, endDate, startTime, endTime, handoverLocation } = req.body;

    // Validation
    if (!bikeId || !bookingType || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const bike = await Bike.findById(bikeId).populate('owner');
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    if (bike.approvalStatus !== 'approved' || !bike.isAvailable || bike.status !== 'active') {
      return res.status(400).json({ message: 'Bike is not available for booking' });
    }

    // Calculate duration and amount
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start/end date or time' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    const durationMs = end - start;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const durationDays = Math.ceil(durationHours / 24);

    if (!['hourly', 'daily'].includes(bookingType)) {
      return res.status(400).json({ message: 'Invalid booking type' });
    }

    // Prevent double-booking for confirmed/ongoing rentals (overlap check)
    const existing = await Booking.findOne({
      bike: bikeId,
      status: { $in: ['confirmed', 'ongoing'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).select('startTime endTime');
    if (existing) {
      return res.status(400).json({ message: 'Bike is already booked for the selected time' });
    }

    let totalAmount = 0;
    if (bookingType === 'hourly') {
      totalAmount = bike.pricing.hourly * durationHours;
    } else {
      totalAmount = bike.pricing.daily * durationDays;
    }

    const securityDeposit = Math.round(totalAmount * 0.2); // 20% security deposit
    const commission = Math.round(totalAmount * 0.1); // 10% commission
    const advancePaymentRequired = 0; // No advance payment required as per new flow

    const booking = new Booking({
      customer: req.user._id,
      owner: bike.owner._id,
      bike: bikeId,
      bookingType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime: start,
      endTime: end,
      duration: {
        hours: durationHours,
        days: durationDays
      },
      hourlyRate: bike.pricing.hourly,
      dailyRate: bike.pricing.daily,
      totalAmount,
      securityDeposit,
      commission,
      handoverLocation: handoverLocation || bike.handoverLocation,
      status: 'pending',
      isSentToOwner: false,
      ownerDecision: { status: 'pending' },
      advancePayment: {
        requiredAmount: advancePaymentRequired,
        paidAmount: 0,
        status: 'not_required'
      },
      securityDepositStatus: 'pending'
    });

    await booking.save();

    // Auto-create digital agreement for this booking
    const insuranceStatus = calculateInsuranceStatus(bike);
    const agreementText = agreementTemplate(
      {
        customerName: req.user.name,
        customerPhone: req.user.phone,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: `${booking.duration.hours} hours`,
        securityDeposit: booking.securityDeposit,
        lateReturnPenalty: 500,
        bookingId: booking._id,
        advancePaymentRequired: advancePaymentRequired
      },
      {
        brand: bike.brand,
        model: bike.model,
        bikeNumber: bike.bikeNumber,
        insuranceStatus
      },
      {
        name: bike.owner?.name || 'Owner',
        phone: bike.owner?.phone || ''
      }
    );

    const agreement = new Agreement({
      booking: booking._id,
      customer: req.user._id,
      owner: bike.owner._id,
      bike: bike._id,
      agreementText
    });

    await agreement.save();

    res.status(201).json({
      message: 'Booking created successfully. Please accept the digital agreement and pay advance to send request to owner.',
      booking,
      agreement
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private (Admin)
exports.getBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const bookings = await Booking.find()
      .populate('customer', 'name phone email')
      .populate('owner', 'name phone email')
      .populate('bike', 'bikeNumber brand model')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get customer bookings
// @route   GET /api/bookings/customer
// @access  Private (Customer)
exports.getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('owner', 'name phone')
      .populate('bike', 'bikeNumber brand model images')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get owner bookings
// @route   GET /api/bookings/owner
// @access  Private (Owner)
exports.getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owner only.' });
    }

    const bookings = await Booking.find({ owner: req.user._id, isSentToOwner: true })
      .populate('customer', 'name phone email profileImage customerApprovalStatus')
      .populate('bike', 'bikeNumber brand model images')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone email profileImage customerApprovalStatus')
      .populate('owner', 'name phone email')
      .populate('bike');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer._id.toString() !== req.user._id.toString() &&
      booking.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer.toString() !== req.user._id.toString() &&
      booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Start rental
// @route   POST /api/bookings/:id/start
// @access  Private
exports.startRental = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if agreement is accepted
    if (!booking.agreementAccepted) {
      return res.status(400).json({ message: 'Digital agreement must be accepted first' });
    }

    // Check access
    if (req.user.role !== 'admin' && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed by owner before starting the ride' });
    }
    if (!booking.isSentToOwner || booking.ownerDecision?.status !== 'accepted') {
      return res.status(400).json({ message: 'Owner acceptance is required before starting the ride' });
    }
    // Advance payment check removed
    if (booking.securityDepositStatus !== 'collected') {
      return res.status(400).json({ message: 'Security deposit must be collected before starting the ride' });
    }

    booking.status = 'ongoing';
    booking.isTrackingActive = true;
    booking.actualHandoverTime = new Date();
    booking.updatedAt = new Date();
    await booking.save();

    // Socket.IO tracking removed
    // const io = req.app.get('io'); ...

    res.json({ message: 'Rental started. Tracking is now active.', booking });
  } catch (error) {
    console.error('Start rental error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark advance payment as paid (placeholder)
// @route   POST /api/bookings/:id/advance-payment
// @access  Private (Customer)
exports.markAdvancePaymentPaid = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const { transactionId, amount } = req.body || {};
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!booking.agreementAccepted) {
      return res.status(400).json({ message: 'Accept the agreement before paying advance' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Advance payment can only be made for pending bookings' });
    }
    if (booking.advancePayment?.status === 'paid') {
      return res.json({ message: 'Advance payment already marked as paid', booking });
    }

    const required = booking.advancePayment?.requiredAmount || 0;
    const paidAmount = typeof amount === 'number' && amount > 0 ? amount : required;

    booking.advancePayment = {
      ...(booking.advancePayment || {}),
      paidAmount,
      status: 'paid',
      transactionId: transactionId || booking.advancePayment?.transactionId,
      paidAt: new Date()
    };
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: 'Advance payment marked as paid', booking });
  } catch (error) {
    console.error('Mark advance payment paid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send booking request to owner (after agreement + advance payment)
// @route   POST /api/bookings/:id/submit-request
// @access  Private (Customer)
exports.submitRequestToOwner = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be submitted to owner' });
    }
    if (!booking.agreementAccepted) {
      return res.status(400).json({ message: 'Digital agreement must be accepted first' });
    }
    // Advance payment check removed
    if (booking.isSentToOwner) {
      return res.json({ message: 'Booking request already sent to owner', booking });
    }

    booking.isSentToOwner = true;
    booking.sentToOwnerAt = new Date();
    booking.updatedAt = new Date();
    await booking.save();

    // Create notification for the owner
    try {
      await Notification.create({
        recipient: booking.owner, // Owner's ID
        type: 'booking_request',
        message: `You have a new booking request from ${req.user.name}`,
        relatedId: booking._id
      });
      // Socket emission removed
      // const io = req.app.get('io'); ...
    } catch (notifError) {
      console.error('Notification creation failed:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({ message: 'Booking request sent to owner', booking });
  } catch (error) {
    console.error('Submit request to owner error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Owner accepts/declines booking request
// @route   POST /api/bookings/:id/owner/respond
// @access  Private (Owner)
exports.ownerRespondToBooking = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owner only.' });
    }

    const { decision, note } = req.body || {};
    if (!['accept', 'decline'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be accept or decline' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!booking.isSentToOwner) {
      return res.status(400).json({ message: 'Booking request has not been sent to owner yet' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be accepted/declined' });
    }
    if (booking.ownerDecision?.status && booking.ownerDecision.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.ownerDecision.status}` });
    }
    if (!booking.agreementAccepted) {
      return res.status(400).json({ message: 'Customer must accept agreement before owner can respond' });
    }

    if (decision === 'accept') {
      // Re-check overlapping confirmed/ongoing bookings right before accepting
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        bike: booking.bike,
        status: { $in: ['confirmed', 'ongoing'] },
        startTime: { $lt: booking.endTime },
        endTime: { $gt: booking.startTime }
      }).select('startTime endTime');

      if (conflict) {
        return res.status(400).json({ message: 'Cannot accept. Bike has a conflicting confirmed/ongoing booking.' });
      }

      booking.status = 'confirmed';
      booking.ownerDecision = {
        status: 'accepted',
        note: note || booking.ownerDecision?.note,
        decidedAt: new Date()
      };
    } else {
      booking.status = 'cancelled';
      booking.ownerDecision = {
        status: 'declined',
        note: note || booking.ownerDecision?.note,
        decidedAt: new Date()
      };
    }

    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: `Booking ${decision}ed by owner`, booking });
  } catch (error) {
    console.error('Owner respond error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Owner marks security deposit collected at handover
// @route   POST /api/bookings/:id/security-deposit/collect
// @access  Private (Owner)
// @desc    Customer authorizes security deposit (Dummy step)
// @route   POST /api/bookings/:id/security-deposit/authorize
// @access  Private (Customer)
exports.authorizeSecurityDeposit = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed before paying deposit' });
    }
    if (booking.securityDepositStatus !== 'pending') {
      return res.json({ message: 'Security deposit already authorized or collected', booking });
    }

    booking.securityDepositStatus = 'authorized';
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: 'Security deposit authorized. Waiting for owner handover.', booking });
  } catch (error) {
    console.error('Authorize security deposit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.collectSecurityDeposit = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owner only.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Security deposit can be collected only for confirmed bookings' });
    }
    if (booking.securityDepositStatus === 'collected') {
      return res.json({ message: 'Security deposit already marked as collected', booking });
    }

    booking.securityDepositStatus = 'collected';
    booking.securityDepositCollectedAt = new Date();
    booking.securityDepositCollectedBy = req.user._id;
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: 'Security deposit marked as collected', booking });
  } catch (error) {
    console.error('Collect security deposit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    End rental
// @route   POST /api/bookings/:id/end
// @access  Private
exports.endRental = async (req, res) => {
  try {
    const { returnLocation, paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('bike'); // ensure bike pricing is available

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer.toString() !== req.user._id.toString() &&
      booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }

    booking.status = 'completed';
    booking.isTrackingActive = false;
    booking.actualReturnTime = new Date();
    booking.returnLocation = returnLocation || booking.returnLocation;

    // Calculate final amounts
    const start = new Date(booking.actualHandoverTime || booking.startTime);
    const end = new Date(booking.actualReturnTime);
    const durationMs = end - start;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const durationDays = Math.ceil(durationHours / 24);

    let finalTotalAmount = 0;
    if (booking.bookingType === 'hourly') {
      const hourlyRate = booking.hourlyRate || booking.bike?.pricing?.hourly || 0;
      finalTotalAmount = Math.max(hourlyRate, hourlyRate * durationHours);
    } else {
      const dailyRate = booking.dailyRate || booking.bike?.pricing?.daily || 0;
      finalTotalAmount = Math.max(dailyRate, dailyRate * durationDays);
    }

    const commission = Math.round(finalTotalAmount * 0.1);
    const ownerPayout = finalTotalAmount - commission;

    booking.finalTotalAmount = finalTotalAmount;
    booking.finalCommission = commission;
    booking.finalOwnerPayout = ownerPayout;

    if (paymentMethod) {
      booking.paymentMethod = paymentMethod;
    }
    if (paymentMethod === 'manual') {
      booking.isPaymentCollectedManually = true;
    }

    booking.updatedAt = new Date();
    await booking.save();

    // Tracking stopped (Socket.IO removed)
    // const io = req.app.get('io'); ...

    res.json({
      message: 'Rental ended. Final amounts calculated.',
      booking,
      financials: {
        totalRent: finalTotalAmount,
        commission: commission,
        ownerPayout: ownerPayout
      }
    });
  } catch (error) {
    console.error('End rental error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access
    if (req.user.role !== 'admin' &&
      booking.customer.toString() !== req.user._id.toString() &&
      booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'ongoing' || booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel ongoing or completed booking' });
    }

    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

