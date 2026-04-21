import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { useConfirm, SelectModal } from '../../components/ConfirmModal';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Executions({ user }) {
  const { toasts, toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [executions, setExecutions] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scriptFilter, setScriptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showScriptPicker, setShowScriptPicker] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    fetch('/api/scripts').then(r => r.json()).then(d => setScripts(d.scripts || [])).catch(() => {});
    load('all');
  }, []);

  async function load(sid) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const url = sid && sid !== 'all'
        ? `/api/executions/list?scriptId=${sid}&limit=300`
        : '/api/executions/list?limit=300';
      const r = await fetch(url);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setExecutions(d.executions || []);
    } catch (e) {
      toast('Failed to load: ' + e.message, 'error');
      setExecutions([]);
    }
    setLoading(false);
    loadingRef.current = false;
  }

  function onScriptChange(v) {
    setScriptFilter(v);
    load(v);
  }

  async function banIp(ip) {
    const ok = await confirm({
      title: 'Ban IP Address',
      message: `Ban ${ip}? They will be blocked from executing all your scripts immediately.`,
      confirmLabel: 'Ban IP',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;
    const r = await fetch('/api/ip-ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_address: ip, reason: 'Banned from execution log' }),
    });
    if (r.ok) toast(`Banned ${ip}`);
    else toast('Failed to ban IP', 'error');
  }

  async function deleteExecution(executionId) {
    const ok = await confirm({
      title: 'Delete execution log',
      message: 'This log will be permanently removed.',
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;

    try {
      const r = await fetch(`/api/executions/${executionId}`, { method: 'DELETE' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Failed to delete execution');
      setExecutions(prev => prev.filter(e => e.id !== executionId));
      toast('Execution deleted');
    } catch (e) {
      toast(e.message || 'Failed to delete execution', 'error');
    }
  }

  const filtered = executions.filter(e => {
    if (statusFilter === 'success') return e.success;
    if (statusFilter === 'failed') return !e.success;
    return true;
  });

  const scriptOptions = [
    { value: 'all', label: 'All Scripts' },
    ...scripts.map(s => ({ value: s.id, label: s.name })),
  ];
  const selectedScriptLabel = scriptOptions.find(o => o.value === scriptFilter)?.label || 'All Scripts';

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts} />
      {ConfirmDialog}
      {showScriptPicker && (
        <SelectModal
          title="Filter by Script"
          options={scriptOptions}
          value={scriptFilter}
          onSelect={onScriptChange}
          onClose={() => setShowScriptPicker(false)}
        />
      )}

      <div className="page-header">
        <div>
          <div className="page-title">Executions</div>
          <div className="page-sub">Every script run logged with IP, player and timestamp. Auto-deleted after 3 days.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => load(scriptFilter)}>
            <RefreshIcon /> Refresh
          </button>
        </div>
      </div>

      {/* Filters row — fixed height, no layout shift */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {/* Script selector — custom modal trigger */}
        <button
          className="btn btn-secondary btn-sm"
          style={{ minWidth: 160, justifyContent: 'space-between', gap: 8 }}
          onClick={() => setShowScriptPicker(true)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
            {selectedScriptLabel}
          </span>
          <ChevronIcon />
        </button>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {[
            { v: 'all', l: 'All' },
            { v: 'success', l: 'Success' },
            { v: 'failed', l: 'Failed' },
          ].map(({ v, l }) => (
            <button
              key={v}
              className={`btn btn-sm ${statusFilter === v ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minWidth: 64 }}
              onClick={() => setStatusFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div className="empty-title">No executions found</div>
            <div className="empty-sub">
              {executions.length === 0
                ? 'Executions appear when users run your scripts'
                : 'No results match the current filter'}
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Script</th>
                  <th>Player</th>
                  <th>IP Address</th>
                  <th>Key</th>
                  <th>HWID</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.script_name}
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.roblox_name || '—'}</td>
                    <td className="td-mono">{e.ip_address || '—'}</td>
                    <td>
                      {e.key_used
                        ? <span className="td-mono" style={{ fontSize: 10.5 }}>{e.key_used.slice(0, 12)}…</span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td>
                      {e.hwid
                        ? <span className="badge badge-accent" style={{ fontSize: 10 }}>{e.hwid.slice(0, 8)}…</span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${e.success ? 'badge-green' : 'badge-red'}`}>
                        {e.success ? 'OK' : 'Fail'}
                      </span>
                      {!e.success && e.fail_reason && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{e.fail_reason}</div>
                      )}
                    </td>
                    <td className="td-mono" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                      {new Date(e.executed_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {e.ip_address && e.ip_address !== 'unknown' && (
                          <button
                            className="btn btn-xs btn-danger"
                            style={{ flexShrink: 0 }}
                            onClick={() => banIp(e.ip_address)}
                            title="Ban IP"
                          >
                            <BanIcon />
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-ghost"
                          style={{ flexShrink: 0 }}
                          onClick={() => deleteExecution(e.id)}
                          title="Delete log"
                        >
                          <TrashIcon />
                        </button>
                      </div>
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

function RefreshIcon() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>; }
function BanIcon() { return <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function TrashIcon() { return <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/><path d="M19 6l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6"/></svg>; }
function ChevronIcon() { return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: { id: user.id, email: user.email, username: user.username } } };
}
