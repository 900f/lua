import { useState, useEffect, useRef } from 'react';

// Custom confirm dialog - replaces browser alert/confirm
export function useConfirm() {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  function confirm({ title, message, confirmLabel = 'Confirm', confirmClass = 'btn-danger', cancelLabel = 'Cancel' }) {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setState({ title, message, confirmLabel, confirmClass, cancelLabel });
    });
  }

  function handleConfirm() {
    resolveRef.current?.(true);
    setState(null);
  }
  function handleCancel() {
    resolveRef.current?.(false);
    setState(null);
  }

  const ConfirmDialog = state ? (
    <div className="modal-overlay" style={{zIndex:600}} onClick={e => e.target === e.currentTarget && handleCancel()}>
      <div className="modal modal-sm" style={{maxWidth:380}}>
        <div className="modal-title" style={{fontSize:15}}>{state.title}</div>
        {state.message && <div style={{fontSize:13.5,color:'var(--text2)',marginTop:8,marginBottom:4,lineHeight:1.55}}>{state.message}</div>}
        <div className="modal-footer" style={{marginTop:16,paddingTop:14}}>
          <button className="btn btn-secondary" onClick={handleCancel}>{state.cancelLabel}</button>
          <button className={`btn ${state.confirmClass}`} onClick={handleConfirm}>{state.confirmLabel}</button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmDialog };
}

// Custom select/dropdown as a modal for mobile-friendly selection
export function SelectModal({ title, options, value, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" style={{maxWidth:360,padding:0,overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontWeight:700,fontSize:14}}>{title}</div>
        </div>
        <div style={{maxHeight:320,overflowY:'auto'}}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); onClose(); }}
              style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                width:'100%',padding:'13px 20px',
                background: value === opt.value ? 'var(--accent-light)' : 'transparent',
                border:'none',borderBottom:'1px solid var(--border)',
                cursor:'pointer',textAlign:'left',transition:'background .1s',
                color: value === opt.value ? 'var(--accent)' : 'var(--text)',
                fontSize:13.5,fontWeight: value === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
              {value === opt.value && (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        <div style={{padding:'12px 20px',borderTop:'1px solid var(--border)'}}>
          <button className="btn btn-secondary btn-sm" style={{width:'100%',justifyContent:'center'}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
