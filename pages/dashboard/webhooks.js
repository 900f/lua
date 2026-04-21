import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast, ToastContainer } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import { getCookie } from 'cookies-next';
import { verifyToken } from '../../lib/auth';

const EVENT_OPTIONS = [
  { id:'execution', label:'Script Execution', desc:'Fired on every script run, success or failure' },
  { id:'key_used',  label:'Key Used',         desc:'Fired when a key is consumed' },
  { id:'ip_banned', label:'IP Banned',        desc:'Fired when an IP is banned' },
  { id:'key_expired',label:'Key Expired',     desc:'Fired when a key expires on use' },
];

export default function Webhooks({ user }) {
  const { toasts, toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const r = await fetch('/api/webhooks');
    const d = await r.json();
    setWebhooks(d.webhooks||[]);
    setLoading(false);
  }

  async function del(id) {
    const ok = await confirm({
      title: 'Delete webhook',
      message: 'This webhook URL will stop receiving events.',
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;
    const r = await fetch(`/api/webhooks/${id}`,{method:'DELETE'});
    if (r.ok) { toast('Webhook deleted.'); load(); } else toast('Failed.','error');
  }

  async function toggle(id, active) {
    const r = await fetch(`/api/webhooks/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!active})});
    if (r.ok) { toast(active?'Webhook disabled.':'Webhook enabled.'); load(); } else toast('Failed.','error');
  }

  return (
    <Layout user={user}>
      <ToastContainer toasts={toasts}/>
      {ConfirmDialog}
      <div className="page-header">
        <div>
          <div className="page-title">Webhooks</div>
          <div className="page-sub">Receive real-time POST notifications when events occur on your scripts</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus/>Add Webhook</button>
      </div>

      <div className="alert alert-info" style={{marginBottom:20}}>
        Luvenn sends a JSON POST to your URL when events fire. Payloads include script name, player, IP, key used, and timestamp.
      </div>

      <div className="card">
        {loading ? <div style={{padding:56,textAlign:'center'}}><span className="spinner"/></div>
        : webhooks.length===0 ? (
          <div className="empty-state">
            <div className="empty-icon"><WebhookIcon/></div>
            <div className="empty-title">No webhooks</div>
            <div className="empty-sub">Add a webhook URL to receive real-time event notifications</div>
            <div className="empty-action"><button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus/>Add Webhook</button></div>
          </div>
        ) : (
          <div>
            {webhooks.map(wh=>(
              <div key={wh.id} className="webhook-row">
                <div style={{flex:1,minWidth:0}}>
                  <div className="webhook-url">{wh.url}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>
                    {(wh.events||[]).map(e=><span key={e} className="badge badge-accent" style={{fontSize:10}}>{e}</span>)}
                  </div>
                </div>
                <span className={`badge ${wh.active?'badge-green':'badge-gray'}`}>{wh.active?'Active':'Off'}</span>
                <div className="row-actions">
                  <button className="btn btn-xs btn-ghost" onClick={()=>toggle(wh.id,wh.active)}>{wh.active?<PauseIcon/>:<PlayIcon/>}</button>
                  <button className="btn btn-xs btn-danger" onClick={()=>del(wh.id)}><TrashIcon/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card card-pad" style={{marginTop:16}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Payload Format</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:14}}>Example JSON body sent to your webhook URL</div>
        <pre className="code-block">{`{
  "event": "execution",
  "script_name": "My Script",
  "roblox_name": "PlayerOne",
  "ip_address": "203.0.113.1",
  "key_used": "abc123...",
  "hwid": "ABC123...",
  "success": true,
  "fail_reason": null,
  "executed_at": "2025-01-15T12:00:00Z"
}`}</pre>
      </div>

      {showAdd && <AddWebhookModal onClose={()=>setShowAdd(false)} onDone={()=>{setShowAdd(false);load();toast('Webhook added!');}}/>}
    </Layout>
  );
}

function AddWebhookModal({onClose,onDone}) {
  const [url,setUrl]=useState('');
  const [events,setEvents]=useState(['execution']);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  function toggleEvent(id){setEvents(ev=>ev.includes(id)?ev.filter(e=>e!==id):[...ev,id]);}
  async function submit(e) {
    e.preventDefault();setError('');setLoading(true);
    const r=await fetch('/api/webhooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,events})});
    const d=await r.json();setLoading(false);
    if(!r.ok)return setError(d.error);
    onDone();
  }
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">Add Webhook</div>
        <div className="modal-sub">Enter your HTTPS endpoint and select which events to subscribe to.</div>
        {error&&<div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Webhook URL</label>
            <div className="form-hint">Must be a valid HTTPS URL. We'll POST JSON to this endpoint.</div>
            <input className="form-input" type="url" placeholder="https://your-server.com/webhook" value={url} onChange={e=>setUrl(e.target.value)} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Events</label>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
              {EVENT_OPTIONS.map(ev=>(
                <label key={ev.id} className="check-row">
                  <input type="checkbox" checked={events.includes(ev.id)} onChange={()=>toggleEvent(ev.id)}/>
                  <div><div className="check-label">{ev.label}</div><div className="check-hint">{ev.desc}</div></div>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading||events.length===0}>{loading?<span className="spinner" style={{width:14,height:14}}/>:'Add Webhook'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Plus(){return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;}
function PauseIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;}
function PlayIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>;}
function TrashIcon(){return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;}
function WebhookIcon(){return <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 012 17c.01-.7.2-1.4.57-2"/><path d="M6 17l3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 116.89-4.06"/><path d="M12 6a4 4 0 014 4c0 .67-.16 1.3-.44 1.86L19 17"/></svg>;}

export async function getServerSideProps({ req, res }) {
  const { getCookie } = require('cookies-next');
  const { verifyToken } = require('../../lib/auth');
  const token = getCookie('lv_token', { req, res });
  const user = token ? verifyToken(token) : null;
  if (!user) return { redirect:{ destination:'/login', permanent:false } };
  return { props:{ user:{ id:user.id, email:user.email, username:user.username } } };
}
