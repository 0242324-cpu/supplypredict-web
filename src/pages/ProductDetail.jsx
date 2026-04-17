import { useState, useEffect } from 'react'
import StatusBadge from '../components/StatusBadge'
import ForecastChart from '../components/ForecastChart'
import Spinner from '../components/Spinner'
import { getProduct } from '../api'

const fmt = v => v == null ? '—' : Number(v).toLocaleString()

function InfoCard({ label, value, sub, highlight }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function ProductDetail({ productId, onBack }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProduct(productId).then(d => { setData(d); setLoading(false) })
  }, [productId])

  if (loading) return <Spinner />
  if (!data?.product) return <div className="text-center py-20 text-slate-500">Producto no encontrado</div>

  const { product: p, forecast, recommendation: rec } = data

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition-colors">← Volver</button>
        <div className="h-4 w-px bg-slate-700" />
        <div>
          <p className="font-mono text-xs text-slate-500">{p.product_id}</p>
          {p.nombre && p.nombre !== p.product_id && <p className="text-white font-medium">{p.nombre}</p>}
        </div>
        {p.categoria && <span className="text-xs text-slate-400 border border-slate-700 rounded-full px-2.5 py-0.5">{p.categoria}</span>}
        <StatusBadge status={p.status} />
      </div>

      {/* Recommendation / Orden abierta */}
      {rec && (
        <div className={`card border ${rec.urgency === 'ORDEN_ABIERTA'
          ? 'border-blue-500/20 bg-blue-500/5'
          : 'border-red-500/20 bg-red-500/5'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`font-semibold text-sm mb-1 ${rec.urgency === 'ORDEN_ABIERTA' ? 'text-blue-400' : 'text-red-400'}`}>
                {rec.urgency === 'ORDEN_ABIERTA' ? '📦' : '⚡'} {rec.action}
              </p>
              <p className="text-slate-400 text-xs">{rec.reason}</p>
              {p.orden_proveedor && <p className="text-slate-500 text-xs mt-1">Proveedor: {p.orden_proveedor}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 mb-0.5">{rec.urgency === 'ORDEN_ABIERTA' ? 'Cantidad ordenada' : 'Cantidad sugerida'}</p>
              <p className={`text-xl font-bold font-mono ${rec.urgency === 'ORDEN_ABIERTA' ? 'text-blue-400' : 'text-orange-400'}`}>{fmt(rec.qty_suggested)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoCard label="Stock GDL" value={fmt(p.current_stock)} highlight={p.current_stock < 0} sub="solo CEDIS principal" />
        <InfoCard label="Stock Total" value={fmt(p.stock_consolidado)} highlight={p.stock_consolidado < 0} sub="todos los almacenes" />
        <InfoCard label="Lead Time" value={`${p.lead_time_days?.toFixed(0)}d`} sub="último registrado" />
        <InfoCard label="Cobertura" value={p.days_coverage > 999 ? '∞' : `${p.days_coverage?.toFixed(1)}d`}
          highlight={p.days_coverage < p.lead_time_days} sub="días restantes" />
      </div>

      {/* Forecast */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Pronóstico — Próximas 5 semanas</h2>
          <span className="text-xs text-slate-500 font-mono">Prophet · IC 95%</span>
        </div>
        <ForecastChart forecast={forecast} reorderPoint={p.reorder_point} />
      </div>

      {/* Stats extra */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Venta Diaria Prom.</p>
          <p className="text-2xl font-bold font-mono text-white">{fmt(p.avg_daily_sales)}</p>
          <p className="text-xs text-slate-500 mt-1">{p.unidad || 'unidades'} / día · solo GDL</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Safety Stock</p>
          <p className="text-2xl font-bold font-mono text-white">{fmt(p.safety_stock)}</p>
          <p className="text-xs text-slate-500 mt-1">buffer de seguridad (1.5σ)</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Punto de Reorden</p>
          <p className="text-2xl font-bold font-mono text-accent">{fmt(p.reorder_point)}</p>
          <p className="text-xs text-slate-500 mt-1">demanda × lead time + safety</p>
        </div>
      </div>

      {/* Proveedor info */}
      {p.proveedor && (
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Info Proveedor</p>
          <div className="flex gap-8">
            <div><p className="text-xs text-slate-500">Proveedor principal</p><p className="text-sm text-white">{p.proveedor}</p></div>
            {p.lead_time_acordado && <div><p className="text-xs text-slate-500">Lead time acordado</p><p className="text-sm text-white">{p.lead_time_acordado} días</p></div>}
          </div>
        </div>
      )}
    </main>
  )
}
