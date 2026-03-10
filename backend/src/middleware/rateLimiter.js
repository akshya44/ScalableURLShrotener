const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

// Simple in-memory store fallback when Redis is unavailable
// For production use a proper Redis store like 'rate-limit-redis'
const createLimiter = (windowMs, max, message) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: message },
        skip: (req) => process.env.NODE_ENV === 'test',
    });

// Global API rate limiter: 100 requests per 15 minutes
const globalLimiter = createLimiter(
    15 * 60 * 1000,
    100,
    'Too many requests, please try again later.'
);

// Strict limiter for shorten endpoint: 20 per minute
const shortenLimiter = createLimiter(
    60 * 1000,
    20,
    'Too many URL shortening requests, please slow down.'
);

// Auth limiter: 10 per 15 minutes
const authLimiter = createLimiter(
    15 * 60 * 1000,
    10,
    'Too many auth attempts, please try again later.'
);

module.exports = { globalLimiter, shortenLimiter, authLimiter };
