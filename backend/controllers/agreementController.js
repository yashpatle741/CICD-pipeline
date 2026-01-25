const Agreement = require('../models/Agreement');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const User = require('../models/User');
const agreementTemplate = require('../utils/agreementTemplate');
const { generateOTP, sendOTPviaSMS, sendOTPviaEmail } = require('../utils/otp');

// @desc    Create digital agreement
// @route   POST /api/agreements
// @access  Private
exports.createAgreement = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('customer')
      .populate('owner')
      .populate('bike');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if agreement already exists
    let agreement = await Agreement.findOne({ booking: bookingId });
    if (agreement) {
      return res.json({ message: 'Agreement already exists', agreement });
    }

    // Generate agreement text
    const agreementText = agreementTemplate(
      {
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: `${booking.duration.hours} hours`,
        securityDeposit: booking.securityDeposit,
        lateReturnPenalty: 500,
        bookingId: booking._id
      },
      {
        brand: booking.bike.brand,
        model: booking.bike.model,
        bikeNumber: booking.bike.bikeNumber,
        insuranceStatus: booking.bike.documents.insurance?.documentUrl 
          ? (booking.bike.documents.insurance.expiryDate && 
             new Date(booking.bike.documents.insurance.expiryDate) > new Date() 
             ? 'Insurance Available' 
             : 'Insurance Expired')
          : 'No Insurance'
      },
      {
        name: booking.owner.name,
        phone: booking.owner.phone
      }
    );

    agreement = new Agreement({
      booking: bookingId,
      customer: booking.customer._id,
      owner: booking.owner._id,
      bike: booking.bike._id,
      agreementText
    });

    await agreement.save();

    res.status(201).json({
      message: 'Agreement created successfully',
      agreement
    });
  } catch (error) {
    console.error('Create agreement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get agreement by booking ID
// @route   GET /api/agreements/booking/:bookingId
// @access  Private
exports.getAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findOne({ booking: req.params.bookingId })
      .populate('booking')
      .populate('customer')
      .populate('owner')
      .populate('bike');

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Check access
    const booking = await Booking.findById(req.params.bookingId);
    if (req.user.role !== 'admin' && 
        booking.customer.toString() !== req.user._id.toString() &&
        booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(agreement);
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept agreement
// @route   POST /api/agreements/:id/accept
// @access  Private
exports.acceptAgreement = async (req, res) => {
  try {
    const { acceptanceMethod, consentFlags, useOTP } = req.body;
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Check access
    if (agreement.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only customer can accept the agreement' });
    }

    if (agreement.accepted) {
      return res.status(400).json({ message: 'Agreement already accepted' });
    }

    // If OTP method is chosen
    if (useOTP) {
      const otp = generateOTP();
      agreement.otp = otp;
      agreement.acceptanceMethod = 'otp';
      
      // Send OTP
      const customer = await User.findById(agreement.customer);
      if (customer.email) {
        await sendOTPviaEmail(customer.email, otp);
      }
      if (customer.phone) {
        await sendOTPviaSMS(customer.phone, otp);
      }

      await agreement.save();
      return res.json({ 
        message: 'OTP sent. Please verify to accept agreement.',
        requiresOTP: true
      });
    }

    // Checkbox acceptance
    const mandatoryOk = !!(consentFlags &&
      consentFlags.locationTracking &&
      consentFlags.geoFencing &&
      consentFlags.damageResponsibility &&
      consentFlags.theftFIR &&
      consentFlags.securityDeposit &&
      consentFlags.ownerHandover &&
      consentFlags.aggregatorDisclaimer);

    if (!mandatoryOk) {
      return res.status(400).json({ 
        message: 'All mandatory consents must be accepted' 
      });
    }

    agreement.accepted = true;
    agreement.acceptanceMethod = 'checkbox';
    agreement.consentFlags = consentFlags;
    agreement.acceptedAt = new Date();
    agreement.userIP = req.ip;
    agreement.userAgent = req.get('user-agent');

    await agreement.save();

    // Update booking
    const booking = await Booking.findById(agreement.booking);
    booking.agreementAccepted = true;
    booking.agreementTimestamp = new Date();
    booking.agreementIP = req.ip;
    await booking.save();

    res.json({ 
      message: 'Agreement accepted successfully',
      agreement,
      booking
    });
  } catch (error) {
    console.error('Accept agreement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP for agreement
// @route   POST /api/agreements/:id/verify-otp
// @access  Private
exports.verifyAgreementOTP = async (req, res) => {
  try {
    const { otp, consentFlags } = req.body;
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    if (agreement.accepted) {
      return res.status(400).json({ message: 'Agreement already accepted' });
    }

    if (agreement.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const mandatoryOk = !!(consentFlags &&
      consentFlags.locationTracking &&
      consentFlags.geoFencing &&
      consentFlags.damageResponsibility &&
      consentFlags.theftFIR &&
      consentFlags.securityDeposit &&
      consentFlags.ownerHandover &&
      consentFlags.aggregatorDisclaimer);

    if (!mandatoryOk) {
      return res.status(400).json({ 
        message: 'All mandatory consents must be accepted' 
      });
    }

    agreement.accepted = true;
    agreement.otpVerified = true;
    agreement.consentFlags = consentFlags;
    agreement.acceptedAt = new Date();
    agreement.userIP = req.ip;
    agreement.userAgent = req.get('user-agent');
    agreement.otp = undefined;

    await agreement.save();

    // Update booking
    const booking = await Booking.findById(agreement.booking);
    booking.agreementAccepted = true;
    booking.agreementTimestamp = new Date();
    booking.agreementIP = req.ip;
    await booking.save();

    res.json({ 
      message: 'Agreement accepted successfully via OTP',
      agreement,
      booking
    });
  } catch (error) {
    console.error('Verify agreement OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

