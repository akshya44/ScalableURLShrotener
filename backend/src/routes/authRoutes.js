const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
