import { getDb } from 'lib/db';
import { getUserFromRequest } from 'lib/auth';
import { rateLimit } from 'lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const rl = rateLimit(`key_action:${user.id}`, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const { keyId } = req.query;
  const sql = getDb();
  const [key] = await sql`SELECT id FROM script_keys WHERE id=${keyId} AND user_id=${user.id} LIMIT 1`;
  if (!key) return res.status(404).json({ error: 'Key not found.' });

  if (req.method === 'DELETE') {
    await sql`DELETE FROM script_keys WHERE id=${keyId} AND user_id=${user.id}`;
    return res.json({ ok: true });
  }

  if (req.method === 'PATCH') {
    const { action } = req.body;
    if (action === 'toggle') {
      const [updated] = await sql`UPDATE script_keys SET active=NOT active WHERE id=${keyId} AND user_id=${user.id} RETURNING active`;
      return res.json({ active: updated.active });
    }
    if (action === 'reset_hwid') {
      await sql`UPDATE script_keys SET hwid=NULL WHERE id=${keyId} AND user_id=${user.id}`;
      return res.json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  }

  return res.status(405).end();
}
