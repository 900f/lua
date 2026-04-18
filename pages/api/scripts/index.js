import { getDb } from '@/lib/db';
import { getUserFromRequest, sanitize } from '@/lib/auth';
import { generateLoaderKey } from '@/lib/obfuscate';
import { rateLimit } from '@/lib/ratelimit';

export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getDb();

  if (req.method === 'GET') {
    const rl = rateLimit(`scripts_list:${user.id}`, 30, 10000);
    if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
    const scripts = await sql`
      SELECT s.id, s.name, s.description, s.loader_key, s.key_protected, s.use_key_system, s.active, s.created_at,
        (SELECT COUNT(*) FROM executions e WHERE e.script_id=s.id) as exec_count,
        (SELECT COUNT(*) FROM script_keys k WHERE k.script_id=s.id) as key_count
      FROM scripts s WHERE s.user_id=${user.id} ORDER BY s.created_at DESC
    `;
    return res.json({ scripts });
  }

  if (req.method === 'POST') {
    const rl = rateLimit(`scripts_create:${user.id}`, 5, 10000);
    if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
    const name = sanitize(req.body.name, 100);
    const description = sanitize(req.body.description || '', 500);
    const script_content = sanitize(req.body.script_content, 500000);
    const key_protected = req.body.key_protected === true;
    const use_key_system = req.body.use_key_system === true;
    if (!name) return res.status(400).json({ error: 'Script name is required.' });
    if (!script_content) return res.status(400).json({ error: 'Script content is required.' });
    const loader_key = generateLoaderKey();
    const [script] = await sql`
      INSERT INTO scripts (user_id,name,description,script_content,loader_key,key_protected,use_key_system)
      VALUES (${user.id},${name},${description},${script_content},${loader_key},${key_protected},${use_key_system})
      RETURNING id,name,loader_key,key_protected,use_key_system,created_at
    `;
    return res.status(201).json({ script });
  }

  return res.status(405).end();
}
