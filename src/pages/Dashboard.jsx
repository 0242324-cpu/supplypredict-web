import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import AlertList from '../components/AlertList'
import ProductTable from '../components/ProductTable'
import Spinner from '../components/Spinner'
import { getDashboard, getProducts, downloadAlertsCSV } from '../api'

export default function Dashboard({ onSelect }) {
  const [dash, setDash]       = useState(null)
  const [prods, setProds]     = useState({ products:[], total:0, total_pages:1 })
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [categoria, setCat]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { getDashboard().then(setDash) }, [])
  useEffect(() => {
    setLoading(true)
    getProducts({ page, limit:15, search, status, categoria })
      .then(d => { setProds(d); setLoading(false) })
  }, [page, search, status, categoria])

  if (!dash) return <Spinner />

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Productos monitoreados" value={dash.total_products?.toLocaleString()}
          accent="#3B82F6" />
        <StatCard label="Críticos ahora" value={dash.critical_alerts?.toLocaleString()}
          accent="#F43F5E" sub={`${dash.pct_at_risk}% del total`} />
        <StatCard label="Urgentes" value={dash.urgent_alerts?.toLocaleString()}
          accent="#FB923C" />
        <StatCard label="Con orden abierta" value={(dash.orden_abierta||0).toLocaleString()}
          accent="#34D399" sub="compra en proceso" />
      </div>

      {/* Top alertas */}
      <AlertList alerts={dash.top_alerts || []} onSelect={onSelect} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="flex-1 min-w-[180px]"
          placeholder="Buscar ID o nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="CRÍTICO">Crítico</option>
          <option value="URGENTE">Urgente</option>
          <option value="ORDEN_ABIERTA">En orden</option>
          <option value="NORMAL">Normal</option>
        </select>
        {dash.categorias?.length > 0 && (
          <select value={categoria} onChange={e => { setCat(e.target.value); setPage(1) }}>
            <option value="">Todas las categorías</option>
            {dash.categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(search || status || categoria) && (
          <button onClick={() => { setSearch(''); setStatus(''); setCat(''); setPage(1) }}
            className="mono text-slate-500 hover:text-white transition-colors"
            style={{ fontSize:'12px' }}>× limpiar</button>
        )}

        <button
          onClick={() => downloadAlertsCSV({ status, categoria })}
          className="mono uppercase tracking-widest transition-all"
          style={{
            fontSize: '10px',
            padding: '8px 14px',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            borderRadius: '6px',
            background: 'rgba(52, 211, 153, 0.08)',
            color: '#34D399',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            marginLeft: 'auto'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(52, 211, 153, 0.16)'
            e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.6)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.35)'
          }}
          title={status || categoria
            ? `Descargar alertas filtradas${status ? ' por ' + status : ''}${categoria ? ' en ' + categoria : ''}`
            : 'Descargar críticos + urgentes'}
        >
          ↓ Descargar CSV
        </button>
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
