import { fmtNum } from '../utils'
import StatusBadge from './StatusBadge'

export default function AlertList({ alerts, onSelect }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Alertas — Comprar HOY</h2>
        <span className="text-xs text-slate-500 font-mono">{alerts.length} productos</span>
      </div>
      <div className="space-y-2">
        {alerts.map(a => (
          <button key={a.product_id} onClick={() => onSelect(a.product_id)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 transition-colors group text-left">
            <div>
              <p className="font-mono text-xs text-slate-400">{a.product_id}</p>
              <p className="text-sm text-white group-hover:text-accent transition-colors font-medium">{a.nombre || a.product_id}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {a.categoria && <span className="mr-2 text-slate-400">{a.categoria}</span>}
                Stock: <span className={a.stock_consolidado < 0 ? 'text-red-400' : 'text-slate-300'}>{fmtNum(a.stock_consolidado)}</span>
                &nbsp;·&nbsp;Lead: {a.lead_time_days?.toFixed(0)}d
                {a.qty_recommended > 0 && <>&nbsp;·&nbsp;Comprar: <span className="text-orange-400">{fmtNum(a.qty_recommended)}</span></>}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </button>
        ))}
      </div>
    </div>
  )
}
