import { getDb } from '@/lib/db';
import { getUserFromRequest, sanitize } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const rl = rateLimit('ib:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const sql = getDb();
  if (req.method === 'GET') {
    const bans = await sql`SELECT id,ip_address,reason,banned_at FROM ip_bans WHERE user_id=${user.id} ORDER BY banned_at DESC`;
    return res.json({ bans });
  }
  if (req.method === 'POST') {
    const ip_address = sanitize(req.body.ip_address, 60);
    const reason = sanitize(req.body.reason||'', 200);
    if (!ip_address) return res.status(400).json({ error: 'IP address required.' });
    try {
      await sql`INSERT INTO ip_bans (user_id,ip_address,reason) VALUES (${user.id},${ip_address},${reason}) ON CONFLICT (user_id,ip_address) DO UPDATE SET reason=${reason}`;
      return res.status(201).json({ ok: true });
    } catch { return res.status(400).json({ error: 'Failed to ban IP.' }); }
  }
  return res.status(405).end();
}
