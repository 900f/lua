import { getDb } from '@/lib/db';
import { signToken, sanitize, getIp } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import bcrypt from 'bcryptjs';
import { setCookie } from 'cookies-next';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = getIp(req);
  const rl = rateLimit(`login:${ip}`, 5, 10000);
  if (!rl.allowed) return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)}s.` });

  const email = sanitize(req.body.email, 255).toLowerCase();
  const password = sanitize(req.body.password, 200);
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const sql = getDb();
  const [user] = await sql`SELECT id,email,username,password_hash FROM users WHERE email=${email} LIMIT 1`;
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = signToken({ id: user.id, email: user.email, username: user.username });
  setCookie('lv_token', token, { req, res, maxAge: 60*60*24*30, httpOnly: true, sameSite: 'lax', path: '/' });
  return res.status(200).json({ ok: true });
}
