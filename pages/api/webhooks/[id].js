import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const rl = rateLimit('whd:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const { id } = req.query;
  const sql = getDb();
  if (req.method === 'DELETE') {
    await sql`DELETE FROM webhooks WHERE id=${id} AND user_id=${user.id}`;
    return res.json({ ok: true });
  }
  if (req.method === 'PATCH') {
    const active = req.body.active !== false;
    await sql`UPDATE webhooks SET active=${active} WHERE id=${id} AND user_id=${user.id}`;
    return res.json({ ok: true });
  }
  return res.status(405).end();
}
