export default function StatusBadge({ status }) {
  const map = {
    'CRÍTICO':       { cls: 'badge badge-critical', label: 'CRÍTICO' },
    'URGENTE':       { cls: 'badge badge-urgent',   label: 'URGENTE' },
    'NORMAL':        { cls: 'badge badge-normal',   label: 'OK' },
    'ORDEN_ABIERTA': { cls: 'badge badge-order',    label: 'EN ORDEN' },
  }
  const { cls, label } = map[status] || map['NORMAL']
  return <span className={cls}>{label}</span>
}
