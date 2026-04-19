import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../lib/auth';

export default function Landing({ loggedIn }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo-text">Luvenn</div>
        <div className="landing-nav-links">
          {loggedIn
            ? <Link href="/dashboard" className="btn btn-primary btn-sm">Open Dashboard</Link>
            : <>
                <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Get started free</Link>
              </>
          }
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div style={{position:'absolute',top:-100,right:-200,width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div>
          <div className="hero-eyebrow"><ShieldIcon size={12}/>Enterprise-grade script protection</div>
          <h1 className="hero-title">
            Your scripts.<br />
            <span className="grad">Protected.</span><br />
            Delivered.
          </h1>
          <p className="hero-sub">
            Host, protect and distribute your Roblox Lua scripts with military-grade protection.
            XOR-obfuscated loaders, HWID locking, key systems, IP banning, and real-time execution logging.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-hero">Start for free</Link>
            <Link href="/login" className="btn btn-ghost btn-hero" style={{background:'rgba(124,58,237,.06)'}}>Sign in</Link>
          </div>
          <div className="hero-stats">
            {[['Obfuscated','Loader URLs'],['0ms','Extra Latency'],['100%','Source Hidden'],['3 days','Log Retention']].map(([v,l])=>(
              <div key={l}>
                <div className="hero-stat-value">{v}</div>
                <div className="hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-img"><DashboardMockup /></div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-eyebrow">What you get</div>
          <h2 className="section-title">Built for serious developers</h2>
          <p className="section-sub">Everything you need to protect, distribute and monitor your Roblox scripts — in one place.</p>
          <div className="features-grid">
            {FEATURES.map(f=>(
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
      <section style={{padding:'96px 56px',background:'var(--white)'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div className="section-eyebrow">Process</div>
          <h2 className="section-title">Three steps. Full protection.</h2>
          <p className="section-sub">From upload to a secure loadstring in under a minute.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:40,marginTop:8}}>
            {[
              {n:'01',t:'Upload your script',d:'Paste your Lua into the dashboard. It is stored server-side only — never in the loader. No one can extract it.'},
              {n:'02',t:'Configure protection',d:'Choose open access, key lock, or built-in key system with task completion. Set HWID locks and key expiry.'},
              {n:'03',t:'Share the loadstring',d:'Copy a tiny one-liner. The loader is XOR-encoded — the real endpoint is invisible. Source code stays secret, always.'},
            ].map(s=>(
              <div key={s.n}>
                <div style={{fontSize:48,fontWeight:900,color:'var(--accent-mid)',lineHeight:1,marginBottom:16,letterSpacing:-2}}>{s.n}</div>
                <div style={{fontWeight:700,fontSize:16,marginBottom:10,letterSpacing:'-.3px'}}>{s.t}</div>
                <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.7}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security section */}
      <section style={{background:'var(--bg)',padding:'96px 56px'}}>
        <div style={{maxWidth:1240,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
          <div>
            <div className="section-eyebrow">Security</div>
            <h2 className="section-title">Layers of protection</h2>
            <p style={{fontSize:15,color:'var(--text2)',lineHeight:1.75,marginBottom:24}}>
              Luvenn uses multiple independent security layers so even if one is bypassed, the others hold.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                ['XOR-Encoded Loaders','Real URLs and keys are hidden in the loader with XOR encoding — not readable in plain text'],
                ['Server-Side Execution','Script source never leaves the server. Only the executing client receives it, decrypted in memory'],
                ['HWID Binding','Keys bind to the first device's hardware ID. Sharing a key gets the second user blocked'],
                ['IP Banning','Instant IP-level blocks across all scripts. One ban, universal effect'],
                ['Rate Limiting','Every endpoint rate-limited per IP. Brute force and DDoS mitigated automatically'],
                ['Execution Logging','Full audit trail: IP, player name, key, HWID, timestamp on every execution'],
              ].map(([t,d])=>(
                <div key={t} style={{display:'flex',gap:14,padding:'14px 16px',background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:6}}/>
                  <div><div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{t}</div><div style={{fontSize:12.5,color:'var(--text2)',lineHeight:1.6}}>{d}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-md)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>Loader File (what users see)</div>
            <pre style={{fontFamily:'var(--mono)',fontSize:11.5,color:'var(--text2)',lineHeight:1.9,background:'var(--bg2)',padding:16,borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',overflow:'hidden'}}>
{`--// Luvenn Protected Script //--
local _k=string.char(97,98,99,100,...)
local function _d(h)
  local r=""
  -- XOR decode: endpoint hidden
  ...
end
local _base=_d("6d756f79...") -- encoded
local _ep=_d("2f6170692f...") -- encoded
local HS=game:GetService("HttpService")
local function _post(path,body)
  -- HttpService:RequestAsync
  ...
end
-- Script content fetched at runtime
-- Source code never in this file`}
            </pre>
            <div style={{marginTop:14,padding:'10px 14px',background:'var(--green-bg)',border:'1px solid var(--green-border)',borderRadius:'var(--radius-sm)',fontSize:12.5,color:'var(--green)',fontWeight:500}}>
              Real endpoint URL is XOR-encoded and not readable
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to protect your scripts?</h2>
          <p className="cta-sub">Free to use. No credit card required. Set up in under 5 minutes.</p>
          <div className="cta-actions">
            <Link href="/register" className="btn btn-primary btn-hero">Create free account</Link>
            <Link href="/login" className="btn btn-ghost btn-hero">Sign in</Link>
          </div>
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
  {icon:<ShieldIcon/>,title:'XOR-Obfuscated Loaders',desc:'The loader .lua file contains no readable URLs or keys — everything is XOR-encoded. Even reading the source reveals nothing.'},
  {icon:<KeyIcon/>,title:'Built-in Key System',desc:'Users complete tasks (subscribe, join Discord) to receive a key automatically. Tasks redirect for 15 seconds then complete — no real verification needed.'},
  {icon:<LockIcon/>,title:'HWID Device Locking',desc:'Keys bind to the first hardware ID that uses them. Sharing is blocked. Reset HWID from your dashboard any time.'},
  {icon:<ActivityIcon/>,title:'Execution Logging',desc:'Every run logged with Roblox username, IP address, key used, HWID and timestamp. Logs auto-purge after 3 days.'},
  {icon:<BanIcon/>,title:'IP Banning',desc:'Instantly block any IP from executing all your scripts at once. One click in the execution log or IP bans tab.'},
  {icon:<ClockIcon/>,title:'Expiring Keys',desc:'Set keys to expire after 1 day, week, month, or never. Keys auto-disable on expiry — no manual cleanup needed.'},
  {icon:<ChartIcon/>,title:'Analytics Dashboard',desc:'Top scripts, top players, success rates and bar charts. See exactly who is using your scripts and how often.'},
  {icon:<WebhookIcon/>,title:'Webhooks',desc:'POST notifications to your server on executions, key usage, bans and more. Integrate with Discord, your backend, or anything.'},
];

function DashboardMockup() {
  return (
    <div style={{padding:22,background:'var(--bg)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        {[['SCRIPTS','14',''],['EXEC TODAY','183','accent'],['ACTIVE KEYS','67',''],['SUCCESS RATE','98%','accent']].map(([l,v,a])=>(
          <div key={l} style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:'.09em',color:'var(--text3)',marginBottom:8,textTransform:'uppercase'}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:'-.5px',...(a?{background:'linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),.6))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}:{color:'var(--text)'})}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',fontSize:9.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.09em'}}>Recent Executions</div>
        {[['PlayerOne','203.0.113.1',true],['DevKing99','198.51.100.5',true],['xHacker','192.0.2.8',false]].map(([n,ip,ok])=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)',fontSize:11.5}}>
            <span style={{flex:1,fontWeight:600}}>{n}</span>
            <span style={{color:'var(--text3)',fontFamily:'monospace',fontSize:10.5}}>{ip}</span>
            <span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:700,...(ok?{background:'var(--green-bg)',color:'var(--green)'}:{background:'var(--red-bg)',color:'var(--red)'})}}>
              {ok?'OK':'Fail'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShieldIcon({size=18}){return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}
function KeyIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>;}
function LockIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;}
function ActivityIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;}
function BanIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;}
function ClockIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}
function ChartIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;}
function WebhookIcon(){return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 012 17c.01-.7.2-1.4.57-2"/><path d="M6 17l3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 116.89-4.06"/><path d="M12 6a4 4 0 014 4c0 .67-.16 1.3-.44 1.86L19 17"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  return { props: { loggedIn: !!user } };
}
