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
              <th className="text-right pb-3 font-medium">Stock</th>
              <th className="text-right pb-3 font-medium hidden sm:table-cell">Reorden</th>
              <th className="text-right pb-3 font-medium hidden md:table-cell">Lead</th>
              <th className="text-right pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {products.map(p => (
              <tr key={p.product_id} onClick={() => onSelect(p.product_id)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors group">
                <td className="py-3 font-mono text-xs text-slate-300 group-hover:text-white transition-colors">{p.product_id}</td>
                <td className={`py-3 text-right font-mono text-xs ${p.current_stock < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                  {p.current_stock?.toLocaleString()}
                </td>
                <td className="py-3 text-right font-mono text-xs text-slate-500 hidden sm:table-cell">{p.reorder_point?.toLocaleString()}</td>
                <td className="py-3 text-right font-mono text-xs text-slate-500 hidden md:table-cell">{p.lead_time_days?.toFixed(0)}d</td>
                <td className="py-3 text-right"><StatusBadge status={p.status} /></td>
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
