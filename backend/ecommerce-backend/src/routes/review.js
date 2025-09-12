// src/routes/review.js
const express = require('express');
const logger = require('../logger/logger');
const { auth, admin } = require('../middleware/auth.js');
const { createReview, getPagedReviews, updateReview, softDeleteReview, getReviewStats } = require('../controllers/review.js');
const upload = require('../services/reviewImageUploader.js'); // multer file

const router = express.Router();

// Route to create a new review for a product 
router.post('/:slug', auth, upload.single('image'), createReview);

// Route to get the paged reviews for a product
router.get('/:slug', auth, getPagedReviews)

// Route to update a review for a product
router.post('/update/:_id', auth, admin, updateReview)

// Route to soft delete a review
router.get('/softDelete/:_id', auth, admin, softDeleteReview)

// route to get review stats of a product
router.get('/stats/:slug', auth, getReviewStats)

logger.info('Review routes enabled');

module.exports = router;