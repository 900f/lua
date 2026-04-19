import { getDb } from '@/lib/db';
import { getUserFromRequest, sanitize } from '@/lib/auth';
import { generateScriptKey } from '@/lib/obfuscate';
import { rateLimit } from '@/lib/ratelimit';
function getExpiry(d) {
  if (!d || d==='lifetime') return null;
  const n = new Date();
  if (d==='day') return new Date(n.getTime()+86400000);
  if (d==='week') return new Date(n.getTime()+7*86400000);
  if (d==='month') return new Date(n.getTime()+30*86400000);
  return null;
}
export default async function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const rl = rateLimit('keys:'+user.id, 20, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });
  const { scriptId } = req.query;
  const sql = getDb();
  const [sc] = await sql`SELECT id FROM scripts WHERE id=${scriptId} AND user_id=${user.id} LIMIT 1`;
  if (!sc) return res.status(404).json({ error: 'Script not found.' });
  if (req.method === 'GET') {
    const keys = await sql`SELECT id,key_value,hwid,hwid_locked,active,note,duration,expires_at,created_at,last_used FROM script_keys WHERE script_id=${scriptId} AND user_id=${user.id} ORDER BY created_at DESC`;
    return res.json({ keys });
  }
  if (req.method === 'POST') {
    const note = sanitize(req.body.note||'', 200);
    const hwid_locked = req.body.hwid_locked === true;
    const count = Math.min(parseInt(req.body.count)||1, 100);
    const duration = ['day','week','month','lifetime'].includes(req.body.duration) ? req.body.duration : 'lifetime';
    const expires_at = getExpiry(duration);
    const created = [];
    for (let i=0;i<count;i++) {
      const key_value = generateScriptKey();
      const [k] = await sql`INSERT INTO script_keys (script_id,user_id,key_value,hwid_locked,note,duration,expires_at) VALUES (${scriptId},${user.id},${key_value},${hwid_locked},${note},${duration},${expires_at}) RETURNING id,key_value,hwid_locked,note,duration,expires_at,created_at`;
      created.push(k);
    }
    return res.status(201).json({ keys: created });
  }
  return res.status(405).end();
}
