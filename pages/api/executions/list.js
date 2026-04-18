import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  const rl = rateLimit(`exec_list:${user.id}`, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const sql = getDb();
  const { scriptId, limit = 200 } = req.query;

  if (Math.random() < 0.01) sql`DELETE FROM executions WHERE executed_at < NOW()-INTERVAL '3 days'`.catch(()=>{});

  let executions;
  if (scriptId) {
    const [sc] = await sql`SELECT id FROM scripts WHERE id=${scriptId} AND user_id=${user.id} LIMIT 1`;
    if (!sc) return res.status(404).json({ error: 'Script not found.' });
    executions = await sql`SELECT e.id,e.roblox_name,e.ip_address,e.key_used,e.hwid,e.success,e.fail_reason,e.executed_at,s.name as script_name FROM executions e JOIN scripts s ON s.id=e.script_id WHERE e.script_id=${scriptId} AND e.user_id=${user.id} ORDER BY e.executed_at DESC LIMIT ${parseInt(limit)}`;
  } else {
    executions = await sql`SELECT e.id,e.roblox_name,e.ip_address,e.key_used,e.hwid,e.success,e.fail_reason,e.executed_at,s.name as script_name FROM executions e JOIN scripts s ON s.id=e.script_id WHERE e.user_id=${user.id} ORDER BY e.executed_at DESC LIMIT ${parseInt(limit)}`;
  }
  return res.json({ executions });
}
