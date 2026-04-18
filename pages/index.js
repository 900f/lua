import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../lib/auth';

export default function Landing({ loggedIn }) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <LogoIcon />Lua<span style={{ color: 'var(--text)' }}>Vault</span>
        </div>
        <div className="landing-nav-links">
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div>
          <div className="hero-badge">
            <ShieldIcon size={12} /> Secure Script Hosting
          </div>
          <h1 className="hero-title">
            Protect your<br /><span>Roblox scripts</span><br />like a pro
          </h1>
          <p className="hero-sub">
            Host, protect and monetize your Lua scripts with key protection, HWID locking, 
            IP logging and a built-in key system. Your code never leaves the server.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-hero">
              Start for free
            </Link>
            <Link href="/login" className="btn btn-ghost btn-hero">
              Sign in
            </Link>
          </div>
        </div>
        <div className="hero-img-wrap">
          <img src="/img/dashboard-preview.png" alt="LuaVault Dashboard" onError={e => { e.target.style.display = 'none'; }} />
          <DashboardMockup />
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-title">Everything you need to protect your scripts</h2>
          <p className="section-sub">Built for serious Roblox developers who want full control over their scripts.</p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><ShieldIcon /></div>
              <div className="feature-title">Script Protection</div>
              <div className="feature-desc">Your actual Lua code is never exposed. The loader is a tiny stub that fetches and executes your script securely at runtime.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><KeyIcon /></div>
              <div className="feature-title">Key System</div>
              <div className="feature-desc">Require users to complete tasks — join Discord, subscribe on YouTube — before receiving a key. Fully configurable per script.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><LockIcon /></div>
              <div className="feature-title">HWID Locking</div>
              <div className="feature-desc">Keys bind to the first device that uses them. No sharing. Reset HWID anytime from your dashboard with one click.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><ActivityIcon /></div>
              <div className="feature-title">Execution Logs</div>
              <div className="feature-desc">Every execution is logged with the Roblox username, IP address, key used, HWID and timestamp. Logs auto-delete after 3 days.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><BanIcon /></div>
              <div className="feature-title">IP Banning</div>
              <div className="feature-desc">Instantly ban any IP from executing your scripts. Bans apply across all your scripts with a single entry.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><ClockIcon /></div>
              <div className="feature-title">Key Expiry</div>
              <div className="feature-desc">Set keys to expire after 1 day, 1 week, 1 month or never. Perfect for subscription-based script access.</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-title">Simple for you. Invisible to users.</h2>
        <p className="section-sub">Three steps from upload to protected loadstring.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 8 }}>
          {[
            { n: '01', title: 'Upload your script', desc: 'Paste your Lua code into the dashboard. It gets stored encrypted server-side — never in the loader.' },
            { n: '02', title: 'Configure protection', desc: 'Choose open access, key-protected or built-in key system. Set HWID locking and key expiry as needed.' },
            { n: '03', title: 'Share the loadstring', desc: 'Copy a tiny one-liner loadstring. Users run it and your script executes — source code never visible.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ background: 'var(--bg)' }}>
        <div className="cta-inner">
          <h2 className="cta-title">Ready to protect your scripts?</h2>
          <p className="cta-sub">Free to use. No credit card required. Deploy in minutes.</p>
          <Link href="/register" className="btn btn-primary btn-hero">Create free account</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-copy">LuaVault &copy; {new Date().getFullYear()}. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text3)' }}>
          <span>Secure script hosting for Roblox developers</span>
        </div>
      </footer>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{ padding: 20, background: 'var(--bg)', minHeight: 280 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['TOTAL SCRIPTS', '12'], ['ACTIVE', '12'], ['TOTAL KEYS', '48'], ['EXECUTIONS', '391']].map(([l, v]) => (
          <div key={l} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase' }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: l === 'ACTIVE' || l === 'EXECUTIONS' ? 'var(--accent)' : 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogoIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>; }
function ShieldIcon({ size = 18 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function KeyIcon() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>; }
function LockIcon() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function ActivityIcon() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function BanIcon() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function ClockIcon() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  return { props: { loggedIn: !!user } };
}
