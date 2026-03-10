const { Queue } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const db = require('../config/db');

let analyticsQueue;

const getQueue = () => {
    if (!analyticsQueue) {
        try {
            analyticsQueue = new Queue('analytics', {
                connection: getRedisClient(),
                defaultJobOptions: { removeOnComplete: 100, removeOnFail: 50 },
            });
        } catch {
            analyticsQueue = null;
        }
    }
    return analyticsQueue;
};

/**
 * Enqueue a click event for async processing.
 */
const enqueueClick = async (data) => {
    try {
        const queue = getQueue();
        if (queue) {
            await queue.add('click', data);
        } else {
            // Fallback: direct insert if queue unavailable
            insertClick(data);
        }
    } catch {
        insertClick(data);
    }
};

const insertClick = (data) => {
    try {
        db.prepare(`
      INSERT INTO clicks (short_code, ip_address, country, city, device, browser, os, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            data.shortCode, data.ip, data.country, data.city,
            data.device, data.browser, data.os, data.referrer
        );
        db.prepare('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?').run(data.shortCode);
    } catch (err) {
        console.error('Direct click insert error:', err.message);
    }
};

/**
 * Get analytics for a specific short code.
 */
const getLinkAnalytics = (shortCode, days = 30) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const clicksPerDay = db.prepare(`
    SELECT DATE(clicked_at) as date, COUNT(*) as count
    FROM clicks
    WHERE short_code = ? AND clicked_at >= ?
    GROUP BY DATE(clicked_at)
    ORDER BY date ASC
  `).all(shortCode, since);

    const topCountries = db.prepare(`
    SELECT country, COUNT(*) as count
    FROM clicks
    WHERE short_code = ? AND country IS NOT NULL
    GROUP BY country ORDER BY count DESC LIMIT 10
  `).all(shortCode);

    const devices = db.prepare(`
    SELECT device, COUNT(*) as count
    FROM clicks
    WHERE short_code = ?
    GROUP BY device ORDER BY count DESC
  `).all(shortCode);

    const browsers = db.prepare(`
    SELECT browser, COUNT(*) as count
    FROM clicks
    WHERE short_code = ?
    GROUP BY browser ORDER BY count DESC LIMIT 8
  `).all(shortCode);

    const total = db.prepare('SELECT click_count FROM urls WHERE short_code = ?').get(shortCode);

    return { clicksPerDay, topCountries, devices, browsers, total: total?.click_count || 0 };
};

/**
 * Get dashboard summary for a user.
 */
const getSummary = (userId) => {
    const totalLinks = db.prepare('SELECT COUNT(*) as count FROM urls WHERE user_id = ?').get(userId);
    const activeLinks = db.prepare('SELECT COUNT(*) as count FROM urls WHERE user_id = ? AND is_active = 1').get(userId);
    const totalClicks = db.prepare('SELECT SUM(click_count) as total FROM urls WHERE user_id = ?').get(userId);
    const recentClicks = db.prepare(`
    SELECT DATE(c.clicked_at) as date, COUNT(*) as count
    FROM clicks c
    JOIN urls u ON c.short_code = u.short_code
    WHERE u.user_id = ? AND c.clicked_at >= date('now', '-30 days')
    GROUP BY DATE(c.clicked_at) ORDER BY date ASC
  `).all(userId);

    return {
        totalLinks: totalLinks.count,
        activeLinks: activeLinks.count,
        totalClicks: totalClicks.total || 0,
        recentClicks,
    };
};

module.exports = { enqueueClick, getLinkAnalytics, getSummary };
