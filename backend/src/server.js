require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { globalLimiter } = require('./middleware/rateLimiter');
const { redirect } = require('./controllers/urlController');
const { optionalAuth } = require('./middleware/authMiddleware');
const { startWorker } = require('./workers/analyticsWorker');
const { startExpiryWorker } = require('./workers/expiryWorker');

const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Parsing ──────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Redirect Route (must come after API routes) ─────────────────────────────
app.get('/:shortCode', optionalAuth, redirect);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start Server ─────────────────────────────────────────────────────────────
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log(`📡 Client connected to websocket: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`📡 Client disconnected: ${socket.id}`);
    });
});

// Export io so workers/controllers can emit events
app.set('io', io);

server.listen(PORT, () => {
    console.log(`🚀 ShortLinkX API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    startWorker(io); // Pass io to BullMQ analytics worker
    startExpiryWorker(); // Start cron job to disable expired URLs
});

module.exports = { app, server, io };
