import { getDb } from '@/lib/db';
import { getIp } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

async function logExec(sql, script, name, ip, key, hwid, ok, reason) {
  try {
    await sql`INSERT INTO executions
      (script_id,user_id,roblox_name,ip_address,key_used,hwid,success,fail_reason)
      VALUES (${script.id},${script.user_id},${name||'Unknown'},${ip},
              ${key||null},${hwid||null},${ok},${reason||null})`;
  } catch(_) {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getIp(req);
  const rl = rateLimit('exec:'+ip, 10, 10000);
  if (!rl.allowed) return res.status(429).json({ s: null, e: 'Rate limited.' });

  const { loaderKey } = req.query;
  const { k: keyValue, n: robloxName, h: hwid } = req.body || {};

  const sql = getDb();
  const [script] = await sql`
    SELECT id, user_id, script_content, key_protected, use_key_system, active
    FROM scripts WHERE loader_key = ${loaderKey} LIMIT 1
  `;
  if (!script || !script.active)
    return res.status(403).json({ s: null, e: 'Script not found or disabled.' });

  // IP ban check
  const [banned] = await sql`
    SELECT id FROM ip_bans
    WHERE user_id = ${script.user_id} AND ip_address = ${ip} LIMIT 1
  `;
  if (banned) {
    await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'IP banned');
    return res.status(403).json({ s: null, e: 'Access denied.' });
  }

  // Key validation
  let keyUsed = null;
  if (script.key_protected || script.use_key_system) {
    if (!keyValue) {
      await logExec(sql, script, robloxName, ip, null, hwid, false, 'No key');
      return res.status(403).json({ s: null, e: 'No key provided.' });
    }
    const [sk] = await sql`
      SELECT id, hwid, hwid_locked, active, expires_at
      FROM script_keys
      WHERE script_id = ${script.id} AND key_value = ${keyValue} LIMIT 1
    `;
    if (!sk || !sk.active) {
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Invalid key');
      return res.status(403).json({ s: null, e: 'Invalid or disabled key.' });
    }
    if (sk.expires_at && new Date(sk.expires_at) < new Date()) {
      await sql`UPDATE script_keys SET active = false WHERE id = ${sk.id}`;
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Key expired');
      return res.status(403).json({ s: null, e: 'Key has expired.' });
    }
    if (sk.hwid_locked) {
      if (!sk.hwid) {
        await sql`UPDATE script_keys SET hwid = ${hwid||null}, last_used = NOW() WHERE id = ${sk.id}`;
      } else if (sk.hwid !== hwid) {
        await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'HWID mismatch');
        return res.status(403).json({ s: null, e: 'HWID mismatch.' });
      } else {
        await sql`UPDATE script_keys SET last_used = NOW() WHERE id = ${sk.id}`;
      }
    } else {
      await sql`UPDATE script_keys SET last_used = NOW() WHERE id = ${sk.id}`;
    }
    keyUsed = keyValue;
  }

  await logExec(sql, script, robloxName, ip, keyUsed, hwid, true, null);

  // Return script content directly — no encoding, no wrappers
  // Security: HTTPS transport + server-side key/HWID/IP validation
  return res.status(200).json({ s: script.script_content });
}
