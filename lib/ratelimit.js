const store = new Map();

export function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = store.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count++;
  store.set(key, entry);

  if (Math.random() < 0.01) {
    for (const [k, v] of store) {
      if (Date.now() > v.resetAt) store.delete(k);
    }
  }

  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}
