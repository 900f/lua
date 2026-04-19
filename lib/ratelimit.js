const store = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const e = store.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > e.resetAt) { e.count = 0; e.resetAt = now + windowMs; }
  e.count++;
  store.set(key, e);
  if (Math.random() < 0.005) {
    for (const [k, v] of store) if (Date.now() > v.resetAt) store.delete(k);
  }
  return { allowed: e.count <= max, resetAt: e.resetAt };
}
