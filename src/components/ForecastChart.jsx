import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const fmt = v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ForecastChart({ forecast, reorderPoint }) {
  if (!forecast) return <div className="h-48 flex items-center justify-center text-slate-600 text-sm">Sin datos de forecast</div>

  const data = forecast.dates.map((d, i) => ({
    date: d.slice(5),
    yhat: Math.round(forecast.yhat[i]),
    lower: Math.round(forecast.yhat_lower[i]),
    upper: Math.round(forecast.yhat_upper[i]),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gGray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#64748B" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#64748B" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
        <Tooltip content={<CustomTooltip />} />
        {reorderPoint && <ReferenceLine y={reorderPoint} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Reorden', fill: '#EF4444', fontSize: 10 }} />}
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#gGray)" name="Máx" />
        <Area type="monotone" dataKey="yhat"  stroke="#3B82F6" strokeWidth={2} fill="url(#gBlue)" name="Forecast" dot={{ fill:'#3B82F6', r:3 }} />
        <Area type="monotone" dataKey="lower" stroke="none" fill="url(#gGray)" name="Mín" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
