export default function StatCard({ label, value, sub, color = 'default' }) {
  const accent = { red: 'text-red-400', blue: 'text-accent', green: 'text-green-400', default: 'text-white' }
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-bold ${accent[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
