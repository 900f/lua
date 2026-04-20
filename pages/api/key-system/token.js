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
  
  // Get loaderKey from URL query param
  let loaderKey = req.query.key || req.body?.key;
  
  // CLEAN THE LOADER KEY - remove anything after ? or &
  if (loaderKey) {
    // Split on ? and take the first part only
    loaderKey = loaderKey.split('?')[0];
    // Also clean any other URL encoded parts
    loaderKey = loaderKey.split('&')[0];
    // Only keep hex characters (32 chars)
    loaderKey = loaderKey.match(/[a-f0-9]{32}/)?.[0] || loaderKey;
  }
  
  let robloxName = req.query.n || req.body?.n;
  let hwid = req.query.h || req.body?.h;
  
  // Also try to extract from the corrupted query string
  if (!robloxName && req.query.key) {
    const match = req.query.key.match(/n":"([^"]+)/);
    if (match) robloxName = match[1];
  }
  if (!hwid && req.query.key) {
    const match = req.query.key.match(/h":"([^"]+)/);
    if (match) hwid = match[1];
  }
  
  console.log('📡 Cleaned loaderKey:', loaderKey);
  console.log('📡 Roblox name:', robloxName);
  console.log('📡 HWID:', hwid);
  
  if (!loaderKey) {
    return res.status(400).json({ error: 'Missing key parameter' });
  }
  
  const sql = getDb();
  const [script] = await sql`SELECT id FROM scripts WHERE loader_key=${loaderKey} AND use_key_system=true AND active=true LIMIT 1`;
  
  if (!script) {
    console.log('❌ Script not found for loaderKey:', loaderKey);
    return res.status(404).json({ error: 'Script not found' });
  }
  
  const token = generateKeySystemToken();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  
  await sql`INSERT INTO key_system_tokens (script_id, token, roblox_name, hwid, ip_address) VALUES (${script.id}, ${token}, ${robloxName || 'Unknown'}, ${hwid || null}, ${ip})`;
  
  console.log('✅ Token created:', token);
  return res.json({ url: siteUrl + '/key/' + token });
}