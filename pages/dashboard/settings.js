import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

const THEMES = [
  { id: 'pink', label: 'Pink', color: '#e0529a' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'green', label: 'Green', color: '#059669' },
  { id: 'orange', label: 'Orange', color: '#ea580c' },
];

export default function Settings({ user }) {
  const { toasts, toast } = useToast();
  const [theme, setTheme] = useState('pink');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.theme) {
        setTheme(d.theme);
        applyTheme(d.theme);
      }
    });
  }, []);

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('lv_theme', t);
  }

  async function saveTheme(t) {
    setTheme(t);
    applyTheme(t);
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    });
    setSaving(false);
    toast('Theme saved!', 'info');
  }

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage your account and dashboard preferences</div>
        </div>
      </div>

      {/* Theme */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Dashboard Theme</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Choose an accent color for your dashboard</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => saveTheme(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: t.color,
                border: theme === t.id ? `3px solid ${t.color}` : '3px solid transparent',
                outline: theme === t.id ? `2px solid var(--text)` : '2px solid transparent',
                outlineOffset: 2, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {theme === t.id && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: theme === t.id ? 700 : 400, color: theme === t.id ? 'var(--accent)' : 'var(--text2)' }}>{t.label}</span>
            </button>
          ))}
        </div>
        {saving && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>Saving…</div>}
      </div>

      {/* Account info */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Account</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>Your account details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Username</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Email</div>
            <div style={{ fontSize: 14 }}>{user.email}</div>
          </div>
        </div>
      </div>

      {/* API info */}
      <div className="card card-pad">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Loader URL Format</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>Your script loadstrings follow this pattern</div>
        <pre className="code-block" style={{ fontSize: 11 }}>
{`-- Open script (no key required)
loadstring(game:HttpGet("https://yoursite.vercel.app/api/loader/[32-char-key].lua", true))()

-- Key protected script
script_key = "your40charalphanumerickey"
loadstring(game:HttpGet("https://yoursite.vercel.app/api/loader/[32-char-key].lua", true))()

-- Built-in key system (no script_key needed - UI appears in-game)
loadstring(game:HttpGet("https://yoursite.vercel.app/api/loader/[32-char-key].lua", true))()`}
        </pre>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: { id: user.id, email: user.email, username: user.username } } };
}
