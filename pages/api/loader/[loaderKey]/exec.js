import { getDb } from '@/lib/db';
import { getIp } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

// Encode the script content so it's not raw in the JSON response.
// Simple reversible encoding: base64-like using charcode shifting.
// The Roblox loader decodes before loadstring — adds one more layer.
function encodeScript(script) {
  // XOR with a rotating key, then base64 encode
  const key = [0x4c, 0x75, 0x76, 0x65, 0x6e, 0x6e]; // "Luvenn"
  const bytes = Buffer.from(script, 'utf8');
  const enc = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    enc[i] = bytes[i] ^ key[i % key.length];
  }
  return enc.toString('base64');
}

// The decoding Lua snippet injected into every loader response
// so loadstring runs on decoded content, not the encoded blob
const DECODE_PREFIX = `local _luvdec=function(b)
  local k={76,117,118,101,110,110}
  local dec=game:GetService("HttpService"):JSONDecode('["'..b:gsub(".",function(c)return c end)..'"]')
  local r=""
  local i=0
  local bb=table.pack(string.byte(dec[1],1,-1))
  for j=1,#bb do r=r..string.char(bit32.bxor(bb[j],k[(j-1)%6+1]))end
  return r
end\n`;

async function logExec(sql, script, robloxName, ip, keyUsed, hwid, success, failReason) {
  try {
    await sql`INSERT INTO executions (script_id,user_id,roblox_name,ip_address,key_used,hwid,success,fail_reason)
      VALUES (${script.id},${script.user_id},${robloxName||'Unknown'},${ip},${keyUsed||null},${hwid||null},${success},${failReason||null})`;
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
  const [script] = await sql`SELECT id,user_id,script_content,key_protected,use_key_system,active FROM scripts WHERE loader_key=${loaderKey} LIMIT 1`;
  if (!script || !script.active) return res.status(403).json({ s: null, e: 'Script not found or disabled.' });

  // IP ban check
  const [banned] = await sql`SELECT id FROM ip_bans WHERE user_id=${script.user_id} AND ip_address=${ip} LIMIT 1`;
  if (banned) {
    await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'IP banned');
    return res.status(403).json({ s: null, e: 'Access denied.' });
  }

  let keyUsed = null;
  if (script.key_protected || script.use_key_system) {
    if (!keyValue) {
      await logExec(sql, script, robloxName, ip, null, hwid, false, 'No key');
      return res.status(403).json({ s: null, e: 'No key provided.' });
    }
    const [sk] = await sql`SELECT id,key_value,hwid,hwid_locked,active,expires_at FROM script_keys WHERE script_id=${script.id} AND key_value=${keyValue} LIMIT 1`;
    if (!sk || !sk.active) {
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Invalid key');
      return res.status(403).json({ s: null, e: 'Invalid or disabled key.' });
    }
    if (sk.expires_at && new Date(sk.expires_at) < new Date()) {
      await sql`UPDATE script_keys SET active=false WHERE id=${sk.id}`;
      await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'Key expired');
      return res.status(403).json({ s: null, e: 'Key has expired.' });
    }
    if (sk.hwid_locked) {
      if (!sk.hwid) {
        await sql`UPDATE script_keys SET hwid=${hwid||null},last_used=NOW() WHERE id=${sk.id}`;
      } else if (sk.hwid !== hwid) {
        await logExec(sql, script, robloxName, ip, keyValue, hwid, false, 'HWID mismatch');
        return res.status(403).json({ s: null, e: 'HWID mismatch.' });
      } else {
        await sql`UPDATE script_keys SET last_used=NOW() WHERE id=${sk.id}`;
      }
    } else {
      await sql`UPDATE script_keys SET last_used=NOW() WHERE id=${sk.id}`;
    }
    keyUsed = keyValue;
  }

  await logExec(sql, script, robloxName, ip, keyUsed, hwid, true, null);

  // Return encoded script - adds interception resistance
  // The actual Lua source is never sent raw in the response
  const encoded = encodeScript(script.script_content);

  // Send back a wrapper that decodes then executes
  // This means even if someone intercepts the HTTP response,
  // they get base64(XOR("Luvenn", source)) not the raw source
  const wrapper = `local _e="${encoded}"
local _k={76,117,118,101,110,110}
local _b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local function _un(s)
  local r,n,b={},0,0
  s=s:gsub("[^"..(_b64:gsub("([^%w])","%%%1").."+/=").."]","")
  for c in s:gmatch"." do
    local v=_b64:find(c,1,true)
    if v then v=v-1;n=n*64+v;b=b+6
      if b>=8 then b=b-8;r[#r+1]=math.floor(n/2^b)%256 end
    end
  end
  local out=""
  for _,v in ipairs(r) do out=out..string.char(v) end
  return out
end
local _raw=_un(_e)
local _dec=""
for i=1,#_raw do
  _dec=_dec..string.char(bit32.bxor(string.byte(_raw,i),_k[(i-1)%6+1]))
end
local fn,le=loadstring(_dec)
if not fn then error("[Luvenn] "..tostring(le),2) end
fn()`;

  return res.status(200).json({ s: wrapper });
}
