import axios from 'axios'
import { MOCK_DASHBOARD, MOCK_PRODUCTS, MOCK_FORECAST } from './mockData'

const BASE = import.meta.env.VITE_API_URL || ''
const USE_MOCK = !BASE

const api = axios.create({ baseURL: BASE, timeout: 8000 })

export async function getDashboard() {
  if (USE_MOCK) return MOCK_DASHBOARD
  const { data } = await api.get('/dashboard')
  return data
}

export async function getProducts({ page = 1, limit = 15, search = '', status = '' } = {}) {
  if (USE_MOCK) {
    const filtered = MOCK_PRODUCTS.filter(p =>
      (!search || p.product_id.toLowerCase().includes(search.toLowerCase())) &&
      (!status || p.status === status)
    )
    return { products: filtered.slice((page-1)*limit, page*limit), total: filtered.length, page, per_page: limit, total_pages: Math.ceil(filtered.length/limit) }
  }
  const { data } = await api.get('/products', { params: { page, limit, search, status } })
  return data
}

export async function getProduct(id) {
  if (USE_MOCK) {
    const p = MOCK_PRODUCTS.find(x => x.product_id === id) || MOCK_DASHBOARD.top_alerts.find(x => x.product_id === id)
    return { product: p, forecast: MOCK_FORECAST, recommendation: { action:'COMPRAR HOY', reason:'Stock crítico', qty_suggested: p?.qty_recommended || 5000, urgency:'CRÍTICO' } }
  }
  const { data } = await api.get(`/product/${id}`)
  return data
}
