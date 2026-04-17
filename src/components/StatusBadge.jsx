export default function StatusBadge({ status }) {
  const map = {
    'CRÍTICO':      { cls: 'badge-critical', label: '❌ CRÍTICO' },
    'URGENTE':      { cls: 'badge-urgent',   label: '⚠️ URGENTE' },
    'NORMAL':       { cls: 'badge-normal',   label: '✓ OK' },
    'ORDEN_ABIERTA':{ cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2.5 py-0.5 text-xs font-medium font-mono', label: '📦 EN ORDEN' },
  }
  const { cls, label } = map[status] || map['NORMAL']
  return <span className={cls}>{label}</span>
}
