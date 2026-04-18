import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme from localStorage
  useEffect(() => {
    const theme = localStorage.getItem('lv_theme') || 'pink';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-topbar">
          <span className="mobile-logo">LuaVault</span>
          <button className="burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
