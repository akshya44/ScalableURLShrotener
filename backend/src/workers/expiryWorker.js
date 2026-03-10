const cron = require('node-cron');
const db = require('../config/db');

const startExpiryWorker = () => {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', () => {
        try {
            const result = db.prepare(`
                UPDATE urls
                SET is_active = 0
                WHERE expiry_date < CURRENT_TIMESTAMP AND is_active = 1
            `).run();

            if (result.changes > 0) {
                console.log(`🧹 Smart Expiry Worker: Disabled ${result.changes} expired links.`);
            }
        } catch (error) {
            console.error('❌ Smart Expiry Worker Error:', error);
        }
    });

    console.log('⏳ Smart Expiry Worker scheduled (runs every 10m)');
};

module.exports = { startExpiryWorker };
