import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const USE_MOCK = !BASE

// ── Mock data (fallback sin API) ──────────────────────────────────────
const MOCK_DASH = {
  total_products: 495, critical_alerts: 470, urgent_alerts: 2,
  orden_abierta: 15, normal_count: 8, pct_at_risk: 95.4,
  categorias: ['Bebidas','Carnes','Empaques','Granos y Cereales','Químicos y Limpieza'],
  mode: 'enriched',
  top_alerts: [
    { product_id:'SE-DGB302-12675', nombre:'Detergente 12675', categoria:'Químicos y Limpieza',
      current_stock:-41423, stock_consolidado:-38000, lead_time_days:74, status:'CRÍTICO', qty_recommended:377114 },
    { product_id:'CO-CAR201-10890', nombre:'Carbón 10890', categoria:'Carnes',
      current_stock:-23, stock_consolidado:1200, lead_time_days:27, status:'ORDEN_ABIERTA',
      orden_abierta:true, orden_id:'OC-86639', orden_fecha_llegada:'2026-04-28', orden_proveedor:'Proveedor A' },
  ],
}

const api = axios.create({ baseURL: BASE, timeout: 8000 })

export async function getDashboard() {
  if (USE_MOCK) return MOCK_DASH
  const { data } = await api.get('/dashboard')
  return data
}

export async function getProducts({ page=1, limit=15, search='', status='', categoria='' }={}) {
  if (USE_MOCK) return { products: [], total: 0, page: 1, per_page: 15, total_pages: 1 }
  const { data } = await api.get('/products', { params: { page, limit, search, status, categoria } })
  return data
}

export async function getProduct(id) {
  if (USE_MOCK) return { product: null, forecast: null, recommendation: null }
  const { data } = await api.get(`/product/${id}`)
  return data
}
