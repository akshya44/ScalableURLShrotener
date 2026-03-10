const { getRedisClient } = require('../config/redis');

const CACHE_TTL = 60 * 60 * 24; // 24 hours

/**
 * Get a cached URL by short code.
 * @param {string} shortCode
 * @returns {Promise<string|null>}
 */
const getCachedUrl = async (shortCode) => {
    try {
        const client = getRedisClient();
        return await client.get(`url:${shortCode}`);
    } catch {
        return null;
    }
};

/**
 * Cache a URL for a short code.
 * @param {string} shortCode
 * @param {string} originalUrl
 * @param {number} [ttl] seconds
 */
const cacheUrl = async (shortCode, originalUrl, ttl = CACHE_TTL) => {
    try {
        const client = getRedisClient();
        await client.setex(`url:${shortCode}`, ttl, originalUrl);
    } catch { /* graceful degradation */ }
};

/**
 * Invalidate a cached URL.
 * @param {string} shortCode
 */
const invalidateUrl = async (shortCode) => {
    try {
        const client = getRedisClient();
        await client.del(`url:${shortCode}`);
    } catch { /* graceful degradation */ }
};

module.exports = { getCachedUrl, cacheUrl, invalidateUrl };
