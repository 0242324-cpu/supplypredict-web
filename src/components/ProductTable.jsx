import StatusBadge from './StatusBadge'

export default function ProductTable({ products, onSelect, page, totalPages, onPage }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Todos los Productos</h2>
        <span className="text-xs text-slate-500 font-mono">pág {page}/{totalPages}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <th className="text-left pb-3 font-medium">Producto</th>
              <th className="text-right pb-3 font-medium">Stock GDL</th>
              <th className="text-right pb-3 font-medium hidden sm:table-cell">Stock Total</th>
              <th className="text-right pb-3 font-medium hidden md:table-cell">Lead</th>
              <th className="text-right pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {products.map(p => (
              <tr key={p.product_id} onClick={() => onSelect(p.product_id)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors group">
                <td className="py-3">
                  <p className="font-mono text-xs text-slate-500">{p.product_id}</p>
                  <p className="text-sm text-slate-200 group-hover:text-white transition-colors">{p.nombre || p.product_id}</p>
                  {p.categoria && <p className="text-xs text-slate-500">{p.categoria}</p>}
                </td>
                <td className={`py-3 text-right font-mono text-xs ${p.current_stock < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {p.current_stock?.toLocaleString()}
                </td>
                <td className={`py-3 text-right font-mono text-xs hidden sm:table-cell ${p.stock_consolidado < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                  {p.stock_consolidado?.toLocaleString()}
                </td>
                <td className="py-3 text-right font-mono text-xs text-slate-500 hidden md:table-cell">{p.lead_time_days?.toFixed(0)}d</td>
                <td className="py-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={p.status} />
                    {p.orden_abierta && <span className="text-xs text-blue-400 font-mono">llega {p.orden_fecha_llegada}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
        <button onClick={() => onPage(page-1)} disabled={page<=1}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors">← Anterior</button>
        <button onClick={() => onPage(page+1)} disabled={page>=totalPages}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors">Siguiente →</button>
      </div>
    </div>
  )
}
