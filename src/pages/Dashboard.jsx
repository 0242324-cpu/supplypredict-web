import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import AlertList from '../components/AlertList'
import ProductTable from '../components/ProductTable'
import Spinner from '../components/Spinner'
import { getDashboard, getProducts } from '../api'

export default function Dashboard({ onSelect }) {
  const [dash, setDash] = useState(null)
  const [prods, setProds] = useState({ products: [], total: 0, total_pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(setDash)
  }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({ page, limit: 15, search }).then(d => { setProds(d); setLoading(false) })
  }, [page, search])

  if (!dash) return <Spinner />

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Productos" value={dash.total_products.toLocaleString()} />
        <StatCard label="En Riesgo" value={(dash.critical_alerts + dash.urgent_alerts).toLocaleString()} color="red" sub={`${dash.pct_at_risk}% del total`} />
        <StatCard label="Críticos" value={dash.critical_alerts.toLocaleString()} color="red" />
        <StatCard label="Urgentes"  value={dash.urgent_alerts.toLocaleString()} color="blue" />
      </div>

      {/* Alerts */}
      <AlertList alerts={dash.top_alerts} onSelect={onSelect} />

      {/* Search */}
      <div className="flex gap-3">
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent transition-colors"
          placeholder="Buscar por ID de producto..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      {loading ? <Spinner /> : (
        <ProductTable
          products={prods.products}
          onSelect={onSelect}
          page={page}
          totalPages={prods.total_pages}
          onPage={setPage}
        />
      )}
    </main>
  )
}
