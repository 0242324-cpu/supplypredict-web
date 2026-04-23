import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fmtNum } from '../utils'
import { metricsData } from '../api'

const GRADE_COLOR = { A:'#34D399', B:'#60A5FA', C:'#FB923C', D:'#F43F5E' }
const GRADE_LABEL = {
  A:'< 20% — Excelente',
  B:'20–50% — Aceptable',
  C:'50–100% — Regular',
  D:'> 100% — Necesita mejora'
}

export default function Metrics() {
  const [filter, setFilter] = useState('all')
  const data = metricsData

  const chartData = [
    { name:'A  <20%',   count: data.grades.A, fill: GRADE_COLOR.A },
    { name:'B  20-50%', count: data.grades.B, fill: GRADE_COLOR.B },
    { name:'C  50-100%',count: data.grades.C, fill: GRADE_COLOR.C },
    { name:'D  >100%',  count: data.grades.D, fill: GRADE_COLOR.D },
  ]

  const filtered = useMemo(() =>
    filter === 'all' ? data.products : data.products.filter(p => p.grade === filter),
    [filter, data.products]
  )

  const pctUsable = data.total > 0
    ? (((data.grades.A || 0) + (data.grades.B || 0) + (data.grades.C || 0)) / data.total * 100).toFixed(0)
    : 0
  const countUsable = (data.grades.A || 0) + (data.grades.B || 0) + (data.grades.C || 0)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-white font-semibold" style={{ fontSize:'16px' }}>
          Precisión del modelo Prophet (MAPE)
        </h1>
        <p className="text-slate-500 mt-1" style={{ fontSize:'12px' }}>
          Error porcentual absoluto medio por producto. {data.total} modelos evaluados.
          {data.mape_median != null && <> Mediana: {data.mape_median}%.</>}
        </p>
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(data.grades).map(([grade, count]) => (
          <div key={grade} className="stat-card" style={{ borderLeftColor: GRADE_COLOR[grade] }}>
            <p className="mono uppercase tracking-widest mb-2"
              style={{ fontSize:'10px', color:'#475569' }}>
              Grade {grade} — {GRADE_LABEL[grade].split('—')[0].trim()}
            </p>
            <p className="text-white font-semibold" style={{ fontSize:'24px', lineHeight:1 }}>
              {count}
            </p>
            <p className="mt-1" style={{ fontSize:'11px', color:'#475569' }}>
              {GRADE_LABEL[grade].split('—')[1]?.trim()}
            </p>
          </div>
        ))}
      </div>

      {/* Summary insight */}
      <div className="card" style={{ borderLeft: '3px solid #60A5FA' }}>
        <p style={{ fontSize:'12px', color:'#94A3B8', lineHeight: 1.6 }}>
          <strong style={{ color: '#E2E8F0' }}>{pctUsable}%</strong> de los productos ({countUsable} de {data.total})
          {' '}tienen MAPE {'<'} 100%, lo que significa predicciones utilizables para decisiones de compra.
          Los {data.grades.D||0} productos Grade D presentan demanda esporádica o altamente volátil
          donde cualquier modelo estadístico tiene limitaciones inherentes.
        </p>
      </div>

      {/* Bar chart */}
      <div className="card">
        <p className="mono uppercase tracking-widest text-slate-400 mb-4" style={{ fontSize:'10px' }}>
          Distribución por grade
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top:0, right:0, left:0, bottom:0 }}>
            <XAxis dataKey="name" tick={{ fill:'#475569', fontSize:10, fontFamily:'IBM Plex Mono' }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'#475569', fontSize:10, fontFamily:'IBM Plex Mono' }}
              axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background:'#0D1420', border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'4px', fontSize:'11px', fontFamily:'IBM Plex Mono' }}
              labelStyle={{ color:'#475569' }}
              itemStyle={{ color:'#E2E8F0' }}
              formatter={(value) => [`${value} productos`, 'Cantidad']}
            />
            <Bar dataKey="count" radius={[3,3,0,0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span className="mono uppercase tracking-widest text-slate-400" style={{ fontSize:'10px' }}>
            Detalle por producto
          </span>
          <div className="flex gap-1 ml-auto">
            {['all','A','B','C','D'].map(g => (
              <button key={g} onClick={() => setFilter(g)}
                className="mono"
                style={{
                  fontSize:'10px', padding:'3px 8px', borderRadius:'4px', cursor:'pointer',
                  border:`1px solid ${filter===g ? (GRADE_COLOR[g]||'#E2E8F0') : 'rgba(255,255,255,0.1)'}`,
                  background: filter===g ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: filter===g ? (GRADE_COLOR[g]||'#E2E8F0') : '#475569',
                }}>
                {g==='all'?'Todos':g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ maxHeight:'400px', overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Producto','Categoría','MAPE','Obs.','Grade'].map(h => (
                  <th key={h} className="mono uppercase tracking-widest py-2 px-3 text-left"
                    style={{ fontSize:'10px', color:'#475569', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'#111827' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.product_id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td className="mono py-2 px-3 text-slate-400" style={{ fontSize:'11px' }}>{p.product_id}</td>
                  <td className="mono py-2 px-3 text-slate-600" style={{ fontSize:'10px' }}>{p.categoria || '—'}</td>
                  <td className="mono py-2 px-3" style={{
                    fontSize:'11px',
                    color: p.mape < 50 ? '#34D399' : p.mape < 100 ? '#FB923C' : '#F43F5E'
                  }}>
                    {p.mape >= 999 ? '>999%' : `${p.mape.toFixed(1)}%`}
                  </td>
                  <td className="mono py-2 px-3 text-slate-500" style={{ fontSize:'10px' }}>{p.n_obs}</td>
                  <td className="py-2 px-3">
                    <span className="mono" style={{ fontSize:'11px', color: GRADE_COLOR[p.grade] }}>
                      {p.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology note */}
      <div className="card" style={{ borderLeft: '3px solid #475569' }}>
        <p className="mono uppercase tracking-widest text-slate-500 mb-2" style={{ fontSize:'10px' }}>
          Metodología
        </p>
        <p style={{ fontSize:'11px', color:'#64748B', lineHeight: 1.6 }}>
          MAPE (Mean Absolute Percentage Error) mide la diferencia porcentual entre la predicción Prophet
          y la demanda real, calculado con validación train/test split.
          Productos con demanda intermitente (semanas con ventas cero alternando con picos altos)
          generan MAPE elevados inherentemente — esto es una limitación conocida de la métrica MAPE, no
          necesariamente del modelo. Para estos casos, el intervalo de confianza al 95% que muestra el
          gráfico de forecast es más útil que el punto central de predicción.
        </p>
      </div>
    </main>
  )
}
