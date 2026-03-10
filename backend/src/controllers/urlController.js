const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { encode } = require('../utils/base62');
const { generateQR } = require('../utils/qrGenerator');
const { getCachedUrl, cacheUrl, invalidateUrl } = require('../services/cacheService');
const { enqueueClick } = require('../services/analyticsService');
const { fetchPreview } = require('../services/previewService');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Validate URL - block malicious schemes
const isValidUrl = (urlString) => {
    try {
        const url = new URL(urlString);
        const blocked = ['javascript:', 'data:', 'vbscript:', 'file:'];
        if (blocked.includes(url.protocol)) return false;
        if (!['http:', 'https:'].includes(url.protocol)) return false;
        return true;
    } catch {
        return false;
    }
};

// Get link status
const getLinkStatus = (url) => {
    if (!url.is_active) return 'disabled';
    if (url.expiry_date && new Date(url.expiry_date) < new Date()) return 'expired';
    return 'active';
};

const shorten = async (req, res) => {
    try {
        const { original_url, custom_slug, expiry_date, password } = req.body;
        const userId = req.user?.id || null;

        if (!original_url) return res.status(400).json({ error: 'URL is required' });
        if (!isValidUrl(original_url)) return res.status(400).json({ error: 'Invalid or unsafe URL' });

        // Custom slug validation
        if (custom_slug) {
            if (!/^[a-zA-Z0-9_-]{3,30}$/.test(custom_slug)) {
                return res.status(400).json({ error: 'Slug must be 3-30 alphanumeric chars, dashes or underscores' });
            }
            const existing = db.prepare('SELECT id FROM urls WHERE short_code = ?').get(custom_slug);
            if (existing) return res.status(409).json({ error: 'Slug already taken' });
        }

        let passwordHash = null;
        if (password) passwordHash = await bcrypt.hash(password, 10);

        // Fetch Link Preview
        const preview = await fetchPreview(original_url);

        // Insert with a placeholder short_code to get the ID
        const tempCode = `tmp_${Date.now()}`;
        const result = db.prepare(`
      INSERT INTO urls (original_url, short_code, user_id, expiry_date, password, title, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            original_url,
            custom_slug || tempCode,
            userId,
            expiry_date || null,
            passwordHash,
            preview.title,
            preview.description,
            preview.image
        );

        const id = result.lastInsertRowid;
        const shortCode = custom_slug || encode(id);

        if (!custom_slug) {
            db.prepare('UPDATE urls SET short_code = ? WHERE id = ?').run(shortCode, id);
        }

        const shortUrl = `${BASE_URL}/${shortCode}`;
        const qrCode = await generateQR(shortUrl);

        // Cache it
        await cacheUrl(shortCode, original_url);

        return res.status(201).json({
            id,
            original_url,
            short_code: shortCode,
            short_url: shortUrl,
            qr_code: qrCode,
            expiry_date: expiry_date || null,
            is_password_protected: !!password,
            status: 'active',
        });
    } catch (err) {
        console.error('Shorten error DETAILS:', err.message, err.stack);
        return res.status(500).json({ error: 'Failed to shorten URL' });
    }
};

const redirect = async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Cache-first lookup
        let originalUrl = await getCachedUrl(shortCode);

        let urlRecord;
        if (!originalUrl) {
            urlRecord = db.prepare('SELECT * FROM urls WHERE short_code = ?').get(shortCode);
            if (!urlRecord) return res.status(404).json({ error: 'Short URL not found' });
            originalUrl = urlRecord.original_url;
            await cacheUrl(shortCode, originalUrl);
        } else {
            urlRecord = db.prepare('SELECT * FROM urls WHERE short_code = ?').get(shortCode);
        }

        if (!urlRecord) return res.status(404).json({ error: 'Short URL not found' });

        // Status checks
        if (!urlRecord.is_active) return res.status(410).json({ error: 'This link has been disabled' });
        if (urlRecord.expiry_date && new Date(urlRecord.expiry_date) < new Date()) {
            return res.status(410).json({ error: 'This link has expired' });
        }

        // Password protection
        if (urlRecord.password) {
            const providedPass = req.query.p || req.headers['x-link-password'];
            if (!providedPass) {
                return res.status(401).json({ error: 'Password required', password_protected: true, short_code: shortCode });
            }
            const valid = await bcrypt.compare(providedPass, urlRecord.password);
            if (!valid) return res.status(403).json({ error: 'Incorrect password' });
        }

        // Enqueue analytics asynchronously
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        enqueueClick({
            shortCode,
            ip,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer'] || '',
        });

        return res.redirect(302, originalUrl);
    } catch (err) {
        console.error('Redirect error:', err);
        return res.status(500).json({ error: 'Redirect failed' });
    }
};

const getUserUrls = (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const urls = db.prepare(`
      SELECT id, original_url, short_code, expiry_date, is_active, click_count, created_at,
             CASE
               WHEN is_active = 0 THEN 'disabled'
               WHEN expiry_date IS NOT NULL AND expiry_date < datetime('now') THEN 'expired'
               ELSE 'active'
             END as status,
             (password IS NOT NULL) as is_password_protected
      FROM urls
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, Number(limit), Number(offset));

        const total = db.prepare('SELECT COUNT(*) as count FROM urls WHERE user_id = ?').get(req.user.id);

        const BASE = process.env.BASE_URL || 'http://localhost:5000';
        const result = urls.map(u => ({ ...u, short_url: `${BASE}/${u.short_code}` }));

        return res.json({ urls: result, total: total.count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error('Get URLs error:', err);
        return res.status(500).json({ error: 'Failed to fetch URLs' });
    }
};

const editUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { original_url, expiry_date, is_active, password } = req.body;

        const url = db.prepare('SELECT * FROM urls WHERE id = ? AND user_id = ?').get(id, req.user.id);
        if (!url) return res.status(404).json({ error: 'URL not found or unauthorized' });

        let passwordHash = url.password;
        if (password !== undefined) {
            passwordHash = password ? await bcrypt.hash(password, 10) : null;
        }

        const newOriginal = original_url || url.original_url;
        const newExpiry = expiry_date !== undefined ? (expiry_date || null) : url.expiry_date;
        const newActive = is_active !== undefined ? (is_active ? 1 : 0) : url.is_active;

        db.prepare(`
      UPDATE urls SET original_url = ?, expiry_date = ?, is_active = ?, password = ?
      WHERE id = ? AND user_id = ?
    `).run(newOriginal, newExpiry, newActive, passwordHash, id, req.user.id);

        // Invalidate cache
        await invalidateUrl(url.short_code);
        await cacheUrl(url.short_code, newOriginal);

        return res.json({ message: 'URL updated successfully' });
    } catch (err) {
        console.error('Edit URL error:', err);
        return res.status(500).json({ error: 'Failed to update URL' });
    }
};

const deleteUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const url = db.prepare('SELECT * FROM urls WHERE id = ? AND user_id = ?').get(id, req.user.id);
        if (!url) return res.status(404).json({ error: 'URL not found or unauthorized' });

        db.prepare('UPDATE urls SET is_active = 0 WHERE id = ?').run(id);
        await invalidateUrl(url.short_code);

        return res.json({ message: 'URL disabled successfully' });
    } catch (err) {
        console.error('Delete URL error:', err);
        return res.status(500).json({ error: 'Failed to disable URL' });
    }
};

const bulkShorten = async (req, res) => {
    try {
        const { urls } = req.body; // Array of { url, custom_slug?, expiry_date? }
        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'Provide an array of URLs' });
        }
        if (urls.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 URLs per bulk request' });
        }

        const BASE = process.env.BASE_URL || 'http://localhost:5000';
        const results = [];

        for (const item of urls) {
            const { url: originalUrl, custom_slug, expiry_date, password } = item;
            if (!isValidUrl(originalUrl)) {
                results.push({ original_url: originalUrl, error: 'Invalid URL' });
                continue;
            }
            try {
                let passwordHash = null;
                if (password) passwordHash = await bcrypt.hash(password, 10);

                const preview = await fetchPreview(originalUrl);

                const tempCode = `tmp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; // More unique temp code
                const result = db.prepare(`
                    INSERT INTO urls (original_url, short_code, user_id, expiry_date, password, title, description, image)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    originalUrl,
                    custom_slug || tempCode,
                    req.user.id, // Use req.user.id for user_id
                    expiry_date || null,
                    passwordHash,
                    preview.title,
                    preview.description,
                    preview.image
                );

                const id = result.lastInsertRowid;
                const shortCode = custom_slug || encode(id);
                if (!custom_slug) db.prepare('UPDATE urls SET short_code = ? WHERE id = ?').run(shortCode, id);

                await cacheUrl(shortCode, originalUrl);
                results.push({ original_url: originalUrl, short_code: shortCode, short_url: `${BASE}/${shortCode}` });
            } catch (e) {
                results.push({ original_url: originalUrl, error: e.message });
            }
        }

        return res.status(201).json({ results, total: results.length });
    } catch (err) {
        console.error('Bulk shorten error:', err);
        return res.status(500).json({ error: 'Bulk shorten failed' });
    }
};

const getUrlInfo = (req, res) => {
    try {
        const { shortCode } = req.params;
        const url = db.prepare(`
      SELECT id, original_url, short_code, expiry_date, is_active, click_count, created_at,
             (password IS NOT NULL) as is_password_protected
      FROM urls WHERE short_code = ?
    `).get(shortCode);

        if (!url) return res.status(404).json({ error: 'Not found' });
        return res.json({ ...url, status: getLinkStatus(url) });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch URL info' });
    }
};

module.exports = { shorten, redirect, getUserUrls, editUrl, deleteUrl, bulkShorten, getUrlInfo };
