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
  const [data, setData] = useState(null)
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
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
          ← Volver
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <h1 className="font-mono text-sm text-slate-300">{p.product_id}</h1>
        <StatusBadge status={p.status} />
      </div>

      {/* Recommendation banner */}
      {rec && (
        <div className="card border border-red-500/20 bg-red-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-red-400 font-semibold text-sm mb-1">⚡ {rec.action}</p>
              <p className="text-slate-400 text-xs">{rec.reason}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500 mb-0.5">Cantidad sugerida</p>
              <p className="text-xl font-bold font-mono text-orange-400">{fmt(rec.qty_suggested)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoCard label="Stock Actual" value={fmt(p.current_stock)} highlight={p.current_stock < 0} sub="unidades" />
        <InfoCard label="Punto Reorden" value={fmt(p.reorder_point)} sub="unidades" />
        <InfoCard label="Lead Time" value={`${p.lead_time_days?.toFixed(0)}d`} sub="días promedio" />
        <InfoCard label="Cobertura" value={p.days_coverage > 999 ? '∞' : `${p.days_coverage?.toFixed(1)}d`}
          highlight={p.days_coverage < p.lead_time_days} sub="días restantes" />
      </div>

      {/* Forecast chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Pronóstico — Próximas 5 semanas</h2>
          <span className="text-xs text-slate-500 font-mono">Prophet · IC 95%</span>
        </div>
        <ForecastChart forecast={forecast} reorderPoint={p.reorder_point} />
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Venta Diaria Prom.</p>
          <p className="text-2xl font-bold font-mono text-white">{fmt(p.avg_daily_sales)}</p>
          <p className="text-xs text-slate-500 mt-1">unidades / día</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Safety Stock</p>
          <p className="text-2xl font-bold font-mono text-white">{fmt(p.safety_stock)}</p>
          <p className="text-xs text-slate-500 mt-1">buffer de seguridad</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Forecast 30d</p>
          <p className="text-2xl font-bold font-mono text-accent">{fmt(p.forecast_next_30d)}</p>
          <p className="text-xs text-slate-500 mt-1">demanda estimada</p>
        </div>
      </div>
    </main>
  )
}
