import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  const rl = rateLimit('audit:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const sql = getDb();
  // Return recent notable events: ip bans, key generations, script changes
  const bans = await sql`SELECT 'ip_ban' as type, ip_address as detail, banned_at as ts FROM ip_bans WHERE user_id=${user.id} ORDER BY banned_at DESC LIMIT 20`;
  const keys = await sql`SELECT 'key_created' as type, key_value as detail, created_at as ts FROM script_keys WHERE user_id=${user.id} ORDER BY created_at DESC LIMIT 20`;
  const scripts = await sql`SELECT 'script_updated' as type, name as detail, updated_at as ts FROM scripts WHERE user_id=${user.id} ORDER BY updated_at DESC LIMIT 20`;
  const combined = [...bans, ...keys, ...scripts].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,50);
  return res.json({ events: combined });
}
