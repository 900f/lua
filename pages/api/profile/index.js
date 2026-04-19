import { getDb } from '@/lib/db';
import { getUserFromRequest, sanitize } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import bcrypt from 'bcryptjs';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).end();
  const rl = rateLimit('profile:'+user.id, 5, 30000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const sql = getDb();
  const { action } = req.body;
  if (action === 'change_password') {
    const current = sanitize(req.body.current, 200);
    const newPass = sanitize(req.body.new_password, 200);
    if (newPass.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    const [u] = await sql`SELECT password_hash FROM users WHERE id=${user.id} LIMIT 1`;
    const valid = await bcrypt.compare(current, u.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPass, 12);
    await sql`UPDATE users SET password_hash=${hash} WHERE id=${user.id}`;
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: 'Unknown action.' });
}
