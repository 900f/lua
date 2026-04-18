# LuaVault — Roblox Script Hosting Platform

A secure Roblox script hosting platform with key protection, HWID locking, IP logging, and execution tracking.

---

## Features

- 🔐 **Secure Auth** — bcrypt passwords, JWT sessions, SQL injection protection via parameterized queries
- 📜 **Script Hosting** — Upload Lua scripts; users get a loadstring that never exposes actual code
- 🔑 **Key System** — Generate license keys with optional HWID locking
- 📊 **Execution Logs** — Every execution logs IP address, Roblox username, key used, and HWID
- 🛡️ **Script Protection** — Actual script content is server-side only; the .lua loader just fetches it at runtime
- 🎨 **Clean UI** — Light pink/white dashboard with a sidebar layout

---

## Quick Start (Local)

### 1. Prerequisites
- Node.js 18+
- A free [Neon](https://neon.tech) PostgreSQL database

### 2. Clone and install
```bash
cd luavault
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
JWT_SECRET=your-random-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Get your Neon connection string:**
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from the dashboard

**Generate a JWT secret:**
```bash
openssl rand -base64 32
```

### 4. Initialize the database
```bash
npm run db:init
```

### 5. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create luavault --private --push
```

### 2. Deploy
```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com)

### 3. Set environment variables in Vercel
Go to your project → Settings → Environment Variables and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | Your generated secret |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL e.g. `https://luavault.vercel.app` |

### 4. Initialize DB on Vercel
After setting env vars, run locally with production env:
```bash
DATABASE_URL="your-neon-url" node scripts/init-db.js
```

---

## How the Script Protection Works

1. You upload a script (e.g. 1000 lines of Lua)
2. LuaVault stores it **server-side only** in the database
3. You get a loadstring like:
   ```lua
   loadstring(game:HttpGet("https://yoursite.vercel.app/api/loader/abc123xyz.lua"))()
   ```
4. The `.lua` file is just a **tiny loader** — no script content inside
5. When a user executes it in Roblox:
   - The loader calls `/api/loader/[key]/exec` with their Roblox name (and key/HWID if required)
   - Server validates → logs the execution → returns the actual script
   - Script runs via `loadstring()` in memory, never saved to disk
6. If someone tries to `print(loadstring(...))` they get nothing useful — the loadstring just executes the loader code

### Key-protected scripts
```lua
script_key = "ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"
loadstring(game:HttpGet("https://yoursite.vercel.app/api/loader/abc123xyz.lua"))()
```

---

## Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | Stats: total scripts, keys, executions, today's activity |
| **Scripts** | Create, edit, enable/disable scripts. Get loadstring. |
| **Keys** | Generate keys, HWID lock, reset HWID, disable individual keys |
| **Executions** | Full log: Roblox name, IP, key used, HWID, timestamp, success/fail |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/scripts` | List your scripts |
| POST | `/api/scripts` | Create script |
| GET/PUT/DELETE | `/api/scripts/[id]` | Get/update/delete script |
| GET/POST | `/api/keys/[scriptId]` | List/generate keys |
| PATCH/DELETE | `/api/keys/action/[keyId]` | Toggle/reset/delete key |
| GET | `/api/executions/list` | Execution log |
| GET | `/api/executions/stats` | Dashboard stats |
| GET | `/api/loader/[key].lua` | Public loader file (safe) |
| POST | `/api/loader/[key]/exec` | Execute validation (called by Roblox) |

---

## Security Notes

- All DB queries use parameterized statements (no SQL injection possible)
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 7 days, stored as HttpOnly cookies
- Script content is never served in the `.lua` loader file
- All inputs are sanitized and length-limited server-side
- HWID binding prevents key sharing between devices
