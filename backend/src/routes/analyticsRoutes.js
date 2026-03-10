const express = require('express');
const { getLinkAnalyticsHandler, getSummaryHandler } = require('../controllers/analyticsController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', authMiddleware, getSummaryHandler);
router.get('/:shortCode', optionalAuth, getLinkAnalyticsHandler);

module.exports = router;
