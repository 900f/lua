import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ user, children }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem('lv_theme')||'violet';
    const d = localStorage.getItem('lv_dark')==='true';
    document.documentElement.setAttribute('data-theme', t);
    if (d) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);
  return (
    <div className="app-layout">
      <Sidebar user={user} open={open} onClose={()=>setOpen(false)} />
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        <div className="mobile-topbar">
          <span className="mobile-logo">Luvenn</span>
          <button className="burger" onClick={()=>setOpen(o=>!o)} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
