const express = require('express');
const {
    shorten, getUserUrls, editUrl, deleteUrl, bulkShorten, getUrlInfo
} = require('../controllers/urlController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { shortenLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/shorten', optionalAuth, shortenLimiter, shorten);
router.post('/bulk', authMiddleware, shortenLimiter, bulkShorten);
router.get('/user', authMiddleware, getUserUrls);
router.get('/info/:shortCode', getUrlInfo);
router.put('/edit/:id', authMiddleware, editUrl);
router.delete('/:id', authMiddleware, deleteUrl);

module.exports = router;
