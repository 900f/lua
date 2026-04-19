import { getDb } from '@/lib/db';
import { getUserFromRequest, sanitize } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const rl = rateLimit('wh:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const sql = getDb();
  if (req.method === 'GET') {
    const webhooks = await sql`SELECT id,url,events,active,created_at FROM webhooks WHERE user_id=${user.id} ORDER BY created_at DESC`;
    return res.json({ webhooks });
  }
  if (req.method === 'POST') {
    const url = sanitize(req.body.url, 500);
    const events = Array.isArray(req.body.events) ? req.body.events : ['execution'];
    if (!url || !url.startsWith('https://')) return res.status(400).json({ error: 'Valid HTTPS URL required.' });
    const [wh] = await sql`INSERT INTO webhooks (user_id,url,events) VALUES (${user.id},${url},${events}) RETURNING id,url,events,active,created_at`;
    return res.status(201).json({ webhook: wh });
  }
  return res.status(405).end();
}
