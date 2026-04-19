import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).end();
  const rl = rateLimit('ts:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const sql = getDb();
  const days = Math.min(parseInt(req.query.days)||7, 30);
  const series = await sql`
    SELECT
      DATE(executed_at) as date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE success=true) as successful,
      COUNT(*) FILTER (WHERE success=false) as failed
    FROM executions
    WHERE user_id=${user.id}
      AND executed_at > NOW() - (${days} || ' days')::INTERVAL
    GROUP BY DATE(executed_at)
    ORDER BY date ASC
  `;
  return res.json({ series, days });
}
