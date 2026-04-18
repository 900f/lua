import { getDb } from '../../../lib/db';

export default async function handler(req, res) {
  // Can be called by Vercel Cron or manually
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sql = getDb();

  // Delete executions older than 3 days
  const { count: execDel } = await sql`
    DELETE FROM executions WHERE executed_at < NOW() - INTERVAL '3 days'
    RETURNING id
  `.then(r => ({ count: r.length }));

  // Delete expired key system tokens
  const { count: tokenDel } = await sql`
    DELETE FROM key_system_tokens WHERE expires_at < NOW() - INTERVAL '1 day'
    RETURNING id
  `.then(r => ({ count: r.length }));

  return res.json({ ok: true, deleted_executions: execDel, deleted_tokens: tokenDel });
}
