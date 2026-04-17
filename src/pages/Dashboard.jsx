import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import AlertList from '../components/AlertList'
import ProductTable from '../components/ProductTable'
import Spinner from '../components/Spinner'
import { getDashboard, getProducts } from '../api'

export default function Dashboard({ onSelect }) {
  const [dash, setDash]       = useState(null)
  const [prods, setProds]     = useState({ products: [], total: 0, total_pages: 1 })
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [categoria, setCat]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { getDashboard().then(setDash) }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({ page, limit: 15, search, status, categoria })
      .then(d => { setProds(d); setLoading(false) })
  }, [page, search, status, categoria])

  const reset = () => { setSearch(''); setStatus(''); setCat(''); setPage(1) }

  if (!dash) return <Spinner />

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Productos" value={dash.total_products?.toLocaleString()} />
        <StatCard label="Críticos" value={dash.critical_alerts?.toLocaleString()} color="red" sub={`${dash.pct_at_risk}% del total`} />
        <StatCard label="Urgentes" value={dash.urgent_alerts?.toLocaleString()} color="blue" />
        <StatCard label="En orden" value={dash.orden_abierta?.toLocaleString()} color="green" sub="compra en proceso" />
      </div>

      {/* Modo */}
      {dash.mode === 'enriched' && (
        <div className="text-xs text-blue-400 font-mono px-1">
          ✓ Modo enriquecido — catálogo + stock consolidado + órdenes abiertas activos
        </div>
      )}

      {/* Alertas */}
      <AlertList alerts={dash.top_alerts} onSelect={onSelect} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent transition-colors"
          placeholder="Buscar por ID o nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="CRÍTICO">Crítico</option>
          <option value="URGENTE">Urgente</option>
          <option value="ORDEN_ABIERTA">En orden</option>
          <option value="NORMAL">Normal</option>
        </select>
        {dash.categorias?.length > 0 && (
          <select
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent"
            value={categoria}
            onChange={e => { setCat(e.target.value); setPage(1) }}>
            <option value="">Todas las categorías</option>
            {dash.categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(search || status || categoria) && (
          <button onClick={reset}
            className="px-3 py-2.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
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
