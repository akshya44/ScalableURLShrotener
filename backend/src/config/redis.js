const Redis = require('ioredis');

let redisClient;

const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: null, // Required for BullMQ
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 5) {
                    console.error('Redis connection failed after 5 retries. Running without Redis.');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
        });

        redisClient.on('connect', () => console.log('✅ Redis connected'));
        redisClient.on('error', (err) => console.warn('⚠️  Redis error:', err.message));
    }
    return redisClient;
};

module.exports = { getRedisClient };
