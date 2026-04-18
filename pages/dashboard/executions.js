import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Executions({ user }) {
  const { toasts, toast } = useToast();
  const [executions, setExecutions] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scriptFilter, setScriptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/scripts').then(r => r.json()).then(d => setScripts(d.scripts || []));
    load('all');
  }, []);

  async function load(sid) {
    setLoading(true);
    const url = sid && sid !== 'all' ? `/api/executions/list?scriptId=${sid}&limit=300` : '/api/executions/list?limit=300';
    const r = await fetch(url);
    const d = await r.json();
    setExecutions(d.executions || []);
    setLoading(false);
  }

  function onScriptChange(v) { setScriptFilter(v); load(v); }

  async function banIp(ip) {
    if (!confirm(`Ban IP ${ip}? They will be blocked from all your scripts.`)) return;
    const r = await fetch('/api/ip-ban', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_address: ip, reason: 'Banned from execution log' }),
    });
    if (r.ok) toast(`IP ${ip} banned.`);
    else toast('Failed to ban IP.', 'error');
  }

  const filtered = executions.filter(e => {
    if (statusFilter === 'success') return e.success;
    if (statusFilter === 'failed') return !e.success;
    return true;
  });

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <div>
          <div className="page-title">Executions</div>
          <div className="page-sub">Every script execution logged with IP, username and timestamp. Logs auto-delete after 3 days.</div>
        </div>
      </div>

      <div className="topbar">
        <select className="form-input form-select" style={{ width: 'auto', fontSize: 13, padding: '7px 30px 7px 10px' }}
          value={scriptFilter} onChange={e => onScriptChange(e.target.value)}>
          <option value="all">All Scripts</option>
          {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'success', 'failed'].map(f => (
            <button key={f} className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ActivityIcon /></div>
            <div className="empty-title">No executions found</div>
            <div className="empty-sub">Executions appear here when users run your scripts</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Script</th>
                  <th>Roblox Name</th>
                  <th>IP Address</th>
                  <th>Key</th>
                  <th>HWID</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.script_name}</td>
                    <td style={{ fontWeight: 500 }}>{e.roblox_name}</td>
                    <td className="td-mono">{e.ip_address || '—'}</td>
                    <td>
                      {e.key_used
                        ? <span className="td-mono" style={{ fontSize: 10 }}>{e.key_used.slice(0, 12)}…</span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td>
                      {e.hwid
                        ? <span className="badge badge-accent" style={{ fontSize: 10 }}>{e.hwid.slice(0, 8)}…</span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${e.success ? 'badge-green' : 'badge-red'}`}>{e.success ? 'OK' : 'Fail'}</span>
                      {!e.success && e.fail_reason && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{e.fail_reason}</div>
                      )}
                    </td>
                    <td className="td-mono" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                      {new Date(e.executed_at).toLocaleString()}
                    </td>
                    <td>
                      {e.ip_address && e.ip_address !== 'unknown' && (
                        <button className="btn btn-xs btn-danger" onClick={() => banIp(e.ip_address)} title="Ban this IP">
                          <BanIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

function ActivityIcon() { return <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function BanIcon() { return <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }

export async function getServerSideProps({ req, res }) {
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: { id: user.id, email: user.email, username: user.username } } };
}
