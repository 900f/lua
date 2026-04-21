import { getDb } from '@/lib/db';
import { getIp } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { generateScriptKey } from '@/lib/obfuscate';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const ip = getIp(req);
  const rl = rateLimit('ksc:'+ip, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Rate limited.' });
  
  const { token, taskId } = req.body||{};
  if (!token||!taskId) return res.status(400).json({ error: 'Missing fields' });
  
  const sql = getDb();
  const [kt] = await sql`SELECT id,script_id,tasks_completed,completed,expires_at FROM key_system_tokens WHERE token=${token} LIMIT 1`;
  if (!kt) return res.status(404).json({ error: 'Invalid token' });
  if (kt.completed) return res.json({ ok:true, completed:true });
  if (new Date(kt.expires_at)<new Date()) return res.status(410).json({ error: 'Token expired' });
  
  const tasks = await sql`SELECT id FROM key_system_tasks WHERE script_id=${kt.script_id} AND active=true ORDER BY sort_order`;
  const done = Array.isArray(kt.tasks_completed)?[...kt.tasks_completed]:[];
  if (!done.includes(taskId)) done.push(taskId);
  const allDone = tasks.every(t=>done.includes(t.id));
  
  if (allDone) {
    const [script] = await sql`SELECT user_id FROM scripts WHERE id=${kt.script_id} LIMIT 1`;
    const key_value = generateScriptKey();
    const expires_at = new Date(Date.now() + 86400000); // 1 day from now
    await sql`INSERT INTO script_keys (script_id, user_id, key_value, note, duration, expires_at, hwid_locked) VALUES (${kt.script_id}, ${script.user_id}, ${key_value}, 'Key System - auto', 'day', ${expires_at}, true)`;
    await sql`UPDATE key_system_tokens SET tasks_completed=${JSON.stringify(done)}, completed=true, key_value=${key_value} WHERE id=${kt.id}`;
    return res.json({ ok:true, completed:true, key:key_value });
  } else {
    await sql`UPDATE key_system_tokens SET tasks_completed=${JSON.stringify(done)} WHERE id=${kt.id}`;
    return res.json({ ok:true, completed:false, done });
  }
}