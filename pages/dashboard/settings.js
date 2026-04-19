import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

const THEMES = [
  {id:'violet',label:'Violet',color:'#7c3aed'},
  {id:'pink',  label:'Pink',  color:'#be185d'},
  {id:'blue',  label:'Blue',  color:'#1d4ed8'},
  {id:'green', label:'Green', color:'#059669'},
  {id:'orange',label:'Orange',color:'#c2410c'},
];

export default function Settings({ user }) {
  const { toasts, toast } = useToast();
  const [theme, setTheme] = useState('violet');
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({current:'',new_password:'',confirm:''});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const siteUrl = typeof window!=='undefined'?window.location.origin:'https://yoursite.vercel.app';

  useEffect(() => {
    fetch('/api/settings').then(r=>r.json()).then(d=>{
      const t=d.theme||'violet';const dm=d.dark_mode||false;
      setTheme(t);setDarkMode(dm);apply(t,dm);
    }).catch(()=>{});
  }, []);

  function apply(t,dm) {
    document.documentElement.setAttribute('data-theme',t);
    if(dm)document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lv_theme',t);
    localStorage.setItem('lv_dark',String(dm));
  }

  async function save(t,dm) {
    setSaving(true);apply(t,dm);
    await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({theme:t,dark_mode:dm})}).catch(()=>{});
    setSaving(false);toast('Settings saved!','info');
  }

  function pickTheme(t){setTheme(t);save(t,darkMode);}
  function toggleDark(){const nd=!darkMode;setDarkMode(nd);save(theme,nd);}

  async function changePassword(e) {
    e.preventDefault();setPwError('');
    if(pwForm.new_password!==pwForm.confirm)return setPwError('Passwords do not match.');
    if(pwForm.new_password.length<8)return setPwError('New password must be at least 8 characters.');
    setPwLoading(true);
    const r=await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'change_password',current:pwForm.current,new_password:pwForm.new_password})});
    const d=await r.json();setPwLoading(false);
    if(!r.ok)return setPwError(d.error);
    setPwForm({current:'',new_password:'',confirm:''});
    toast('Password changed successfully!');
  }

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts}/>
      <div className="page-header">
        <div><div className="page-title">Settings</div><div className="page-sub">Customize your dashboard and manage your account</div></div>
      </div>

      {/* Appearance */}
      <div className="card card-pad" style={{marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:15,marginBottom:4,letterSpacing:'-.3px'}}>Appearance</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:22}}>Customize how Luvenn looks for you</div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,padding:'16px 18px',background:'var(--bg2)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
          <div>
            <div style={{fontWeight:700,fontSize:13}}>Dark Mode</div>
            <div style={{fontSize:12,color:'var(--text3)',marginTop:3}}>Switch the dashboard to dark background</div>
          </div>
          <button onClick={toggleDark} className={`dm-toggle${darkMode?' on':''}`}>
            <span className={`dm-thumb${darkMode?' right':' left'}`}/>
          </button>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:16,textTransform:'uppercase',letterSpacing:'.07em'}}>Accent Color</div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {THEMES.map(t=>(
            <button key={t.id} onClick={()=>pickTheme(t.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',padding:0}}>
              <div style={{
                width:42,height:42,borderRadius:'50%',
                background:`linear-gradient(135deg,${t.color},${t.color}99)`,
                outline:theme===t.id?`3px solid ${t.color}`:'3px solid transparent',
                outlineOffset:3,transition:'all .15s',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:theme===t.id?`0 4px 16px ${t.color}44`:'none',
              }}>
                {theme===t.id&&<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{fontSize:11.5,fontWeight:theme===t.id?700:400,color:theme===t.id?t.color:'var(--text3)'}}>{t.label}</span>
            </button>
          ))}
        </div>
        {saving&&<div style={{marginTop:16,fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:6}}><span className="spinner" style={{width:12,height:12}}/>Saving…</div>}
      </div>

      {/* Account */}
      <div className="card card-pad" style={{marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:15,marginBottom:4,letterSpacing:'-.3px'}}>Account</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Your profile information</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          {[['Username',user.username],['Email',user.email]].map(([l,v])=>(
            <div key={l} style={{padding:'14px 16px',background:'var(--bg2)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{l}</div>
              <div style={{fontSize:14,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card card-pad" style={{marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:15,marginBottom:4,letterSpacing:'-.3px'}}>Change Password</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Update your account password</div>
        {pwError&&<div className="alert alert-error">{pwError}</div>}
        <form onSubmit={changePassword} style={{maxWidth:400}}>
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" placeholder="••••••••" value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" placeholder="Min 8 characters" value={pwForm.new_password} onChange={e=>setPwForm(f=>({...f,new_password:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} required/></div>
          <button type="submit" className="btn btn-primary" disabled={pwLoading}>{pwLoading?<span className="spinner" style={{width:14,height:14}}/>:'Update Password'}</button>
        </form>
      </div>

      {/* Loadstring info */}
      <div className="card card-pad">
        <div style={{fontWeight:800,fontSize:15,marginBottom:4,letterSpacing:'-.3px'}}>Integration Reference</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Loadstring patterns for your scripts</div>
        <div style={{position:'relative'}}>
          <pre className="code-block">{`-- Open access (no key required)
loadstring(game:HttpGet("${siteUrl}/api/loader/[32charkey].lua",true))()

-- Key protected (user defines script_key first)
script_key = "your40charalphanumerickey"
loadstring(game:HttpGet("${siteUrl}/api/loader/[32charkey].lua",true))()

-- Built-in key system (in-game menu appears automatically)
loadstring(game:HttpGet("${siteUrl}/api/loader/[32charkey].lua",true))()`}</pre>
        </div>
        <div className="alert alert-info" style={{marginTop:14,fontSize:12}}>
          Loader keys are 32-character hex strings. Script keys are 40-character alphanumeric strings (no dashes).
          All URLs in loader files are XOR-encoded — not readable in plain text.
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
