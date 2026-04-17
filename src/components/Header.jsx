export default function Header({ onHome, alertCount }) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold">SP</div>
          <span className="font-semibold text-white tracking-tight">SupplyPredict</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-mono">{alertCount} alertas activas</span>
        </div>
      </div>
    </header>
  )
}
