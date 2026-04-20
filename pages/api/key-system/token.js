import { getDb } from '@/lib/db';
import { getIp } from '@/lib/auth';
import { generateKeySystemToken } from '@/lib/obfuscate';
import { rateLimit } from '@/lib/ratelimit';

export default async function handler(req, res) {
  // Accept both POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const ip = getIp(req);
  const rl = rateLimit('kst:'+ip, 10, 10000);
  if (!rl.allowed) return res.status(429).json({ error: 'Rate limited.' });
  
  // Get params from body (POST) or query (GET)
  let loaderKey, robloxName, hwid;
  
  if (req.method === 'POST') {
    loaderKey = req.body?.key || req.body?.loaderKey;
    robloxName = req.body?.n || req.body?.robloxName;
    hwid = req.body?.h || req.body?.hwid;
  } else {
    loaderKey = req.query.key || req.query.loaderKey;
    robloxName = req.query.n || req.query.robloxName;
    hwid = req.query.h || req.query.hwid;
  }
  
  if (!loaderKey) {
    return res.status(400).json({ error: 'Missing key parameter' });
  }
  
  const sql = getDb();
  const [script] = await sql`SELECT id FROM scripts WHERE loader_key=${loaderKey} AND use_key_system=true AND active=true LIMIT 1`;
  if (!script) return res.status(404).json({ error: 'Script not found' });
  
  const token = generateKeySystemToken();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  await sql`INSERT INTO key_system_tokens (script_id, token, roblox_name, hwid, ip_address) VALUES (${script.id}, ${token}, ${robloxName || 'Unknown'}, ${hwid || null}, ${ip})`;
  
  return res.json({ url: siteUrl + '/key/' + token });
}