import { useState, useEffect } from 'react'

export default function Header({ onHome, onMetrics, page, alertCount }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const fmt = d => d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <header style={{ background:'#080C14', borderBottom:'1px solid rgba(255,255,255,0.06)' }}
      className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-6">
          <button onClick={onHome} className="flex items-center gap-2.5 group">
            <div style={{ background:'#1D4ED8', borderRadius:'3px' }}
              className="w-6 h-6 flex items-center justify-center">
              <span className="mono text-white font-medium" style={{ fontSize:'10px' }}>SP</span>
            </div>
            <span className="font-semibold text-white tracking-tight" style={{ fontSize:'13px' }}>
              SupplyPredict
            </span>
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <button onClick={onHome}
              className="px-3 py-1 rounded text-xs transition-colors"
              style={{ color: page==='dashboard' ? '#E2E8F0' : '#64748B',
                       background: page==='dashboard' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
              Dashboard
            </button>
            <button onClick={onMetrics}
              className="px-3 py-1 rounded text-xs transition-colors"
              style={{ color: page==='metrics' ? '#E2E8F0' : '#64748B',
                       background: page==='metrics' ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
              Métricas del modelo
            </button>
          </nav>
        </div>

        {/* Status right */}
        <div className="flex items-center gap-4">
          {alertCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
              <span className="mono text-critical" style={{ fontSize:'11px' }}>
                {alertCount} críticos
              </span>
            </div>
          )}
          <span className="mono text-slate-600" style={{ fontSize:'11px' }}>
            {fmt(time)}
          </span>
        </div>

      </div>
    </header>
  )
}
