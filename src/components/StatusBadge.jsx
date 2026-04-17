export default function StatusBadge({ status }) {
  if (status === 'CRÍTICO') return <span className="badge-critical">❌ CRÍTICO</span>
  if (status === 'URGENTE') return <span className="badge-urgent">⚠️ URGENTE</span>
  return <span className="badge-normal">✓ OK</span>
}
