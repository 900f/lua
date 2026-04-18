import { getDb } from '../../../lib/db';
import { getUserFromRequest, sanitize } from '../../../lib/auth';
import { rateLimit } from '../../../lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const rl = rateLimit(`settings:${user.id}`, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const sql = getDb();

  if (req.method === 'GET') {
    const [s] = await sql`SELECT theme FROM user_settings WHERE user_id=${user.id} LIMIT 1`;
    return res.json({ theme: s?.theme || 'pink' });
  }

  if (req.method === 'POST') {
    const theme = sanitize(req.body.theme, 20);
    if (!['pink','purple','blue','green','orange'].includes(theme)) return res.status(400).json({ error: 'Invalid theme.' });
    await sql`
      INSERT INTO user_settings (user_id, theme) VALUES (${user.id}, ${theme})
      ON CONFLICT (user_id) DO UPDATE SET theme=${theme}, updated_at=NOW()
    `;
    return res.json({ ok: true, theme });
  }

  return res.status(405).end();
}
