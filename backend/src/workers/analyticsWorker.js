const { Worker } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const db = require('../config/db');

let geo;
try {
    geo = require('geoip-lite');
} catch { geo = null; }

const { UAParser } = require('ua-parser-js');

const startWorker = (io) => {
    try {
        const worker = new Worker(
            'analytics',
            async (job) => {
                const { shortCode, ip, userAgent, referrer } = job.data;

                // Geo lookup
                let country = 'Unknown', city = 'Unknown';
                if (geo && ip && ip !== '127.0.0.1' && ip !== '::1') {
                    const geoData = geo.lookup(ip);
                    if (geoData) {
                        country = geoData.country || 'Unknown';
                        city = geoData.city || 'Unknown';
                    }
                }

                // Device/browser detection
                const parser = new UAParser(userAgent || '');
                const result = parser.getResult();
                const device = result.device.type || 'desktop';
                const browser = result.browser.name || 'Unknown';
                const os = result.os.name || 'Unknown';

                // Insert click record
                db.prepare(`
                  INSERT INTO clicks (short_code, ip_address, country, city, device, browser, os, referrer)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(shortCode, ip, country, city, device, browser, os, referrer || '');

                // Increment click count
                db.prepare('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?').run(shortCode);

                // Emit Real-Time Analytics Event
                if (io) {
                    io.emit('click_event', {
                        shortCode,
                        timestamp: Date.now(),
                        country,
                        device,
                        browser,
                        os
                    });
                }
            },
            {
                connection: getRedisClient(),
                concurrency: 5,
            }
        );

        worker.on('completed', (job) => {
            console.log(`✅ Analytics job ${job.id} processed`);
        });

        worker.on('failed', (job, err) => {
            console.error(`❌ Analytics job ${job?.id} failed:`, err.message);
        });

        console.log('🔄 Analytics worker started');
        return worker;
    } catch (err) {
        console.warn('⚠️  Analytics worker could not start (Redis unavailable?):', err.message);
        return null;
    }
};

module.exports = { startWorker };
