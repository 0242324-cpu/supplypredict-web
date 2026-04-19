import { useState, useMemo } from 'react'
import { fmtNum } from '../utils'
import StatusBadge from './StatusBadge'

// Sort clave → función que extrae valor numérico (null al final en asc)
const SORT_ACCESSORS = {
  stock_consolidado: p => p.stock_consolidado,
  current_stock:     p => p.current_stock,
  lead_time_days:    p => p.lead_time_days,
  days_coverage:     p => p.days_coverage,
  qty_recommended:   p => p.qty_recommended,
}

function sortProducts(products, key, dir) {
  if (!key) return products
  const getter = SORT_ACCESSORS[key]
  if (!getter) return products
  const mult = dir === 'asc' ? 1 : -1
  return [...products].sort((a, b) => {
    const va = getter(a), vb = getter(b)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    return (va - vb) * mult
  })
}

const TH = ({ children, right, sortKey, sort = { key: null, dir: 'asc' }, onSort }) => {
  const active = sort?.key === sortKey
  const arrow = !active ? '' : sort.dir === 'asc' ? ' ↑' : ' ↓'
  const clickable = !!sortKey
  return (
    <th
      onClick={clickable ? () => onSort(sortKey) : undefined}
      className={`py-2 px-3 mono uppercase tracking-widest font-medium ${right ? 'text-right' : 'text-left'} ${clickable ? 'cursor-pointer' : ''}`}
      style={{
        fontSize:'10px',
        color: active ? '#E2E8F0' : '#475569',
        letterSpacing:'0.06em',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        userSelect: 'none',
        transition: 'color 120ms'
      }}
      onMouseEnter={e => { if (clickable && !active) e.currentTarget.style.color = '#94A3B8' }}
      onMouseLeave={e => { if (clickable && !active) e.currentTarget.style.color = '#475569' }}
    >
      {children}{arrow}
    </th>
  )
}

export default function ProductTable({ products, onSelect, page, totalPages, onPage }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const handleSort = (key) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc')  return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  }

  const sortedProducts = useMemo(
    () => sortProducts(products, sort.key, sort.dir),
    [products, sort]
  )

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <span className="mono uppercase tracking-widest text-slate-400" style={{ fontSize:'10px' }}>
          Todos los productos
          {sort.key && (
            <span className="ml-2 text-slate-500" style={{ textTransform:'none', letterSpacing:'normal' }}>
              · ordenado por {sort.key.replace(/_/g,' ')} {sort.dir === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
        <span className="mono text-slate-600" style={{ fontSize:'11px' }}>
          pág {page}/{totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.02)' }}>
              <TH>#</TH>
              <TH>Producto</TH>
              <TH right sortKey="current_stock"     sort={sort} onSort={handleSort}>Stock GDL</TH>
              <TH right sortKey="stock_consolidado" sort={sort} onSort={handleSort}>Stock Total</TH>
              <TH right sortKey="lead_time_days"    sort={sort} onSort={handleSort}>Lead</TH>
              <TH right sortKey="days_coverage"     sort={sort} onSort={handleSort}>Cobertura</TH>
              <TH right sortKey="qty_recommended"   sort={sort} onSort={handleSort}>Comprar</TH>
              <TH right>Status</TH>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((p, i) => (
              <tr key={p.product_id} onClick={() => onSelect(p.product_id)}
                className="cursor-pointer transition-colors"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                <td className="py-2.5 px-3 mono text-slate-600" style={{ fontSize:'11px', width:'36px' }}>
                  {(page-1)*15+i+1}
                </td>
                <td className="py-2.5 px-3">
                  <p className="mono text-slate-500" style={{ fontSize:'10px' }}>{p.product_id}</p>
                  <p className="text-white" style={{ fontSize:'13px' }}>{p.nombre || p.product_id}</p>
                  {p.categoria && (
                    <p className="mono text-slate-600" style={{ fontSize:'10px' }}>{p.categoria}</p>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right mono"
                  style={{ fontSize:'12px', color: p.current_stock < 0 ? '#F43F5E' : '#64748B' }}>
                  {fmtNum(p.current_stock)}
                </td>
                <td className="py-2.5 px-3 text-right mono font-medium"
                  style={{ fontSize:'12px', color: p.stock_consolidado < 0 ? '#F43F5E' : '#94A3B8' }}>
                  {fmtNum(p.stock_consolidado)}
                </td>
                <td className="py-2.5 px-3 text-right mono text-slate-500" style={{ fontSize:'12px' }}>
                  {p.lead_time_days?.toFixed(0)}d
                </td>
                <td className="py-2.5 px-3 text-right mono" style={{
                  fontSize:'12px',
                  color: p.days_coverage != null && p.days_coverage < (p.lead_time_days || 0)
                    ? '#F43F5E' : '#64748B'
                }}>
                  {p.days_coverage != null ? `${p.days_coverage.toFixed(0)}d` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right mono text-orange-400" style={{ fontSize:'12px' }}>
                  {p.qty_recommended > 0 ? fmtNum(p.qty_recommended) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <StatusBadge status={p.status} />
                    {p.orden_abierta && (
                      <span className="mono text-blue-400" style={{ fontSize:'10px' }}>
                        ↗ {p.orden_fecha_llegada}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center px-4 py-2.5"
        style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => onPage(page-1)} disabled={page<=1}
          className="mono text-slate-400 hover:text-white transition-colors disabled:opacity-25"
          style={{ fontSize:'12px' }}>← Anterior</button>
        <span className="mono text-slate-600" style={{ fontSize:'11px' }}>
          {(page-1)*15+1}–{Math.min(page*15, totalPages*15)} de {totalPages*15}
        </span>
        <button onClick={() => onPage(page+1)} disabled={page>=totalPages}
          className="mono text-slate-400 hover:text-white transition-colors disabled:opacity-25"
          style={{ fontSize:'12px' }}>Siguiente →</button>
      </div>
    </div>
  )
}
