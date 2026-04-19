import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

const TYPE_CONFIG = {
  ip_ban:        { label:'IP Banned',      bg:'var(--red-bg)',    color:'var(--red)',    icon:'🚫' },
  key_created:   { label:'Key Created',    bg:'var(--green-bg)',  color:'var(--green)',  icon:'🔑' },
  script_updated:{ label:'Script Updated', bg:'var(--accent-light)',color:'var(--accent)',icon:'📝' },
};

export default function AuditLog({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const r = await fetch('/api/audit/log');
    const d = await r.json();
    setEvents(d.events||[]);
    setLoading(false);
  }

  const filtered = filter==='all' ? events : events.filter(e=>e.type===filter);

  return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Audit Log</div>
          <div className="page-sub">Complete activity history — IP bans, key operations, and script changes</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshIcon/>Refresh</button>
      </div>

      <div className="topbar">
        <div style={{display:'flex',gap:6}}>
          {['all','ip_ban','key_created','script_updated'].map(f=>(
            <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(f)}>
              {f==='all'?'All':(TYPE_CONFIG[f]?.label||f)}
            </button>
          ))}
        </div>
        <div className="topbar-right" style={{fontSize:12,color:'var(--text3)'}}>{filtered.length} events</div>
      </div>

      <div className="card">
        {loading?<div style={{padding:56,textAlign:'center'}}><span className="spinner"/></div>
        :filtered.length===0?<div className="empty-state"><div className="empty-title">No events</div><div className="empty-sub">Activity will appear here as you use Luvenn</div></div>
        :(
          filtered.map((ev,i)=>{
            const cfg = TYPE_CONFIG[ev.type]||{label:ev.type,bg:'var(--bg2)',color:'var(--text2)',icon:'•'};
            return(
              <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 22px',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{cfg.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13}}>{cfg.label}</div>
                  <div style={{fontSize:12,color:'var(--text3)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.detail}</div>
                </div>
                <div style={{fontSize:11.5,color:'var(--text3)',flexShrink:0,fontFamily:'var(--mono)'}}>{new Date(ev.ts).toLocaleString()}</div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}

function RefreshIcon(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
