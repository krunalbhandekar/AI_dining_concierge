const env = require("../../config/env");

const store = new Map();

function now() {
  return Date.now();
}

function createKey(criteria) {
  const stable = {
    location: criteria.location,
    area: criteria.area,
    budget: criteria.budget,
    cuisine: [...(criteria.cuisine || [])].sort(),
    minRating: criteria.minRating,
    preferences: [...(criteria.preferences || [])].sort(),
  };
  return JSON.stringify(stable);
}

function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  if (store.size >= env.CACHE_MAX_ITEMS) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(key, {
    value,
    expiresAt: now() + env.CACHE_TTL_MS,
  });
}

function cacheStats() {
  return {
    size: store.size,
    ttlMs: env.CACHE_TTL_MS,
    maxItems: env.CACHE_MAX_ITEMS,
  };
}

module.exports = {
  createKey,
  getCached,
  setCached,
  cacheStats,
};
