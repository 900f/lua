import { getDb } from '../../../lib/db';
import { getUserFromRequest, sanitize } from '../../../lib/auth';
import { rateLimit } from '../../../lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const rl = rateLimit(`script_crud:${user.id}`, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const { id } = req.query;
  const sql = getDb();
  const [script] = await sql`SELECT * FROM scripts WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`;
  if (!script) return res.status(404).json({ error: 'Script not found.' });

  if (req.method === 'GET') return res.json({ script });

  if (req.method === 'PUT') {
    const name = sanitize(req.body.name, 100);
    const description = sanitize(req.body.description, 500);
    const script_content = sanitize(req.body.script_content, 500000);
    const key_protected = req.body.key_protected === true;
    const use_key_system = req.body.use_key_system === true;
    const active = req.body.active !== false;
    if (!name) return res.status(400).json({ error: 'Script name is required.' });
    const [updated] = await sql`
      UPDATE scripts SET name=${name}, description=${description}, script_content=${script_content},
        key_protected=${key_protected}, use_key_system=${use_key_system}, active=${active}, updated_at=NOW()
      WHERE id=${id} AND user_id=${user.id}
      RETURNING id, name, description, loader_key, key_protected, use_key_system, active, updated_at
    `;
    return res.json({ script: updated });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM scripts WHERE id=${id} AND user_id=${user.id}`;
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
