// Formatea números siempre como enteros con comas (estilo MX/US)
export const fmtNum = (v) => {
  if (v == null || isNaN(v)) return '—'
  return Math.round(v).toLocaleString('en-US')
}

// Para días/lead time (1 decimal máximo)
export const fmtDays = (v) => {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toFixed(0) + 'd'
}
