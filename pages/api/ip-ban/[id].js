import { getDb } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'DELETE') return res.status(405).end();

  const { id } = req.query;
  const sql = getDb();
  await sql`DELETE FROM ip_bans WHERE id = ${id} AND user_id = ${user.id}`;
  return res.json({ ok: true });
}
