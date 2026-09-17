const redis = require('./redis');

const TTL = {
  CABS_LIST:   60,   // 60 seconds
  CAB_DETAIL:  300,  // 5 minutes
};

const get = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null;
  }
};

const set = async (key, data, ttl = TTL.CABS_LIST) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
};

const del = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Cache delete error:', err.message);
  }
};

const invalidate = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    console.error('Cache invalidate error:', err.message);
  }
};

module.exports = { get, set, del, invalidate, TTL };