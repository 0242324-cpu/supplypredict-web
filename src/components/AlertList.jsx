import { fmtNum } from '../utils'
import StatusBadge from './StatusBadge'

export default function AlertList({ alerts, onSelect }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
          <span className="mono uppercase tracking-widest text-slate-400"
            style={{ fontSize:'10px' }}>Alertas — Comprar HOY</span>
        </div>
        <span className="mono text-slate-600" style={{ fontSize:'11px' }}>
          {alerts.length} productos
        </span>
      </div>

      {alerts.map((a, idx) => (
        <button key={a.product_id} onClick={() => onSelect(a.product_id)}
          className="data-row w-full text-left"
          style={{ borderBottom: idx < alerts.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>

          {/* Index */}
          <span className="mono text-slate-600 mr-4 w-4 text-right shrink-0"
            style={{ fontSize:'11px' }}>{idx+1}</span>

          {/* ID + nombre */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="mono text-slate-400" style={{ fontSize:'11px' }}>
                {a.product_id}
              </span>
              {a.categoria && (
                <span className="mono text-slate-600" style={{ fontSize:'10px' }}>
                  {a.categoria}
                </span>
              )}
            </div>
            <p className="text-white font-medium truncate" style={{ fontSize:'13px' }}>
              {a.nombre || a.product_id}
            </p>
          </div>

          {/* Datos */}
          <div className="flex items-center gap-6 ml-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="mono" style={{ fontSize:'10px', color:'#475569' }}>STOCK</p>
              <p className="mono font-medium"
                style={{ fontSize:'12px', color: a.stock_consolidado < 0 ? '#F43F5E' : '#94A3B8' }}>
                {fmtNum(a.stock_consolidado)}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <p className="mono" style={{ fontSize:'10px', color:'#475569' }}>LEAD</p>
              <p className="mono font-medium text-slate-400" style={{ fontSize:'12px' }}>
                {a.lead_time_days?.toFixed(0)}d
              </p>
            </div>
            <div className="text-right hidden md:block">
              <p className="mono" style={{ fontSize:'10px', color:'#475569' }}>COMPRAR</p>
              <p className="mono font-medium text-orange-400" style={{ fontSize:'12px' }}>
                {fmtNum(a.qty_recommended)}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>

        </button>
      ))}
    </div>
  )
}
