import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'DELETE') return res.status(405).end();
  const rl = rateLimit(`ipban_del:${user.id}`, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const { id } = req.query;
  const sql = getDb();
  await sql`DELETE FROM ip_bans WHERE id=${id} AND user_id=${user.id}`;
  return res.json({ ok: true });
}
