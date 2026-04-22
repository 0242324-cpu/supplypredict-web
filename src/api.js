import { DATA } from './data.js'

// URL de la API — usa env var si existe, si no apunta directo a Render
const BASE = import.meta.env.VITE_API_URL || 'https://supplypredict-api.onrender.com'

// ── Fallback: datos embebidos (usados si la API falla) ────────────────
const { dashboard, products, metrics } = DATA

function filterLocal({ search = '', status = '', categoria = '' }) {
  return products.filter(p => {
    const matchStatus = !status || p.status === status
    const matchCat    = !categoria || p.categoria === categoria
    const matchSearch = !search ||
      p.product_id.toLowerCase().includes(search.toLowerCase()) ||
      p.nombre.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })
}

// ── Fetch con timeout + fallback automático ───────────────────────────
async function apiFetch(path, fallback) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)  // 8s timeout
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } catch (err) {
    clearTimeout(timeout)
    console.warn(`[API] ${path} falló (${err.message}), usando datos locales`)
    return fallback
  }
}

// ── Funciones públicas ────────────────────────────────────────────────
export async function getDashboard() {
  return apiFetch('/dashboard', dashboard)
}

export async function getProducts({ page = 1, limit = 15, search = '', status = '', categoria = '' } = {}) {
  const qs = new URLSearchParams({
    page, limit,
    ...(search    && { search }),
    ...(status    && { status }),
    ...(categoria && { categoria }),
  })
  // Fallback local
  const filtered = filterLocal({ search, status, categoria })
  const total = filtered.length
  const total_pages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), total_pages)
  const localFallback = {
    products: filtered.slice((safePage - 1) * limit, safePage * limit),
    total, page: safePage, per_page: limit, total_pages
  }
  return apiFetch(`/products?${qs}`, localFallback)
}

export async function getProduct(id) {
  // Fallback local
  const p = products.find(x => x.product_id === id)
  let localFallback = { product: null, forecast: null, recommendation: null }
  if (p) {
    const { forecast, recommendation, ...product } = p
    localFallback = { product, forecast, recommendation }
  }
  return apiFetch(`/product/${id}`, localFallback)
}

export function downloadAlertsCSV({ status = '', categoria = '' } = {}) {
  const params = new URLSearchParams()
  if (status)    params.set('status', status)
  if (categoria) params.set('categoria', categoria)
  const qs = params.toString()
  // Siempre intenta la API para el CSV (streaming)
  window.location.href = `${BASE}/export/alerts${qs ? '?' + qs : ''}`
}

export { metrics as metricsData }
