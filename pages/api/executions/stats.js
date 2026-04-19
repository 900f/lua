import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  const rl = rateLimit('es:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const sql = getDb();
  const [s] = await sql`SELECT COUNT(*) as total,COUNT(*) FILTER (WHERE active) as active,COUNT(*) FILTER (WHERE key_protected OR use_key_system) as key_protected FROM scripts WHERE user_id=${user.id}`;
  const [k] = await sql`SELECT COUNT(*) as total,COUNT(*) FILTER (WHERE active) as active,COUNT(*) FILTER (WHERE hwid IS NOT NULL) as hwid_bound,COUNT(*) FILTER (WHERE created_at>NOW()-INTERVAL '24 hours') as today FROM script_keys WHERE user_id=${user.id}`;
  const [e] = await sql`SELECT COUNT(*) as total,COUNT(*) FILTER (WHERE success) as successful,COUNT(*) FILTER (WHERE NOT success) as failed,COUNT(*) FILTER (WHERE executed_at>NOW()-INTERVAL '24 hours') as today FROM executions WHERE user_id=${user.id}`;
  return res.json({ scripts:s, keys:k, executions:e });
}
