import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function KeyPage() {
  const router = useRouter();
  const { token } = router.query;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (token) loadStatus(); }, [token]);

  async function loadStatus() {
    setLoading(true);
    try {
      const r = await fetch(`/api/key-system/status?token=${token}`);
      if (r.status === 410) { setError('This link has expired. Re-run the script in Roblox to get a new one.'); setLoading(false); return; }
      if (!r.ok) { setError('Invalid or expired link.'); setLoading(false); return; }
      const d = await r.json();
      setData(d);
    } catch { setError('Failed to load. Check your connection.'); }
    setLoading(false);
  }

  async function handleTask(task) {
    if (task.done || completing) return;
    setCompleting(task.id);
    window.open(task.url, '_blank', 'noopener');
    // 15 second wait then mark complete
    await new Promise(res => setTimeout(res, 15000));
    try {
      const r = await fetch('/api/key-system/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, taskId: task.id }),
      });
      const d = await r.json();
      if (d.completed && d.key) {
        setData(prev => ({ ...prev, completed: true, key: d.key, tasks: prev.tasks.map(t => ({ ...t, done: true })) }));
      } else {
        setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, done: true } : t) }));
      }
    } catch { /* silently fail, user can retry */ }
    setCompleting(null);
  }

  function copyKey() {
    if (!data?.key) return;
    navigator.clipboard.writeText(data.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const doneTasks = data?.tasks?.filter(t => t.done).length || 0;
  const totalTasks = data?.tasks?.length || 0;
  const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  if (loading) return (
    <div className="key-page">
      <div className="key-card" style={{ textAlign: 'center', padding: 56 }}>
        <div style={{ marginBottom: 14 }}><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="key-page">
      <div className="key-card">
        <div className="key-card-logo"><LogoIcon />LuaVault</div>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Link Expired</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{error}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="key-page">
      <div className="key-card">
        <div className="key-card-logo"><LogoIcon />LuaVault</div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.3px', marginBottom: 6 }}>
            {data?.completed ? 'Key Ready' : 'Get Your Key'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
            {data?.completed
              ? 'Copy your key below and paste it into the in-game menu.'
              : `Complete ${totalTasks} task${totalTasks !== 1 ? 's' : ''} below to receive your script key${data?.roblox_name ? ` — ${data.roblox_name}` : ''}.`}
          </div>
        </div>

        {/* Progress */}
        {!data?.completed && totalTasks > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text3)', marginBottom: 7 }}>
              <span style={{ fontWeight: 600 }}>Progress</span>
              <span>{doneTasks} of {totalTasks} complete</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
          </div>
        )}

        {/* Tasks */}
        {!data?.completed && (
          <div style={{ marginBottom: 4 }}>
            {data?.tasks?.map(task => (
              <div
                key={task.id}
                className={`task-item${task.done ? ' done' : ''}`}
                onClick={() => handleTask(task)}
              >
                <div className="task-check">
                  {task.done
                    ? <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : completing === task.id
                      ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                      : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="task-name">{task.label}</div>
                  {completing === task.id && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Verifying — please wait…</div>}
                  {task.done && <div style={{ fontSize: 11, color: '#15803d', marginTop: 3 }}>Completed</div>}
                </div>
                <TaskIcon type={task.type} />
              </div>
            ))}
          </div>
        )}

        {/* Key result */}
        {data?.completed && data?.key && (
          <div className="key-result">
            <div className="key-result-label">Your Key</div>
            <div className="key-result-value" style={{ marginBottom: 14, userSelect: 'all' }}>{data.key}</div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
              onClick={copyKey}
            >
              {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy Key</>}
            </button>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(0,0,0,.04)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              Paste this into the in-game input field and press Verify Key.
            </div>
          </div>
        )}

        {!data?.completed && totalTasks === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
            No tasks configured for this script.
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
          Protected by LuaVault
        </div>
      </div>
    </div>
  );
}

function TaskIcon({ type }) {
  if (type === 'youtube') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
      <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  );
  if (type === 'discord') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
    </svg>
  );
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}
function LogoIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>; }
function CopyIcon() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>; }
function CheckIcon() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
