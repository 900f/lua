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
  // Accept both POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).end();
  }

  const ip = getIp(req);
  const rl = rateLimit('exec:'+ip, 10, 10000);
  if (!rl.allowed) return res.status(429).json({ s: null, e: 'Rate limited.' });

  const { loaderKey } = req.query;
  
  // Get parameters from either body (POST) or query (GET)
  let keyValue, robloxName, hwid;
  
  if (req.method === 'POST') {
    keyValue = req.body?.k;
    robloxName = req.body?.n;
    hwid = req.body?.h;
  } else {
    keyValue = req.query.k;
    robloxName = req.query.n;
    hwid = req.query.h;
  }
  
  // Clean the key value if it has extra data appended (like the executor does)
  if (keyValue && keyValue.includes('?')) {
    keyValue = keyValue.split('?')[0];
  }

  const sql = getDb();
  const [script] = await sql`
    SELECT id, user_id, script_content, key_protected, use_key_system, active
    FROM scripts WHERE loader_key = ${loaderKey} LIMIT 1
  `;
  
  if (!script || !script.active) {
    await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Script not found');
    return res.status(403).json({ s: null, e: 'Script not found or disabled.' });
  }

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

    // AUTO-MIGRATION: Convert old keys to HWID locked + 1 day expiry
    let needsMigration = false;
    if (!sk.hwid_locked) {
      sk.hwid_locked = true;
      needsMigration = true;
    }
    if (!sk.expires_at) {
      sk.expires_at = new Date(Date.now() + 86400000); // 1 day from now
      needsMigration = true;
    }
    if (needsMigration) {
      await sql`
        UPDATE script_keys 
        SET hwid_locked = true, expires_at = ${sk.expires_at}
        WHERE id = ${sk.id}
      `;
      console.log('🔧 Auto-migrated key:', sk.id);
    }

    if (sk.expires_at && new Date(sk.expires_at) < new Date()) {
      await sql`UPDATE script_keys SET active = false WHERE id = ${sk.id}`;
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Key expired');
      return res.status(403).json({ s: null, e: 'Key has expired.' });
    }

    if (sk.hwid_locked) {
      if (!sk.hwid) {
        await sql`UPDATE script_keys SET hwid = ${hwid||null}, last_used = NOW() WHERE id = ${sk.id}`;
        console.log('🔒 First use - bound HWID:', hwid);
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

  return res.status(200).json({ s: script.script_content });
}