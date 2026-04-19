import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Analytics({ user }) {
  const [stats, setStats] = useState(null);
  const [executions, setExecutions] = useState([]);

  useEffect(() => {
    fetch('/api/executions/stats').then(r=>r.json()).then(setStats).catch(()=>{});
    fetch('/api/executions/list?limit=500').then(r=>r.json()).then(d=>setExecutions(d.executions||[])).catch(()=>{});
  }, []);

  // Compute top players and top scripts
  const playerCounts = {};
  const scriptCounts = {};
  const ipCounts = {};
  executions.forEach(e => {
    if (e.roblox_name) playerCounts[e.roblox_name]=(playerCounts[e.roblox_name]||0)+1;
    if (e.script_name) scriptCounts[e.script_name]=(scriptCounts[e.script_name]||0)+1;
    if (e.ip_address) ipCounts[e.ip_address]=(ipCounts[e.ip_address]||0)+1;
  });
  const topPlayers = Object.entries(playerCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topScripts = Object.entries(scriptCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const successRate = executions.length ? Math.round((executions.filter(e=>e.success).length/executions.length)*100) : 0;

  return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Analytics</div><div className="page-sub">Insights from your last 500 executions</div></div>
      </div>

      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card"><div className="stat-label">Total Runs</div><div className="stat-value accent">{stats?.executions?.total??'—'}</div></div>
        <div className="stat-card"><div className="stat-label">Success Rate</div><div className="stat-value accent">{successRate}%</div></div>
        <div className="stat-card"><div className="stat-label">Unique Players</div><div className="stat-value">{Object.keys(playerCounts).length}</div></div>
        <div className="stat-card"><div className="stat-label">Unique IPs</div><div className="stat-value">{Object.keys(ipCounts).length}</div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div className="card">
          <div className="card-header"><span className="card-header-title">Top Scripts</span></div>
          {topScripts.length===0?<div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:13}}>No data yet</div>:(
            topScripts.map(([name,count])=>(
              <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 20px',borderBottom:'1px solid var(--border)'}}>
                <div style={{flex:1,fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                <div style={{fontWeight:700,color:'var(--accent)',fontSize:14}}>{count}</div>
                <div style={{width:80,height:6,background:'var(--bg2)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{width:`${Math.round((count/(topScripts[0]?.[1]||1))*100)}%`,height:'100%',background:'var(--accent)',borderRadius:99}}/>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-header-title">Top Players</span></div>
          {topPlayers.length===0?<div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:13}}>No data yet</div>:(
            topPlayers.map(([name,count])=>(
              <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 20px',borderBottom:'1px solid var(--border)'}}>
                <div style={{flex:1,fontWeight:600,fontSize:13}}>{name}</div>
                <div style={{fontWeight:700,color:'var(--accent)',fontSize:14}}>{count}</div>
                <div style={{width:80,height:6,background:'var(--bg2)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{width:`${Math.round((count/(topPlayers[0]?.[1]||1))*100)}%`,height:'100%',background:'var(--accent)',borderRadius:99}}/>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
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
