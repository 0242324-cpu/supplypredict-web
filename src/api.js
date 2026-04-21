import { DATA } from './data.js'

const { dashboard, products, metrics } = DATA

// ── Helpers ────────────────────────────────────────────────────────────────
function filterProducts({ search = '', status = '', categoria = '' }) {
  return products.filter(p => {
    const matchStatus = !status || p.status === status
    const matchCat    = !categoria || p.categoria === categoria
    const matchSearch = !search ||
      p.product_id.toLowerCase().includes(search.toLowerCase()) ||
      p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })
}

// ── API surface (same signatures as before) ────────────────────────────────
export async function getDashboard() {
  return dashboard
}

export async function getProducts({ page = 1, limit = 15, search = '', status = '', categoria = '' } = {}) {
  const filtered = filterProducts({ search, status, categoria })
  const total = filtered.length
  const total_pages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), total_pages)
  const slice = filtered.slice((safePage - 1) * limit, safePage * limit)
  return { products: slice, total, page: safePage, per_page: limit, total_pages }
}

export async function getProduct(id) {
  const p = products.find(x => x.product_id === id)
  if (!p) return { product: null, forecast: null, recommendation: null }
  const { forecast, recommendation, ...product } = p
  return { product, forecast, recommendation }
}

export function downloadAlertsCSV({ status = '', categoria = '' } = {}) {
  const filtered = filterProducts({ status, categoria })
    .filter(p => p.status === 'CRÍTICO' || p.status === 'URGENTE')
  const rows = [
    ['product_id','categoria','stock_actual','punto_reorden','lead_time_d','cobertura_d','comprar_qty','status'],
    ...filtered.map(p => [
      p.product_id, p.categoria, p.current_stock, p.reorder_point,
      p.lead_time_days, p.days_coverage.toFixed(1), p.qty_recommended, p.status
    ])
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'alertas_supplypredict.csv'; a.click()
  URL.revokeObjectURL(url)
}

// Metrics page endpoint (called via fetch in Metrics.jsx — intercept with a global)
export { metrics as metricsData }
