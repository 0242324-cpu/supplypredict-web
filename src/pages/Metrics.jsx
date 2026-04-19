import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Spinner from '../components/Spinner'
import { fmtNum } from '../utils'

const GRADE_COLOR = { A:'#34D399', B:'#60A5FA', C:'#FB923C', D:'#F43F5E' }
const GRADE_LABEL = { A:'< 20% — Excelente', B:'20-50% — Bueno', C:'50-100% — Regular', D:'> 100% — Malo' }

const BASE = import.meta.env.VITE_API_URL || ''

export default function Metrics() {
  const [data, setData]     = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/metrics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data)   return (
    <div className="flex items-center justify-center py-20 text-slate-600 mono" style={{ fontSize:'12px' }}>
      Métricas no disponibles
    </div>
  )

  const chartData = [
    { name:'A  <20%',  count: data.grades.A, fill: GRADE_COLOR.A },
    { name:'B  20-50%',count: data.grades.B, fill: GRADE_COLOR.B },
    { name:'C  50-100%',count: data.grades.C, fill: GRADE_COLOR.C },
    { name:'D  >100%', count: data.grades.D, fill: GRADE_COLOR.D },
  ]

  const filtered = filter === 'all'
    ? data.products
    : data.products.filter(p => p.grade === filter)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-white font-semibold" style={{ fontSize:'16px' }}>
          Desempeño del modelo Prophet
        </h1>
        <p className="text-slate-500 mt-1" style={{ fontSize:'12px' }}>
          Evaluado en las últimas 8 semanas de historial (test set). {data.total} productos.
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(data.grades).map(([grade, count]) => (
          <div key={grade} className="stat-card" style={{ borderLeftColor: GRADE_COLOR[grade] }}>
            <p className="mono uppercase tracking-widest mb-2"
              style={{ fontSize:'10px', color:'#475569' }}>
              Grade {grade} — {GRADE_LABEL[grade].split('—')[0].trim()}
            </p>
            <p className="font-semibold" style={{ fontSize:'22px', color: GRADE_COLOR[grade] }}>
              {count}
            </p>
            <p className="mt-1" style={{ fontSize:'11px', color:'#475569' }}>
              {Math.round(count/data.total*100)}% de productos
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico + explicación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <p className="mono uppercase tracking-widest mb-4 text-slate-400" style={{ fontSize:'10px' }}>
            Distribución MAPE
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill:'#475569', fontSize:10, fontFamily:'IBM Plex Mono' }}
                axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background:'#0D1420', border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'4px', fontSize:'11px', fontFamily:'IBM Plex Mono' }}
                itemStyle={{ color:'#94A3B8' }}
                formatter={(v) => [`${v} productos`, '']}
                labelStyle={{ color:'#64748B' }}
              />
              <Bar dataKey="count" radius={[2,2,0,0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <p className="mono uppercase tracking-widest text-slate-400" style={{ fontSize:'10px' }}>
            Interpretación
          </p>
          <div style={{ fontSize:'12px', color:'#94A3B8', lineHeight:'1.7' }}>
            <p><span style={{ color:'#34D399' }}>MAPE &lt; 20%</span> — El modelo predice con alta confianza. Usar para planificación exacta.</p>
            <p className="mt-2"><span style={{ color:'#60A5FA' }}>MAPE 20-50%</span> — Error tolerable. Útil para detectar tendencia y urgencia.</p>
            <p className="mt-2"><span style={{ color:'#FB923C' }}>MAPE 50-100%</span> — Alto error. Usar solo para clasificar prioridad, no para cifras exactas.</p>
            <p className="mt-2"><span style={{ color:'#F43F5E' }}>MAPE &gt; 100%</span> — Modelo no confiable. Causa probable: stock negativo distorsiona el historial de ventas.</p>
          </div>
          <div className="pt-2" style={{ borderTop:'1px solid rgba(255,255,255,0.06)', fontSize:'11px', color:'#475569' }}>
            Mediana global: <span className="mono text-slate-300">{data.mape_median}%</span>
            &nbsp;·&nbsp; Promedio: <span className="mono text-slate-300">{data.mape_mean}%</span>
          </div>
        </div>
      </div>

      {/* Tabla por producto */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span className="mono uppercase tracking-widest text-slate-400" style={{ fontSize:'10px' }}>
            MAPE por producto
          </span>
          <div className="flex gap-1">
            {['all','A','B','C','D'].map(g => (
              <button key={g} onClick={() => setFilter(g)}
                className="mono px-2 py-0.5 rounded transition-colors"
                style={{
                  fontSize:'10px',
                  background: filter===g ? (g==='all' ? 'rgba(255,255,255,0.1)' : `${GRADE_COLOR[g]}20`) : 'transparent',
                  color: filter===g ? (g==='all' ? '#E2E8F0' : GRADE_COLOR[g]) : '#475569',
                  border: `1px solid ${filter===g ? (g==='all' ? 'rgba(255,255,255,0.15)' : `${GRADE_COLOR[g]}40`) : 'transparent'}`,
                }}>
                {g === 'all' ? 'Todos' : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto" style={{ maxHeight:'400px', overflowY:'auto' }}>
          <table className="w-full">
            <thead style={{ position:'sticky', top:0, background:'#0D1420', zIndex:1 }}>
              <tr>
                {['Producto','Obs.','MAPE','MAE %','Grade'].map((h,i) => (
                  <th key={h} className={`py-2 px-3 mono uppercase text-slate-500 font-medium ${i>1?'text-right':'text-left'}`}
                    style={{ fontSize:'10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((p, i) => (
                <tr key={p.product_id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)',
                           background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td className="py-2 px-3 mono text-slate-400" style={{ fontSize:'11px' }}>
                    {p.product_id}
                  </td>
                  <td className="py-2 px-3 mono text-slate-600 text-right" style={{ fontSize:'11px' }}>
                    {p.n_obs}
                  </td>
                  <td className="py-2 px-3 mono text-right font-medium"
                    style={{ fontSize:'12px', color: GRADE_COLOR[p.grade] }}>
                    {p.mape < 500 ? `${p.mape.toFixed(1)}%` : '>500%'}
                  </td>
                  <td className="py-2 px-3 mono text-slate-500 text-right" style={{ fontSize:'11px' }}>
                    {p.mae_pct < 999 ? `${p.mae_pct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className="mono px-2 py-0.5 rounded"
                      style={{ fontSize:'10px', color: GRADE_COLOR[p.grade],
                               background:`${GRADE_COLOR[p.grade]}15`,
                               border:`1px solid ${GRADE_COLOR[p.grade]}30` }}>
                      {p.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 200 && (
          <div className="px-4 py-2 text-center mono text-slate-600" style={{ fontSize:'11px',
            borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            Mostrando 200 de {filtered.length} productos
          </div>
        )}
      </div>

    </main>
  )
}
