import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function IpBans({ user }) {
  const { toasts, toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const r = await fetch('/api/ip-ban');
    const d = await r.json();
    setBans(d.bans || []);
    setLoading(false);
  }
  async function unban(id, ip) {
    const ok = await confirm({ title: `Unban ${ip}?`, message: 'They will be able to execute your scripts again.', confirmLabel: 'Unban', confirmClass: 'btn-secondary' });
    if (!ok) return;
    const r = await fetch(`/api/ip-ban/${id}`, { method: 'DELETE' });
    if (r.ok) { toast('Unbanned.'); load(); } else toast('Failed.', 'error');
  }

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts} />
      {ConfirmDialog}
      <div className="page-header">
        <div><div className="page-title">IP Bans</div><div className="page-sub">Blocked IPs cannot execute any of your scripts</div></div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus/>Ban IP</button>
        </div>
      </div>
      <div className="card">
        {loading ? <div style={{ padding: 56, textAlign: 'center' }}><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
        : bans.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div className="empty-title">No banned IPs</div>
            <div className="empty-sub">Ban IPs here or directly from the Executions log</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>IP Address</th><th>Reason</th><th>Banned At</th><th>Actions</th></tr></thead>
              <tbody>
                {bans.map(b => (
                  <tr key={b.id}>
                    <td className="td-mono" style={{ fontWeight: 700, fontSize: 13 }}>{b.ip_address}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{b.reason || '—'}</td>
                    <td className="td-mono" style={{ fontSize: 11 }}>{new Date(b.banned_at).toLocaleString()}</td>
                    <td><button className="btn btn-xs btn-secondary" onClick={() => unban(b.id, b.ip_address)}>Unban</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAdd && <AddBanModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); toast('IP banned.'); }} />}
    </Layout>
  );
}

function AddBanModal({ onClose, onDone }) {
  const [form, setForm] = useState({ ip_address: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await fetch('/api/ip-ban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (!r.ok) return setError(d.error);
    onDone();
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-title">Ban IP Address</div>
        <div className="modal-sub">They will be blocked from executing all your scripts immediately.</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">IP Address</label><input className="form-input" placeholder="123.45.67.89" value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">Reason <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional)</span></label><input className="form-input" placeholder="Exploit abuse" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={loading}>{loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Ban IP'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Plus() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: { id: user.id, email: user.email, username: user.username } } };
}
