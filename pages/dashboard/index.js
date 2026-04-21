import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useConfirm } from '../../components/ConfirmModal';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Dashboard({ user }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [stats, setStats] = useState(null);
  const [recents, setRecents] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetch('/api/executions/stats').then(r=>r.json()).then(setStats).catch(()=>{});
    fetch('/api/executions/list?limit=8').then(r=>r.json()).then(d=>setRecents(d.executions||[])).catch(()=>{});
  }, []);

  async function deleteExecution(executionId) {
    const ok = await confirm({
      title: 'Delete execution log',
      message: 'This log will be permanently removed.',
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;
    setDeletingId(executionId);
    try {
      const r = await fetch(`/api/executions/${executionId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete execution');
      setRecents(prev => prev.filter(e => e.id !== executionId));
    } catch (_) {}
    setDeletingId(null);
  }

  return (
    <Layout user={user}>
      {ConfirmDialog}
      <div className="page-header">
        <div><div className="page-title">Overview</div><div className="page-sub">Welcome back, {user.username}</div></div>
      </div>

      <div className="stats-section">
        <div className="stats-label">Scripts</div>
        <div className="stats-grid">
          <Stat label="Total" value={stats?.scripts?.total}/>
          <Stat label="Active" value={stats?.scripts?.active} accent/>
          <Stat label="Protected" value={stats?.scripts?.key_protected}/>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-label">License Keys</div>
        <div className="stats-grid">
          <Stat label="Total Keys" value={stats?.keys?.total}/>
          <Stat label="Active" value={stats?.keys?.active} accent/>
          <Stat label="HWID Bound" value={stats?.keys?.hwid_bound} sub="Locked to device"/>
          <Stat label="Created Today" value={stats?.keys?.today} sub="Last 24 hours"/>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-label">Execution Logs</div>
        <div className="stats-grid">
          <Stat label="Total Runs" value={stats?.executions?.total}/>
          <Stat label="Successful" value={stats?.executions?.successful} accent/>
          <Stat label="Failed" value={stats?.executions?.failed}/>
          <Stat label="Today" value={stats?.executions?.today} sub="Last 24 hours"/>
        </div>
      </div>

      {recents.length>0&&(
        <div className="card">
          <div className="card-header"><span className="card-header-title">Recent Executions</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Script</th><th>Player</th><th>IP</th><th>Status</th><th>Time</th><th style={{width:42}}></th></tr></thead>
              <tbody>
                {recents.map(e=>(
                  <tr key={e.id}>
                    <td style={{fontWeight:600,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.script_name}</td>
                    <td style={{fontWeight:500}}>{e.roblox_name}</td>
                    <td className="td-mono">{e.ip_address||'—'}</td>
                    <td><span className={`badge ${e.success?'badge-green':'badge-red'}`}>{e.success?'OK':'Fail'}</span></td>
                    <td className="td-mono" style={{fontSize:11,whiteSpace:'nowrap'}}>{new Date(e.executed_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => deleteExecution(e.id)}
                        disabled={deletingId === e.id}
                        title="Delete log"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Stat({label,value,accent,sub}){
  return(
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${accent?' accent':''}`}>
        {value==null?<span className="spinner" style={{width:16,height:16}}/>:value}
      </div>
      {sub&&<div className="stat-sub">{sub}</div>}
    </div>
  );
}

function TrashIcon() { return <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/><path d="M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6"/></svg>; }

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
