import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Keys({ user }) {
  const router = useRouter();
  const { scriptId } = router.query;
  const { toasts, toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [scripts, setScripts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [keys, setKeys] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingScripts, setLoadingScripts] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [tab, setTab] = useState('keys');
  const [filter, setFilter] = useState('all');
  const [showGen, setShowGen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => { loadScripts(); }, []);
  useEffect(() => {
    if (scripts.length && scriptId) {
      const s = scripts.find(x => x.id === scriptId);
      if (s) selectScript(s);
    }
  }, [scripts, scriptId]);

  async function loadScripts() {
    setLoadingScripts(true);
    const r = await fetch('/api/scripts');
    const d = await r.json();
    const ks = (d.scripts||[]).filter(s => s.key_protected || s.use_key_system);
    setScripts(ks);
    setLoadingScripts(false);
  }

  async function selectScript(s) {
    setSelected(s);
    router.replace({ query:{ scriptId:s.id } }, undefined, { shallow:true });
    loadKeys(s.id);
    if (s.use_key_system) loadTasks(s.id);
  }

  async function loadKeys(sid) {
    setLoadingKeys(true);
    const r = await fetch(`/api/keys/${sid}`);
    const d = await r.json();
    setKeys(d.keys||[]);
    setLoadingKeys(false);
  }

  async function loadTasks(sid) {
    const r = await fetch(`/api/key-system/tasks/${sid}`);
    const d = await r.json();
    setTasks(d.tasks||[]);
  }

  async function deleteKey(id) {
    const ok = await confirm({
      title: 'Delete key',
      message: 'This key will be permanently removed.',
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;
    const r = await fetch(`/api/keys/action/${id}`,{method:'DELETE'});
    if (r.ok) { toast('Key deleted.'); loadKeys(selected.id); } else toast('Failed.','error');
  }

  async function toggleKey(id) {
    const r = await fetch(`/api/keys/action/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle'})});
    if (r.ok) { toast('Updated.'); loadKeys(selected.id); } else toast('Failed.','error');
  }

  async function resetHwid(id) {
    const ok = await confirm({
      title: 'Reset HWID',
      message: 'Current HWID binding will be removed. The next device to use this key will bind automatically.',
      confirmLabel: 'Reset HWID',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;
    const r = await fetch(`/api/keys/action/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reset_hwid'})});
    if (r.ok) { toast('HWID reset.'); loadKeys(selected.id); } else toast('Failed.','error');
  }

  async function deleteTask(id) {
    const ok = await confirm({
      title: 'Delete task',
      message: 'This key-system task will be removed.',
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;
    const r = await fetch(`/api/key-system/tasks/delete/${id}`,{method:'DELETE'});
    if (r.ok) { toast('Task removed.'); loadTasks(selected.id); } else toast('Failed.','error');
  }

  function copyKey(v) { navigator.clipboard.writeText(v); toast('Copied!','info'); }

  const filtered = keys.filter(k => {
    if (filter==='active') return k.active;
    if (filter==='inactive') return !k.active;
    if (filter==='hwid') return !!k.hwid;
    return true;
  });

  const durBadge = d => {
    const m={day:'badge-yellow',week:'badge-blue',month:'badge-accent',lifetime:'badge-green'};
    return <span className={`badge ${m[d]||'badge-gray'}`}>{d||'lifetime'}</span>;
  };

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts}/>
      {ConfirmDialog}
      <div className="page-header">
        <div><div className="page-title">Keys</div><div className="page-sub">Generate and manage license keys with HWID locking</div></div>
      </div>

      <div className="card card-pad" style={{marginBottom:18}}>
        <div style={{fontSize:10.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Select Script</div>
        {loadingScripts?<span className="spinner"/>:scripts.length===0?<p style={{fontSize:13,color:'var(--text3)'}}>No key-protected scripts found. Create a script with Key Protected or Built-in Key System enabled.</p>:(
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {scripts.map(s=>(
              <button key={s.id} className={`btn btn-sm ${selected?.id===s.id?'btn-primary':'btn-secondary'}`} onClick={()=>selectScript(s)}>
                {s.name}{s.use_key_system&&<span style={{fontSize:10,opacity:.7,marginLeft:4}}>KS</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected&&(
        <>
          {selected.use_key_system&&(
            <div className="tabs">
              <button className={`tab-btn${tab==='keys'?' active':''}`} onClick={()=>setTab('keys')}>Keys</button>
              <button className={`tab-btn${tab==='tasks'?' active':''}`} onClick={()=>setTab('tasks')}>Key System Tasks</button>
            </div>
          )}

          {tab==='keys'&&(
            <>
              <div className="topbar">
                <div style={{display:'flex',gap:6}}>
                  {['all','active','inactive','hwid'].map(f=><button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
                </div>
                <div className="topbar-right">
                  <span style={{fontSize:12,color:'var(--text3)'}}>{filtered.length} keys</span>
                  <button className="btn btn-primary" onClick={()=>setShowGen(true)}><Plus/>Generate</button>
                </div>
              </div>
              <div className="card">
                {loadingKeys?<div style={{padding:48,textAlign:'center'}}><span className="spinner"/></div>
                :filtered.length===0?<div className="empty-state"><div className="empty-title">No keys</div><div className="empty-sub">Generate keys for "{selected.name}"</div></div>
                :(
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Key</th><th>Note</th><th>Duration</th><th>HWID</th><th>Expires</th><th>Status</th><th>Last Used</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filtered.map(k=>(
                          <tr key={k.id}>
                            <td><div style={{display:'flex',alignItems:'center',gap:7}}><span className="td-mono">{k.key_value.slice(0,16)}…</span><button className="btn btn-xs btn-ghost" onClick={()=>copyKey(k.key_value)}>Copy</button></div></td>
                            <td style={{color:'var(--text2)',fontSize:12}}>{k.note||'—'}</td>
                            <td>{durBadge(k.duration)}</td>
                            <td>{k.hwid?<span className="badge badge-accent" style={{fontSize:10}}>{k.hwid.slice(0,10)}…</span>:k.hwid_locked?<span className="badge badge-yellow">Pending</span>:<span style={{color:'var(--text3)'}}>—</span>}</td>
                            <td className="td-mono" style={{fontSize:11}}>{k.expires_at?new Date(k.expires_at).toLocaleDateString():'Never'}</td>
                            <td><span className={`badge ${k.active?'badge-green':'badge-red'}`}>{k.active?'Active':'Off'}</span></td>
                            <td className="td-mono" style={{fontSize:11}}>{k.last_used?new Date(k.last_used).toLocaleString():'—'}</td>
                            <td>
                              <div className="row-actions">
                                <button className="btn btn-xs btn-ghost" onClick={()=>toggleKey(k.id)} title={k.active?'Disable':'Enable'}>{k.active?<PauseIcon/>:<PlayIcon/>}</button>
                                {k.hwid&&<button className="btn btn-xs btn-ghost" onClick={()=>resetHwid(k.id)} title="Reset HWID"><RefreshIcon/></button>}
                                <button className="btn btn-xs btn-danger" onClick={()=>deleteKey(k.id)}><TrashIcon/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {tab==='tasks'&&selected.use_key_system&&(
            <>
              <div className="topbar">
                <div style={{fontSize:13,color:'var(--text2)'}}>Users complete these tasks to receive a key.</div>
                <div className="topbar-right"><button className="btn btn-primary" onClick={()=>setShowAddTask(true)}><Plus/>Add Task</button></div>
              </div>
              <div className="card">
                {tasks.length===0?<div className="empty-state"><div className="empty-title">No tasks configured</div><div className="empty-sub">Add tasks for users to complete</div></div>:(
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Task</th><th>Type</th><th>URL</th><th>Actions</th></tr></thead>
                      <tbody>
                        {tasks.map(t=>(
                          <tr key={t.id}>
                            <td style={{fontWeight:500}}>{t.label}</td>
                            <td><span className="badge badge-gray">{t.task_type}</span></td>
                            <td className="td-mono" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.url}</td>
                            <td><button className="btn btn-xs btn-danger" onClick={()=>deleteTask(t.id)}><TrashIcon/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {showGen&&selected&&<GenerateModal script={selected} onClose={()=>setShowGen(false)} onDone={()=>{setShowGen(false);loadKeys(selected.id);toast('Keys generated!');}}/>}
      {showAddTask&&selected&&<AddTaskModal scriptId={selected.id} onClose={()=>setShowAddTask(false)} onDone={()=>{setShowAddTask(false);loadTasks(selected.id);toast('Task added!');}}/>}
    </Layout>
  );
}

function GenerateModal({script,onClose,onDone}) {
  const [form,setForm]=useState({count:1,note:'',hwid_locked:true,duration:'day'});
  const [loading,setLoading]=useState(false);
  const [generated,setGenerated]=useState(null);

  async function submit(e) {
    e.preventDefault();setLoading(true);
    const r=await fetch(`/api/keys/${script.id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const d=await r.json();setLoading(false);
    if(r.ok)setGenerated(d.keys);else alert(d.error);
  }

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">Generate Keys — {script.name}</div>
        <div className="modal-sub">Create license keys for this script</div>
        {!generated?(
          <form onSubmit={submit}>
            <div className="form-group"><label className="form-label">Number of Keys</label><input className="form-input" type="number" min="1" max="100" value={form.count} onChange={e=>setForm(f=>({...f,count:parseInt(e.target.value)||1}))}/></div>
            <div className="form-group"><label className="form-label">Duration</label><select className="form-input form-select" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))}><option value="day">1 Day</option><option value="week">1 Week</option><option value="month">1 Month</option><option value="lifetime">Lifetime</option></select></div>
            <div className="form-group"><label className="form-label">Note <span style={{fontWeight:400,color:'var(--text3)'}}>(optional)</span></label><input className="form-input" placeholder="Customer name, order #..." value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></div>
            <div className="form-group"><label className="check-row"><input type="checkbox" checked={form.hwid_locked} onChange={e=>setForm(f=>({...f,hwid_locked:e.target.checked}))}/><div><div className="check-label">HWID Lock</div><div className="check-hint">Binds to the first device that uses it.</div></div></label></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="spinner" style={{width:14,height:14}}/>:`Generate ${form.count} Key${form.count>1?'s':''}`}</button>
            </div>
          </form>
        ):(
          <>
            <div className="alert alert-success">Generated {generated.length} key{generated.length>1?'s':''}!</div>
            <div style={{position:'relative'}}><pre className="code-block">{generated.map(k=>k.key_value).join('\n')}</pre><button className="code-copy-btn" onClick={()=>navigator.clipboard.writeText(generated.map(k=>k.key_value).join('\n'))}>Copy All</button></div>
            <div className="modal-footer"><button className="btn btn-primary" onClick={onDone}>Done</button></div>
          </>
        )}
      </div>
    </div>
  );
}

function AddTaskModal({scriptId,onClose,onDone}) {
  const [form,setForm]=useState({label:'',url:'',task_type:'youtube'});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  async function submit(e) {
    e.preventDefault();setError('');setLoading(true);
    const r=await fetch(`/api/key-system/tasks/${scriptId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const d=await r.json();setLoading(false);
    if(!r.ok)return setError(d.error);
    onDone();
  }
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">Add Key System Task</div>
        <div className="modal-sub">Users click this task, are redirected for 15 seconds, then it marks complete automatically.</div>
        {error&&<div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Task Label</label><input className="form-input" placeholder="Subscribe to our YouTube channel" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-input form-select" value={form.task_type} onChange={e=>setForm(f=>({...f,task_type:e.target.value}))}><option value="youtube">YouTube</option><option value="discord">Discord</option><option value="link">Other Link</option></select></div>
          <div className="form-group"><label className="form-label">URL</label><input className="form-input" type="url" placeholder="https://youtube.com/@yourchannel" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} required/></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="spinner" style={{width:14,height:14}}/>:'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Plus(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;}
function PauseIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;}
function PlayIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>;}
function RefreshIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;}
function TrashIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
