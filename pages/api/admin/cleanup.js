import { getDb } from '@/lib/db';

export default async function handler(req, res) {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getDb();
  const execs = await sql`DELETE FROM executions WHERE executed_at < NOW()-INTERVAL '3 days' RETURNING id`;
  const tokens = await sql`DELETE FROM key_system_tokens WHERE expires_at < NOW()-INTERVAL '1 day' RETURNING id`;
  return res.json({ ok: true, deleted_executions: execs.length, deleted_tokens: tokens.length });
}
