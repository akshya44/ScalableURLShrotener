const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const apiKey = `slx_${uuidv4().replace(/-/g, '')}`;

        const result = db.prepare(
            'INSERT INTO users (email, password, api_key) VALUES (?, ?, ?)'
        ).run(email, passwordHash, apiKey);

        const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return res.status(201).json({
            message: 'Account created successfully',
            token,
            apiKey,
            user: { id: result.lastInsertRowid, email },
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return res.json({
            token,
            apiKey: user.api_key,
            user: { id: user.id, email: user.email },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login failed' });
    }
};

const getProfile = (req, res) => {
    const user = db.prepare('SELECT id, email, api_key, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
};

module.exports = { register, login, getProfile };
