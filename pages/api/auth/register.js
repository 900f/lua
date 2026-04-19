import { getDb } from '@/lib/db';
import { signToken, sanitize, validateEmail, getIp } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import bcrypt from 'bcryptjs';
import { setCookie } from 'cookies-next';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = getIp(req);
  const rl = rateLimit('reg:'+ip, 3, 600000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many attempts. Try again in 10 minutes.' });
  const email = sanitize(req.body.email, 255).toLowerCase();
  const username = sanitize(req.body.username, 50);
  const password = sanitize(req.body.password, 200);
  if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });
  if (!username || username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username: letters, numbers, underscores only.' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const sql = getDb();
  const ex = await sql`SELECT id FROM users WHERE email=${email} OR username=${username} LIMIT 1`;
  if (ex.length) return res.status(409).json({ error: 'Email or username already taken.' });
  const hash = await bcrypt.hash(password, 12);
  const [user] = await sql`INSERT INTO users (email,username,password_hash) VALUES (${email},${username},${hash}) RETURNING id,email,username`;
  await sql`INSERT INTO user_settings (user_id) VALUES (${user.id}) ON CONFLICT DO NOTHING`;
  const token = signToken({ id: user.id, email: user.email, username: user.username });
  setCookie('lv_token', token, { req, res, maxAge: 60*60*24*30, httpOnly: true, sameSite: 'lax', path: '/' });
  return res.status(201).json({ ok: true });
}
