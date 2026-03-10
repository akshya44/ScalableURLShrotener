const { getLinkAnalytics, getSummary } = require('../services/analyticsService');
const db = require('../config/db');

const getLinkAnalyticsHandler = (req, res) => {
    try {
        const { shortCode } = req.params;
        const { days = 30 } = req.query;

        // Verify ownership if authenticated
        if (req.user) {
            const url = db.prepare('SELECT user_id FROM urls WHERE short_code = ?').get(shortCode);
            if (url && url.user_id && url.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        const analytics = getLinkAnalytics(shortCode, Number(days));
        return res.json(analytics);
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

const getSummaryHandler = (req, res) => {
    try {
        const summary = getSummary(req.user.id);
        return res.json(summary);
    } catch (err) {
        console.error('Summary error:', err);
        return res.status(500).json({ error: 'Failed to fetch summary' });
    }
};

module.exports = { getLinkAnalyticsHandler, getSummaryHandler };
