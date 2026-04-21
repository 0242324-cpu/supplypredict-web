import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fmtNum } from '../utils'
import { metricsData } from '../api'

const GRADE_COLOR = { A:'#34D399', B:'#60A5FA', C:'#FB923C', D:'#F43F5E' }
const GRADE_LABEL = { A:'< 20% — Excelente', B:'20-50% — Bueno', C:'50-100% — Regular', D:'> 100% — Malo' }

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
    [filter]
  )

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-white font-semibold" style={{ fontSize:'16px' }}>
          Desempeño del modelo Prophet
        </h1>
        <p className="text-slate-500 mt-1" style={{ fontSize:'12px' }}>
          Cobertura de stock vs lead time. {data.total} productos analizados.
        </p>
      </div>

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
            />
            <Bar dataKey="count" radius={[3,3,0,0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
                {['Producto','Categoría','Cobertura/Lead','Grade'].map(h => (
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
                  <td className="mono py-2 px-3 text-slate-600" style={{ fontSize:'10px' }}>—</td>
                  <td className="mono py-2 px-3 text-slate-400" style={{ fontSize:'11px' }}>{p.coverage_ratio.toFixed(2)}×</td>
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
    </main>
  )
}
