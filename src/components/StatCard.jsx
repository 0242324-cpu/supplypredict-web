export default function StatCard({ label, value, sub, accent = '#3B82F6' }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: accent }}>
      <p className="mono uppercase tracking-widest mb-2"
        style={{ fontSize:'10px', color:'#475569', letterSpacing:'0.08em' }}>
        {label}
      </p>
      <p className="font-semibold text-white" style={{ fontSize:'22px', lineHeight:1 }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1.5" style={{ fontSize:'11px', color:'#475569' }}>{sub}</p>
      )}
    </div>
  )
}
