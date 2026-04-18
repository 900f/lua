import { useRouter } from 'next/router';

const NAV_MAIN = [
  { key: 'overview', label: 'Overview', href: '/dashboard', icon: IconGrid },
  { key: 'scripts', label: 'Scripts', href: '/dashboard/scripts', icon: IconCode },
  { key: 'keys', label: 'Keys', href: '/dashboard/keys', icon: IconKey },
  { key: 'executions', label: 'Executions', href: '/dashboard/executions', icon: IconActivity },
];
const NAV_MGMT = [
  { key: 'ipbans', label: 'IP Bans', href: '/dashboard/ipbans', icon: IconShield },
  { key: 'settings', label: 'Settings', href: '/dashboard/settings', icon: IconSettings },
];

export default function Sidebar({ user, open, onClose }) {
  const router = useRouter();
  const p = router.pathname;

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }
  function go(href) { router.push(href); onClose?.(); }

  const isActive = (href) => href === '/dashboard' ? p === href : p.startsWith(href);

  return (
    <>
      <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <LogoIcon />Lua<span className="logo-dark">Vault</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          {NAV_MAIN.map(({ key, label, href, icon: Icon }) => (
            <button key={key} className={`nav-item${isActive(href) ? ' active' : ''}`} onClick={() => go(href)}>
              <Icon />{label}
            </button>
          ))}
          <div className="nav-section">Management</div>
          {NAV_MGMT.map(({ key, label, href, icon: Icon }) => (
            <button key={key} className={`nav-item${isActive(href) ? ' active' : ''}`} onClick={() => go(href)}>
              <Icon />{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.username}</div>
          <button className="sidebar-signout" onClick={signOut}>Sign out</button>
        </div>
      </aside>
    </>
  );
}

function LogoIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>;
}
function IconGrid() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconCode() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
function IconKey() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>; }
function IconActivity() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconShield() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconSettings() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
