import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../lib/auth';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const r = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) return setError(d.error);
    router.push('/dashboard');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><LogoIcon />LuaVault</div>
        <div className="auth-tagline">Create your free account</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" autoComplete="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" placeholder="yourname" autoComplete="username"
              value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 8 characters" autoComplete="new-password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Account'}
          </button>
        </form>
        <div className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text3)' }}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function LogoIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>; }

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  if (token && verifyToken(token)) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
}
