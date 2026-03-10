const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = (req, res, next) => {
    // Check API key header first
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(apiKey);
        if (user) {
            req.user = { id: user.id, email: user.email };
            return next();
        }
        return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check JWT Bearer token
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Optional auth - doesn't fail if no token
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'changeme_secret');
        } catch (_) { /* ignore */ }
    }
    next();
};

module.exports = { authMiddleware, optionalAuth };
