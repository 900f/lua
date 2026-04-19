import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (!r.ok) return setError(d.error);
    router.push('/dashboard');
  }
  return (
    <div className="auth-page">
      <div className="auth-bg-circle" style={{width:400,height:400,background:'var(--accent)',top:-100,right:-100}} />
      <div className="auth-bg-circle" style={{width:300,height:300,background:'var(--accent)',bottom:-80,left:-80}} />
      <div className="auth-card">
        <div className="auth-logo">Luvenn</div>
        <div className="auth-tagline">Sign in to your account</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required /></div>
          <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" autoComplete="current-password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required /></div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:4,padding:12}} disabled={loading}>
            {loading?<span className="spinner" style={{width:16,height:16}}/>:'Sign In'}
          </button>
        </form>
        <div className="auth-switch">No account? <Link href="/register">Create one</Link></div>
        <div style={{textAlign:'center',marginTop:14}}><Link href="/" style={{fontSize:12,color:'var(--text3)'}}>Back to home</Link></div>
      </div>
    </div>
  );
}
export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  if (token && verifyToken(token)) return { redirect:{ destination:'/dashboard', permanent:false } };
  return { props:{} };
}
