require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function init() {
  const sql = neon(process.env.DATABASE_URL);
  console.log('Initializing Luvenn database...');

  await sql`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'violet',
    dark_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    script_content TEXT NOT NULL,
    loader_key TEXT UNIQUE NOT NULL,
    key_protected BOOLEAN DEFAULT FALSE,
    use_key_system BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS script_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_value TEXT UNIQUE NOT NULL,
    hwid TEXT DEFAULT NULL,
    hwid_locked BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    note TEXT DEFAULT '',
    duration TEXT DEFAULT 'lifetime',
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ DEFAULT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS key_system_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    roblox_name TEXT,
    hwid TEXT,
    ip_address TEXT,
    completed BOOLEAN DEFAULT FALSE,
    key_value TEXT DEFAULT NULL,
    tasks_completed JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
  )`;

  await sql`CREATE TABLE IF NOT EXISTS key_system_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL DEFAULT 'link',
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
  )`;

  await sql`CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roblox_name TEXT DEFAULT 'Unknown',
    ip_address TEXT DEFAULT '',
    key_used TEXT DEFAULT NULL,
    hwid TEXT DEFAULT NULL,
    success BOOLEAN DEFAULT TRUE,
    fail_reason TEXT DEFAULT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS ip_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    reason TEXT DEFAULT '',
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ip_address)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] DEFAULT '{execution,key_used}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // Indexes
  const indexes = [
    sql`CREATE INDEX IF NOT EXISTS idx_scripts_user ON scripts(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_scripts_loader ON scripts(loader_key)`,
    sql`CREATE INDEX IF NOT EXISTS idx_executions_script ON executions(script_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_executions_user ON executions(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_executions_ip ON executions(ip_address)`,
    sql`CREATE INDEX IF NOT EXISTS idx_keys_script ON script_keys(script_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_keys_value ON script_keys(key_value)`,
    sql`CREATE INDEX IF NOT EXISTS idx_ipbans ON ip_bans(user_id, ip_address)`,
    sql`CREATE INDEX IF NOT EXISTS idx_ks_tokens ON key_system_tokens(token)`,
  ];
  await Promise.all(indexes);

  console.log('✅ Database ready!');
  process.exit(0);
}
init().catch(e => { console.error('❌', e.message); process.exit(1); });
