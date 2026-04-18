import { getDb } from 'lib/db';
import { getIp } from '../../../../lib/auth';
import { rateLimit } from '../../../../lib/ratelimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getIp(req);
  // 10 executions per 10 seconds per IP
  const rl = rateLimit(`exec:${ip}`, 10, 10000);
  if (!rl.allowed) {
    const waitSecs = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return res.status(429).json({ s: null, e: `Rate limited. Wait ${waitSecs}s.` });
  }

  const { loaderKey } = req.query;
  const { k: keyValue, n: robloxName, h: hwid } = req.body || {};

  const sql = getDb();

  const [script] = await sql`
    SELECT id, user_id, script_content, key_protected, use_key_system, active
    FROM scripts WHERE loader_key = ${loaderKey} LIMIT 1
  `;

  if (!script || !script.active) {
    return res.status(403).json({ s: null, e: 'Script not found or disabled.' });
  }

  // IP ban check
  const [banned] = await sql`
    SELECT id FROM ip_bans WHERE user_id = ${script.user_id} AND ip_address = ${ip} LIMIT 1
  `;
  if (banned) {
    await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'IP banned');
    return res.status(403).json({ s: null, e: 'You are banned from this script.' });
  }

  let keyUsed = null;

  if (script.key_protected || script.use_key_system) {
    if (!keyValue) {
      await logExec(sql, script, robloxName, ip, null, hwid, false, 'No key provided');
      return res.status(403).json({ s: null, e: 'No key provided.' });
    }

    const [scriptKey] = await sql`
      SELECT id, key_value, hwid, hwid_locked, active, expires_at
      FROM script_keys
      WHERE script_id = ${script.id} AND key_value = ${keyValue} LIMIT 1
    `;

    if (!scriptKey || !scriptKey.active) {
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Invalid key');
      return res.status(403).json({ s: null, e: 'Invalid or disabled key.' });
    }

    if (scriptKey.expires_at && new Date(scriptKey.expires_at) < new Date()) {
      await sql`UPDATE script_keys SET active = false WHERE id = ${scriptKey.id}`;
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Key expired');
      return res.status(403).json({ s: null, e: 'Key has expired.' });
    }

    if (scriptKey.hwid_locked) {
      if (!scriptKey.hwid) {
        await sql`UPDATE script_keys SET hwid = ${hwid || null}, last_used = NOW() WHERE id = ${scriptKey.id}`;
      } else if (scriptKey.hwid !== hwid) {
        await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'HWID mismatch');
        return res.status(403).json({ s: null, e: 'HWID mismatch. Key is locked to another device.' });
      } else {
        await sql`UPDATE script_keys SET last_used = NOW() WHERE id = ${scriptKey.id}`;
      }
    } else {
      await sql`UPDATE script_keys SET last_used = NOW() WHERE id = ${scriptKey.id}`;
    }

    keyUsed = keyValue;
  }

  await logExec(sql, script, robloxName, ip, keyUsed, hwid, true, null);
  return res.status(200).json({ s: script.script_content });
}

async function logExec(sql, script, robloxName, ip, keyUsed, hwid, success, failReason) {
  try {
    await sql`
      INSERT INTO executions (script_id, user_id, roblox_name, ip_address, key_used, hwid, success, fail_reason)
      VALUES (${script.id}, ${script.user_id}, ${robloxName || 'Unknown'}, ${ip}, ${keyUsed}, ${hwid || null}, ${success}, ${failReason || null})
    `;
  } catch (_) {}
}
