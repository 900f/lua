import { useRouter } from 'next/router';

const NAV_MAIN = [
  { key:'overview',   label:'Overview',    href:'/dashboard',              icon:IconGrid },
  { key:'scripts',    label:'Scripts',     href:'/dashboard/scripts',      icon:IconCode },
  { key:'keys',       label:'Keys',        href:'/dashboard/keys',         icon:IconKey },
  { key:'executions', label:'Executions',  href:'/dashboard/executions',   icon:IconActivity },
];
const NAV_MGMT = [
  { key:'analytics',  label:'Analytics',   href:'/dashboard/analytics',    icon:IconChart },
  { key:'ipbans',     label:'IP Bans',     href:'/dashboard/ipbans',       icon:IconShield },
  { key:'webhooks',   label:'Webhooks',    href:'/dashboard/webhooks',     icon:IconWebhook },
  { key:'audit',      label:'Audit Log',   href:'/dashboard/audit',        icon:IconAudit },
  { key:'settings',   label:'Settings',    href:'/dashboard/settings',     icon:IconSettings },
];

export default function Sidebar({ user, open, onClose }) {
  const router = useRouter();
  const p = router.pathname;
  const isActive = href => href === '/dashboard' ? p === href : p.startsWith(href);
  async function signOut() { await fetch('/api/auth/logout',{method:'POST'}); router.push('/'); }
  function go(href) { router.push(href); onClose?.(); }
  const initial = (user?.username||'U').charAt(0).toUpperCase();

  return (
    <>
      <div className={`sidebar-overlay${open?' open':''}`} onClick={onClose} />
      <aside className={`sidebar${open?' open':''}`}>
        <div className="sidebar-logo">
          <span className="logo-wordmark">Luvenn</span>
          <span className="logo-badge">Beta</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Main</div>
          {NAV_MAIN.map(({key,label,href,icon:Icon})=>(
            <button key={key} className={`nav-item${isActive(href)?' active':''}`} onClick={()=>go(href)}>
              <Icon/>{label}
            </button>
          ))}
          <div className="nav-section">Tools</div>
          {NAV_MGMT.map(({key,label,href,icon:Icon})=>(
            <button key={key} className={`nav-item${isActive(href)?' active':''}`} onClick={()=>go(href)}>
              <Icon/>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{user?.username}</div>
              <div className="sidebar-userlabel">Developer</div>
            </div>
          </div>
          <button className="sidebar-signout" onClick={signOut}><LogoutIcon/>Sign out</button>
        </div>
      </aside>
    </>
  );
}

function IconGrid(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;}
function IconCode(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;}
function IconKey(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>;}
function IconActivity(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;}
function IconShield(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}
function IconChart(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;}
function IconWebhook(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 012 17c.01-.7.2-1.4.57-2"/><path d="M6 17l3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 116.89-4.06"/><path d="M12 6a4 4 0 014 4c0 .67-.16 1.3-.44 1.86L19 17"/></svg>;}
function IconAudit(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;}
function IconSettings(){return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;}
function LogoutIcon(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;}
