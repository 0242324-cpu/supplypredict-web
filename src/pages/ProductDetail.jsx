import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import { getProduct } from '../api'
import { fmtNum } from '../utils'

const InfoCard = ({ label, value, sub, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color || '#3B82F6' }}>
    <p className="mono uppercase tracking-widest mb-2"
      style={{ fontSize:'10px', color:'#475569' }}>{label}</p>
    <p className="font-semibold" style={{ fontSize:'20px', lineHeight:1, color: color || '#E2E8F0' }}>
      {value}
    </p>
    {sub && <p className="mt-1.5" style={{ fontSize:'11px', color:'#475569' }}>{sub}</p>}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0D1420', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:'4px', padding:'8px 12px', fontSize:'11px', fontFamily:'IBM Plex Mono' }}>
      <p style={{ color:'#475569', marginBottom:'4px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ProductDetail({ productId, onBack }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProduct(productId).then(d => { setData(d); setLoading(false) })
  }, [productId])

  if (loading) return <Spinner />
  if (!data?.product) return (
    <div className="flex items-center justify-center py-20 text-slate-600 mono" style={{ fontSize:'12px' }}>
      Producto no encontrado
    </div>
  )

  const { product: p, forecast, recommendation: rec } = data

  const chartData = forecast?.dates.map((d, i) => ({
    date: d.slice(5),
    yhat:       Math.round(forecast.yhat[i]),
    yhat_lower: Math.round(forecast.yhat_lower[i]),
    yhat_upper: Math.round(forecast.yhat_upper[i]),
  })) || []

  const isOrden = rec?.urgency === 'ORDEN_ABIERTA'

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="mono text-slate-500 hover:text-white transition-colors"
          style={{ fontSize:'12px' }}>← volver</button>
        <span className="text-slate-700">/</span>
        <span className="mono text-slate-400" style={{ fontSize:'12px' }}>{p.product_id}</span>
        {p.categoria && (
          <>
            <span className="text-slate-700">/</span>
            <span className="mono text-slate-600" style={{ fontSize:'11px' }}>{p.categoria}</span>
          </>
        )}
        <StatusBadge status={p.status} />
      </div>

      {/* Nombre */}
      <div>
        <h1 className="text-white font-semibold" style={{ fontSize:'18px' }}>
          {p.nombre || p.product_id}
        </h1>
        {p.proveedor && (
          <p className="mono text-slate-500 mt-1" style={{ fontSize:'12px' }}>
            {p.proveedor}
            {p.lead_time_acordado ? ` · Lead acordado: ${p.lead_time_acordado}d` : ''}
          </p>
        )}
      </div>

      {/* Recomendación */}
      {rec && (
        <div style={{
          background: isOrden ? 'rgba(96,165,250,0.05)' : 'rgba(244,63,94,0.05)',
          border: `1px solid ${isOrden ? 'rgba(96,165,250,0.2)' : 'rgba(244,63,94,0.2)'}`,
          borderRadius:'6px', padding:'1rem 1.25rem'
        }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold mb-1" style={{
                fontSize:'13px',
                color: isOrden ? '#60A5FA' : '#F43F5E'
              }}>
                {rec.action}
              </p>
              <p style={{ fontSize:'12px', color:'#64748B' }}>{rec.reason}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="mono" style={{ fontSize:'10px', color:'#475569', marginBottom:'2px' }}>
                {isOrden ? 'CANTIDAD ORDENADA' : 'CANTIDAD SUGERIDA'}
              </p>
              <p className="mono font-semibold" style={{
                fontSize:'20px',
                color: isOrden ? '#60A5FA' : '#FB923C'
              }}>
                {fmtNum(rec.qty_suggested)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard label="Stock GDL" value={fmtNum(p.current_stock)}
          color={p.current_stock < 0 ? '#F43F5E' : '#94A3B8'} sub="CEDIS principal" />
        <InfoCard label="Stock total" value={fmtNum(p.stock_consolidado)}
          color={p.stock_consolidado < 0 ? '#F43F5E' : '#E2E8F0'} sub="todos los almacenes" />
        <InfoCard label="Lead time" value={`${p.lead_time_days?.toFixed(0)}d`}
          color="#60A5FA" sub="último registrado" />
        <InfoCard label="Cobertura" value={p.days_coverage > 999 ? '∞' : `${p.days_coverage?.toFixed(1)}d`}
          color={p.days_coverage < p.lead_time_days ? '#F43F5E' : '#34D399'}
          sub="días de stock restantes" />
      </div>

      {/* Forecast chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="mono uppercase tracking-widest text-slate-400" style={{ fontSize:'10px' }}>
            Pronóstico de demanda — próximas 5 semanas
          </p>
          <span className="mono text-slate-600" style={{ fontSize:'10px' }}>
            Prophet · IC 95%
          </span>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top:5, right:5, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date"
                tick={{ fill:'#475569', fontSize:10, fontFamily:'IBM Plex Mono' }}
                axisLine={false} tickLine={false} />
              <YAxis width={48}
                tick={{ fill:'#475569', fontSize:10, fontFamily:'IBM Plex Mono' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v>=1000?`${(v/1000).toFixed(0)}k`:v} />
              <Tooltip content={<CustomTooltip />} />
              {p.reorder_point > 0 && (
                <ReferenceLine y={p.reorder_point} stroke="#F43F5E" strokeDasharray="4 2"
                  label={{ value:'Reorden', fill:'#F43F5E', fontSize:10, fontFamily:'IBM Plex Mono' }} />
              )}
              <Area type="monotone" dataKey="yhat_upper" stroke="none" fill="rgba(59,130,246,0.05)" name="Máx" />
              <Area type="monotone" dataKey="yhat" stroke="#3B82F6" strokeWidth={2}
                fill="url(#gBlue)" name="Forecast" dot={{ fill:'#3B82F6', r:3 }} />
              <Area type="monotone" dataKey="yhat_lower" stroke="none" fill="rgba(59,130,246,0.05)" name="Mín" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="mono text-slate-600 text-center py-8" style={{ fontSize:'12px' }}>
            Sin datos de forecast
          </p>
        )}
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-3 gap-3">
        <InfoCard label="Venta diaria prom." value={fmtNum(p.avg_daily_sales)}
          sub={`${p.unidad||'unidades'} / día · GDL`} />
        <InfoCard label="Safety stock" value={fmtNum(p.safety_stock)}
          sub="buffer 1.5σ" />
        <InfoCard label="Punto de reorden" value={fmtNum(p.reorder_point)}
          color="#3B82F6" sub="demanda × lead + safety" />
      </div>

    </main>
  )
}
