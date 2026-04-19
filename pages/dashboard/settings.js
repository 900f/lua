import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

const THEMES = [
  {id:'violet',label:'Violet',color:'#7c3aed'},
  {id:'pink',  label:'Pink',  color:'#db2777'},
  {id:'blue',  label:'Blue',  color:'#2563eb'},
  {id:'green', label:'Green', color:'#059669'},
  {id:'orange',label:'Orange',color:'#ea580c'},
];

export default function Settings({ user }) {
  const { toasts, toast } = useToast();
  const [theme, setTheme] = useState('violet');
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
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

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts}/>
      <div className="page-header">
        <div><div className="page-title">Settings</div><div className="page-sub">Customize your dashboard</div></div>
      </div>

      <div className="card card-pad" style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Appearance</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Theme color and display mode</div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22,padding:'14px 16px',background:'var(--bg2)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
          <div><div style={{fontWeight:600,fontSize:13}}>Dark Mode</div><div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>Switch to dark background</div></div>
          <button onClick={toggleDark} className="toggle-track" style={{background:darkMode?'var(--accent)':'var(--border2)'}}>
            <span className="toggle-thumb" style={{left:darkMode?24:4}}/>
          </button>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:14,textTransform:'uppercase',letterSpacing:'.06em'}}>Accent Color</div>
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          {THEMES.map(t=>(
            <button key={t.id} onClick={()=>pickTheme(t.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',padding:0}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:t.color,outline:theme===t.id?'2.5px solid var(--text)':'2.5px solid transparent',outlineOffset:2,transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {theme===t.id&&<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{fontSize:11,fontWeight:theme===t.id?700:400,color:theme===t.id?'var(--accent)':'var(--text3)'}}>{t.label}</span>
            </button>
          ))}
        </div>
        {saving&&<div style={{marginTop:14,fontSize:12,color:'var(--text3)'}}>Saving…</div>}
      </div>

      <div className="card card-pad" style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Account</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>Your account information</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {[['Username',user.username],['Email',user.email]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:10.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>{l}</div><div style={{fontSize:14,fontWeight:600}}>{v}</div></div>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Loadstring Format</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:14}}>Use these patterns for your scripts</div>
        <div style={{position:'relative'}}>
          <pre className="code-block">{`-- Open access
loadstring(game:HttpGet("${siteUrl}/api/loader/[32charkey].lua",true))()

-- Key protected
script_key = "your40charkey"
loadstring(game:HttpGet("${siteUrl}/api/loader/[32charkey].lua",true))()

-- Built-in key system (menu appears in-game automatically)
loadstring(game:HttpGet("${siteUrl}/api/loader/[32charkey].lua",true))()`}</pre>
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
