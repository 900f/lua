import { getDb } from '@/lib/db';
import { buildLoaderScript } from '@/lib/obfuscate';
import { rateLimit } from '@/lib/ratelimit';
import { getIp } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const ip = getIp(req);
  const rl = rateLimit('lg:'+ip, 20, 10000);
  if (!rl.allowed) { res.setHeader('Content-Type','text/plain'); return res.status(429).send('-- Rate limited.'); }

  let { loaderKey } = req.query;
  if (Array.isArray(loaderKey)) loaderKey = loaderKey[0];
  loaderKey = loaderKey.replace(/\.lua$/i, '');

  const sql = getDb();
  const [script] = await sql`SELECT id,loader_key,key_protected,use_key_system,active FROM scripts WHERE loader_key=${loaderKey} LIMIT 1`;

  if (!script || !script.active) {
    // Return fake garbage so bots/browsers see nothing useful
    const fake = Array.from({length:80},()=>Math.random().toString(36)[2]).join('');
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.setHeader('Cache-Control','no-store,no-cache,must-revalidate');
    res.setHeader('X-Robots-Tag','noindex');
    return res.status(200).send('--'+fake);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL||'https://luvenn.xyz';
  const lua = buildLoaderScript(script.loader_key, siteUrl, script.key_protected, script.use_key_system);

  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','no-store,no-cache,must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex,nofollow');
  // Prevent browsers from rendering nicely - force download behavior hint
  res.setHeader('Content-Disposition','attachment; filename="loader.lua"');
  return res.status(200).send(lua);
}
