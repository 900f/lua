import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../lib/auth';

export default function Landing({ loggedIn }) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo-text">Luvenn</div>
        <div className="landing-nav-links">
          {loggedIn
            ? <Link href="/dashboard" className="btn btn-primary btn-sm">Open Dashboard</Link>
            : <>
                <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
              </>
          }
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div style={{minWidth:0}}>
          <div className="hero-eyebrow">
            <ShieldIcon size={12} /> Enterprise-grade script protection
          </div>
          <h1 className="hero-title">
            Your scripts.<br />
            <span className="grad">Protected.</span><br />
            Delivered.
          </h1>
          <p className="hero-sub">
            Host, protect and distribute your Roblox Lua scripts.
            Server-side execution, HWID locking, key systems, IP banning, real-time logs.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-hero">Start for free</Link>
            <Link href="/login" className="btn btn-ghost btn-hero">Sign in</Link>
          </div>
          <div className="hero-stats">
            {[
              ['Server-Side', 'Script Execution'],
              ['0ms', 'Extra Latency'],
              ['100%', 'Source Hidden'],
              ['3 days', 'Log Retention'],
            ].map(([v, l]) => (
              <div key={l} style={{flexShrink:0}}>
                <div className="hero-stat-value">{v}</div>
                <div className="hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-img" style={{minWidth:0}}>
          <DashboardMockup />
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-title">Built for serious developers</h2>
          <p className="section-sub">
            Everything you need to protect, distribute and monitor your Roblox scripts.
          </p>
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

      {/* How it works */}
      <section style={{background:'var(--white)',padding:'80px 56px',boxSizing:'border-box',width:'100%'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div className="section-eyebrow">Process</div>
          <h2 className="section-title">Three steps. Full protection.</h2>
          <p className="section-sub">From upload to a secure loadstring in under a minute.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:32,marginTop:8}}>
            {[
              {n:'01',t:'Upload your script',d:'Paste your Lua into the dashboard. Stored server-side — never in the loader file. Nobody can extract it.'},
              {n:'02',t:'Configure protection',d:'Choose open, key lock, or built-in key system with tasks. Set HWID locks and key expiry dates per key.'},
              {n:'03',t:'Share the loadstring',d:'Copy a one-liner. Your script executes server-side — source code never sent to the user in readable form.'},
            ].map(s => (
              <div key={s.n} style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                <div style={{fontSize:40,fontWeight:900,color:'var(--accent-mid)',lineHeight:1,letterSpacing:-2,flexShrink:0}}>{s.n}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>{s.t}</div>
                  <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.65}}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to protect your scripts?</h2>
          <p className="cta-sub">Free to use. No credit card required. Set up in minutes.</p>
          <div className="cta-actions">
            <Link href="/register" className="btn btn-primary btn-hero">Create free account</Link>
            <Link href="/login" className="btn btn-ghost btn-hero">Sign in</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-copy">Luvenn &copy; {new Date().getFullYear()}. All rights reserved.</div>
        <div style={{fontSize:12,color:'var(--text3)'}}>Secure Roblox script hosting</div>
      </footer>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{padding:20,background:'var(--bg)',width:'100%',boxSizing:'border-box'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        {[['SCRIPTS','14',''],['EXEC TODAY','183','accent'],['ACTIVE KEYS','67',''],['SUCCESS RATE','98%','accent']].map(([l,v,a])=>(
          <div key={l} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',minWidth:0}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:'.08em',color:'var(--text3)',marginBottom:7,textTransform:'uppercase'}}>{l}</div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:'-.5px',...(a?{background:'linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),.6))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}:{color:'var(--text)'})}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',fontSize:9.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>Recent Executions</div>
        {[['PlayerOne','203.0.113.1',true],['DevKing99','198.51.100.5',true],['xHacker','192.0.2.8',false]].map(([n,ip,ok])=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderBottom:'1px solid var(--border)',fontSize:11.5,minWidth:0}}>
            <span style={{flex:1,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n}</span>
            <span style={{color:'var(--text3)',fontFamily:'monospace',fontSize:10,flexShrink:0}}>{ip}</span>
            <span style={{padding:'2px 7px',borderRadius:99,fontSize:10,fontWeight:700,flexShrink:0,...(ok?{background:'var(--green-bg)',color:'var(--green)'}:{background:'var(--red-bg)',color:'var(--red)'})}}>
              {ok?'OK':'Fail'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {icon:<ShieldIcon/>,title:'Server-Side Execution',desc:'Your Lua source never leaves the server. Only the authenticated, validated client receives it — executed immediately in memory.'},
  {icon:<KeyIcon/>,title:'Built-in Key System',desc:'Users complete tasks (subscribe, join Discord) to receive a key automatically. Configurable per script with full control.'},
  {icon:<LockIcon/>,title:'HWID Device Locking',desc:'Keys bind to the first device hardware ID that uses them. Sharing blocked. Reset HWID from dashboard anytime.'},
  {icon:<ActivityIcon/>,title:'Execution Logging',desc:'Every run logged: Roblox username, IP, key, HWID and timestamp. Auto-deleted after 3 days.'},
  {icon:<BanIcon/>,title:'IP Banning',desc:'Block any IP from all your scripts instantly. One click in the execution log or IP Bans tab.'},
  {icon:<ClockIcon/>,title:'Expiring Keys',desc:'Day, week, month, or lifetime. Keys auto-disable on expiry — no manual cleanup.'},
];

function ShieldIcon({size=18}){return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}
function KeyIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>;}
function LockIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;}
function ActivityIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;}
function BanIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;}
function ClockIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  return { props: { loggedIn: !!user } };
}
