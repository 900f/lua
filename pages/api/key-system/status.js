import { getDb } from '@/lib/db';
import { getIp } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const ip = getIp(req);
  const rl = rateLimit(`ks_status:${ip}`, 30, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Rate limited.' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const sql = getDb();
  const [kt] = await sql`SELECT id,script_id,tasks_completed,completed,key_value,expires_at,roblox_name FROM key_system_tokens WHERE token=${token} LIMIT 1`;
  if (!kt) return res.status(404).json({ error: 'Invalid token' });
  if (new Date(kt.expires_at) < new Date()) return res.status(410).json({ error: 'Token expired. Re-run the script.' });

  const tasks = await sql`SELECT id,task_type,label,url,sort_order FROM key_system_tasks WHERE script_id=${kt.script_id} AND active=true ORDER BY sort_order`;
  const done = Array.isArray(kt.tasks_completed) ? kt.tasks_completed : [];
  return res.json({
    roblox_name: kt.roblox_name, completed: kt.completed,
    key: kt.completed ? kt.key_value : null,
    tasks: tasks.map(t => ({ id: t.id, label: t.label, url: t.url, type: t.task_type, done: done.includes(t.id) })),
  });
}
