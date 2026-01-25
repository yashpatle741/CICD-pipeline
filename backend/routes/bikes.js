const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  createBike, 
  getBikes, 
  getBikeById, 
  updateBike, 
  deleteBike,
  getOwnerBikes,
  uploadBikeImages,
  uploadBikeDocuments
} = require('../controllers/bikeController');
const { uploadMultiple, uploadToCloudinary } = require('../utils/cloudinary');

// @route   POST /api/bikes
// @desc    Create new bike listing
// @access  Private (Owner)
router.post('/', auth, createBike);

// @route   GET /api/bikes
// @desc    Get all approved bikes
// @access  Public
router.get('/', getBikes);

// @route   GET /api/bikes/owner
// @desc    Get owner's bikes
// @access  Private (Owner)
router.get('/owner', auth, getOwnerBikes);

// @route   GET /api/bikes/:id
// @desc    Get bike by ID
// @access  Public
router.get('/:id', getBikeById);

// @route   PUT /api/bikes/:id
// @desc    Update bike
// @access  Private (Owner)
router.put('/:id', auth, updateBike);

// @route   DELETE /api/bikes/:id
// @desc    Delete bike
// @access  Private (Owner)
router.delete('/:id', auth, deleteBike);

// @route   POST /api/bikes/:id/images
// @desc    Upload bike images
// @access  Private (Owner)
router.post('/:id/images', auth, uploadMultiple('images', 5), uploadBikeImages);

// @route   POST /api/bikes/:id/documents
// @desc    Upload bike documents (RC, Insurance, PUC)
// @access  Private (Owner)
router.post('/:id/documents', auth, uploadMultiple('documents', 3), uploadBikeDocuments);

module.exports = router;

