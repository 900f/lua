import { getDb } from 'lib/db';
import { getUserFromRequest } from 'lib/auth';
import { rateLimit } from 'lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const rl = rateLimit(`ks_tasks:${user.id}`, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const { scriptId } = req.query;
  const sql = getDb();
  const [script] = await sql`SELECT id FROM scripts WHERE id=${scriptId} AND user_id=${user.id} LIMIT 1`;
  if (!script) return res.status(404).json({ error: 'Script not found.' });

  if (req.method === 'GET') {
    const tasks = await sql`SELECT id, task_type, label, url, sort_order, active FROM key_system_tasks WHERE script_id=${scriptId} ORDER BY sort_order`;
    return res.json({ tasks });
  }

  if (req.method === 'POST') {
    const label = sanitize(req.body.label, 100);
    const url = sanitize(req.body.url, 500);
    const task_type = sanitize(req.body.task_type, 30) || 'link';
    const sort_order = parseInt(req.body.sort_order) || 0;
    if (!label || !url) return res.status(400).json({ error: 'Label and URL required.' });
    const [task] = await sql`
      INSERT INTO key_system_tasks (script_id, user_id, task_type, label, url, sort_order)
      VALUES (${scriptId}, ${user.id}, ${task_type}, ${label}, ${url}, ${sort_order})
      RETURNING id, task_type, label, url, sort_order, active
    `;
    return res.status(201).json({ task });
  }

  return res.status(405).end();
}
