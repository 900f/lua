import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

export default function Scripts({ user }) {
  const router = useRouter();
  const { toasts, toast } = useToast();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editScript, setEditScript] = useState(null);
  const [lsScript, setLsScript] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/scripts');
      const d = await r.json();
      setScripts(d.scripts||[]);
    } catch(e) { toast('Failed to load scripts', 'error'); }
    setLoading(false);
  }

  async function del(s) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    const r = await fetch(`/api/scripts/${s.id}`,{method:'DELETE'});
    if (r.ok) { toast('Deleted.'); load(); } else toast('Failed.','error');
  }

  async function toggle(s) {
    const full = await fetch(`/api/scripts/${s.id}`).then(r=>r.json());
    const sc = full.script||s;
    const r = await fetch(`/api/scripts/${s.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:sc.name,description:sc.description||'',script_content:sc.script_content||'',key_protected:sc.key_protected,use_key_system:sc.use_key_system,active:!s.active})});
    if (r.ok) { toast(s.active?'Disabled.':'Enabled.'); load(); } else toast('Failed.','error');
  }

  const siteUrl = typeof window!=='undefined'?window.location.origin:'';

  function getLoadstring(s) {
    const url = `${siteUrl}/api/loader/${s.loader_key}.lua`;
    if (s.use_key_system) return `-- Key system active: in-game menu will appear\nloadstring(game:HttpGet("${url}",true))()`;
    if (s.key_protected) return `script_key = "YOUR_KEY_HERE"\nloadstring(game:HttpGet("${url}",true))()`;
    return `loadstring(game:HttpGet("${url}",true))()`;
  }

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts}/>
      <div className="page-header">
        <div><div className="page-title">Scripts</div><div className="page-sub">Manage your protected Lua scripts</div></div>
        <button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Plus/>New Script</button>
      </div>

      <div className="card">
        {loading?<div style={{padding:56,textAlign:'center'}}><span className="spinner"/></div>
        :scripts.length===0?<EmptyState icon={<CodeIcon/>} title="No scripts yet" sub="Create your first protected script"/>
        :(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Protection</th><th>Runs</th><th>Keys</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {scripts.map(s=>(
                  <tr key={s.id}>
                    <td>
                      <div style={{fontWeight:700,fontSize:13.5}}>{s.name}</div>
                      {s.description&&<div style={{fontSize:11.5,color:'var(--text3)',marginTop:2}}>{s.description}</div>}
                    </td>
                    <td>
                      {s.use_key_system?<span className="badge badge-blue">Key System</span>
                      :s.key_protected?<span className="badge badge-accent">Key Lock</span>
                      :<span className="badge badge-gray">Open</span>}
                    </td>
                    <td style={{fontWeight:700}}>{s.exec_count}</td>
                    <td>{(s.key_protected||s.use_key_system)?s.key_count:<span style={{color:'var(--text3)'}}>—</span>}</td>
                    <td><span className={`badge ${s.active?'badge-green':'badge-red'}`}>{s.active?'Active':'Off'}</span></td>
                    <td className="td-mono">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-xs btn-ghost" onClick={()=>setLsScript(s)} title="Get loadstring"><CodeIcon/></button>
                        {(s.key_protected||s.use_key_system)&&<button className="btn btn-xs btn-ghost" onClick={()=>router.push(`/dashboard/keys?scriptId=${s.id}`)} title="Keys"><KeyIcon/></button>}
                        <button className="btn btn-xs btn-ghost" onClick={()=>setEditScript(s)} title="Edit"><EditIcon/></button>
                        <button className="btn btn-xs btn-ghost" onClick={()=>toggle(s)} title={s.active?'Disable':'Enable'}>{s.active?<PauseIcon/>:<PlayIcon/>}</button>
                        <button className="btn btn-xs btn-danger" onClick={()=>del(s)} title="Delete"><TrashIcon/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate&&<ScriptModal onClose={()=>setShowCreate(false)} onDone={()=>{setShowCreate(false);load();toast('Script created!');}}/>}
      {editScript&&<ScriptModal script={editScript} onClose={()=>setEditScript(null)} onDone={()=>{setEditScript(null);load();toast('Script updated!');}}/>}
      {lsScript&&<LoadstringModal script={lsScript} loadstring={getLoadstring(lsScript)} onClose={()=>setLsScript(null)} siteUrl={siteUrl}/>}
    </Layout>
  );
}

function ScriptModal({script,onClose,onDone}) {
  const isEdit=!!script;
  const [form,setForm]=useState({name:script?.name||'',description:script?.description||'',script_content:'',key_protected:script?.key_protected||false,use_key_system:script?.use_key_system||false,active:script?.active!==false});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [loadingContent,setLoadingContent]=useState(isEdit);

  useEffect(()=>{
    if(isEdit){
      fetch(`/api/scripts/${script.id}`).then(r=>r.json()).then(d=>{
        setForm(f=>({...f,script_content:d.script?.script_content||''}));
        setLoadingContent(false);
      }).catch(()=>setLoadingContent(false));
    }
  },[]);

  async function submit(e) {
    e.preventDefault();setError('');setLoading(true);
    const url=isEdit?`/api/scripts/${script.id}`:'/api/scripts';
    const r=await fetch(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const d=await r.json();setLoading(false);
    if(!r.ok)return setError(d.error);
    onDone();
  }

  function setKS(v){setForm(f=>({...f,use_key_system:v,key_protected:v?false:f.key_protected}));}
  function setKP(v){setForm(f=>({...f,key_protected:v,use_key_system:v?false:f.use_key_system}));}

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:640}}>
        <div className="modal-title">{isEdit?'Edit Script':'New Script'}</div>
        <div className="modal-sub">{isEdit?'Update script or settings':'Upload your Lua to generate a protected loadstring'}</div>
        {error&&<div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Script Name</label><input className="form-input" placeholder="My Awesome Script" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
          <div className="form-group"><label className="form-label">Description <span style={{fontWeight:400,color:'var(--text3)'}}>(optional)</span></label><input className="form-input" placeholder="Brief description..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
          <div className="form-group">
            <label className="form-label">Script Content</label>
            <div className="form-hint">Paste your full Lua script. It is never exposed publicly.</div>
            {loadingContent?<div style={{padding:14,textAlign:'center'}}><span className="spinner"/></div>:<textarea className="form-input form-textarea large" placeholder="-- Your Lua script here" value={form.script_content} onChange={e=>setForm(f=>({...f,script_content:e.target.value}))} required/>}
          </div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Protection Mode</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <label className="check-row"><input type="checkbox" checked={form.key_protected} onChange={e=>setKP(e.target.checked)}/><div><div className="check-label">Key Protected</div><div className="check-hint">Users need a key you generate manually. Set script_key = "..." before the loadstring.</div></div></label>
              <label className="check-row"><input type="checkbox" checked={form.use_key_system} onChange={e=>setKS(e.target.checked)}/><div><div className="check-label">Built-in Key System</div><div className="check-hint">In-game menu appears — users complete tasks to receive a key automatically.</div></div></label>
              {isEdit&&<label className="check-row"><input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/><div><div className="check-label">Active</div></div></label>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading||loadingContent}>{loading?<span className="spinner" style={{width:14,height:14}}/>:isEdit?'Save Changes':'Create Script'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadstringModal({script,loadstring,onClose,siteUrl}) {
  const [copied,setCopied]=useState(false);
  function copy(){navigator.clipboard.writeText(loadstring);setCopied(true);setTimeout(()=>setCopied(false),2000);}
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">Loadstring — {script.name}</div>
        <div className="modal-sub">Share this with your users. The actual script is never in this file.</div>
        <div style={{position:'relative'}}><pre className="code-block">{loadstring}</pre><button className="code-copy-btn" onClick={copy}>{copied?'Copied':'Copy'}</button></div>
        <div className="alert alert-info" style={{marginTop:14,fontSize:12}}><strong>Loader URL:</strong> {siteUrl}/api/loader/{script.loader_key}.lua</div>
        <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

function EmptyState({icon,title,sub}){return(<div className="empty-state"><div className="empty-icon">{icon}</div><div className="empty-title">{title}</div><div className="empty-sub">{sub}</div></div>);}
function Plus(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;}
function CodeIcon(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;}
function KeyIcon(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L17 6l3 3-1.5 1.5"/></svg>;}
function EditIcon(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;}
function PauseIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;}
function PlayIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>;}
function TrashIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
