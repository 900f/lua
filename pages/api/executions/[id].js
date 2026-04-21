import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'DELETE') return res.status(405).end();

  const rl = rateLimit('ed:' + user.id, 30, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Execution id is required.' });

  const sql = getDb();
  const deleted = await sql`
    DELETE FROM executions
    WHERE id=${id} AND user_id=${user.id}
    RETURNING id
  `;

  if (!deleted.length) return res.status(404).json({ error: 'Execution not found.' });
  return res.json({ ok: true, id: deleted[0].id });
}
