import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    fetch('/api/executions/stats').then(r=>r.json()).then(setStats).catch(()=>{});
    fetch('/api/executions/list?limit=8').then(r=>r.json()).then(d=>setRecents(d.executions||[])).catch(()=>{});
  }, []);

  return (
    <Layout user={user}>
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
              <thead><tr><th>Script</th><th>Player</th><th>IP</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {recents.map(e=>(
                  <tr key={e.id}>
                    <td style={{fontWeight:600,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.script_name}</td>
                    <td style={{fontWeight:500}}>{e.roblox_name}</td>
                    <td className="td-mono">{e.ip_address||'—'}</td>
                    <td><span className={`badge ${e.success?'badge-green':'badge-red'}`}>{e.success?'OK':'Fail'}</span></td>
                    <td className="td-mono" style={{fontSize:11,whiteSpace:'nowrap'}}>{new Date(e.executed_at).toLocaleString()}</td>
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

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
