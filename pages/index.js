import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../lib/auth';

export default function Landing({ loggedIn }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo">Luvenn</div>
        <div className="landing-nav-links">
          {loggedIn
            ? <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
            : <><Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link><Link href="/register" className="btn btn-primary btn-sm">Get started</Link></>
          }
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="hero-eyebrow"><Shield size={12} />Secure Script Hosting</div>
          <h1 className="hero-title">Your scripts.<br /><span>Protected.</span><br />Delivered.</h1>
          <p className="hero-sub">Host, protect and distribute your Roblox Lua scripts with military-grade key protection, HWID locking, IP logging and a built-in key system. Source code never exposed.</p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-hero">Start for free</Link>
            <Link href="/login" className="btn btn-ghost btn-hero">Sign in</Link>
          </div>
        </div>
        <div className="hero-img"><Mockup /></div>
      </section>

      <section className="features-section">
        <div className="features-inner">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-title">Built for serious developers</h2>
          <p className="section-sub">Everything you need to distribute scripts safely, track usage and prevent theft.</p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'88px 52px',maxWidth:1200,margin:'0 auto'}}>
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-title">Three steps to full protection</h2>
        <p className="section-sub">From upload to protected loadstring in under a minute.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:32,marginTop:8}}>
          {[{n:'01',t:'Upload your script',d:'Paste your Lua. Stored server-side only — never in the loader file. Nobody can extract it.'},{n:'02',t:'Configure protection',d:'Choose open, key-protected, or built-in key system. Set HWID locks and expiry dates.'},{n:'03',t:'Share the loadstring',d:'Copy a tiny one-liner. Users run it, your script executes. Source stays secret, always.'}].map(s=>(
            <div key={s.n} style={{display:'flex',gap:18,alignItems:'flex-start'}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{s.n}</div>
              <div><div style={{fontWeight:700,marginBottom:8,fontSize:15}}>{s.t}</div><div style={{fontSize:13,color:'var(--text2)',lineHeight:1.65}}>{s.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to protect your work?</h2>
          <p className="cta-sub">Free to use. No credit card required. Set up in minutes.</p>
          <Link href="/register" className="btn btn-primary btn-hero">Create free account</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-copy">Luvenn &copy; {new Date().getFullYear()}. All rights reserved.</div>
        <div style={{fontSize:12.5,color:'var(--text3)'}}>Secure Roblox script hosting</div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {icon:<Shield/>,title:'Script Protection',desc:'Your Lua code is stored server-side only. The loader is an XOR-obfuscated stub — the real URL and keys are never readable.'},
  {icon:<Key/>,title:'Key System',desc:'Users complete tasks (subscribe on YouTube, join Discord) to get a key automatically. Fully configurable per script.'},
  {icon:<Lock/>,title:'HWID Locking',desc:'Keys bind to the first device that uses them. No sharing. Reset HWID anytime from your dashboard.'},
  {icon:<Activity/>,title:'Execution Logs',desc:'Every run logged with Roblox username, IP, key, HWID and timestamp. Auto-deleted after 3 days.'},
  {icon:<Ban/>,title:'IP Banning',desc:'Instantly block any IP from all your scripts. One entry — universal coverage across every script you own.'},
  {icon:<Clock/>,title:'Key Expiry',desc:'Day, week, month, or lifetime keys. Perfect for subscription models or limited access promotions.'},
];

function Mockup() {
  return (
    <div style={{padding:24,background:'var(--bg)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        {[['SCRIPTS','14',''],['EXECUTIONS','2,481','accent'],['ACTIVE KEYS','67',''],['TODAY','183','accent']].map(([l,v,a])=>(
          <div key={l} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:'.08em',color:'var(--text3)',marginBottom:7,textTransform:'uppercase'}}>{l}</div>
            <div style={{fontSize:24,fontWeight:800,color:a?'var(--accent)':'var(--text)',letterSpacing:'-.5px'}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
        <div style={{fontSize:9.5,fontWeight:700,color:'var(--text3)',marginBottom:12,textTransform:'uppercase',letterSpacing:'.08em'}}>Recent Executions</div>
        {[['PlayerOne','203.0.113.1','OK'],['DevKing99','198.51.100.5','OK'],['xHacker','192.0.2.8','Fail']].map(([n,ip,s])=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:11.5}}>
            <span style={{flex:1,fontWeight:600}}>{n}</span>
            <span style={{color:'var(--text3)',fontFamily:'monospace',fontSize:10.5}}>{ip}</span>
            <span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:700,background:s==='OK'?'#f0fdf4':'#fff0f0',color:s==='OK'?'#15803d':'#dc2626'}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Shield({size=18}){return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}
function Key(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>;}
function Lock(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;}
function Activity(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;}
function Ban(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;}
function Clock(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  return { props: { loggedIn: !!user } };
}
