const Redis = require('ioredis');

// During tests — return a dummy client that does nothing
// This prevents tests from timing out waiting for Redis
if (process.env.NODE_ENV === 'test') {
  module.exports = {
    get:    async () => null,
    setex:  async () => null,
    del:    async () => null,
    keys:   async () => [],
    on:     () => {},
  };
} else {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck:     false,
    lazyConnect:          true,
  });
  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error',   (err) => console.error('Redis error:', err.message));

  module.exports = redis;
}