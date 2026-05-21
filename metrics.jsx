// Metrics page — model accuracy at scale.
// Summary cards + WMAPE distribution + filterable grid/table view of all 480 SKUs.

const { useMemo: useMemoM, useState: useStateM } = React;

const Metrics = ({ tweaks, onOpenProduct }) => {
  const toast = useToast();
  const [view, setView] = useStateM('grid'); // 'grid' | 'table'
  const [bucket, setBucket] = useStateM('TODOS'); // accuracy bucket
  const [cat, setCat] = useStateM('TODOS');
  const [sort, setSort] = useStateM('mape-asc');
  const [search, setSearch] = useStateM('');

  // Compute distribution metrics
  const summary = useMemoM(() => {
    const mapes = ALL_PRODUCTS.map(p => (p.mape || p.wmape || 0) * 100).sort((a, b) => a - b);
    const median = mapes[Math.floor(mapes.length / 2)];
    const p25 = mapes[Math.floor(mapes.length * 0.25)];
    const p75 = mapes[Math.floor(mapes.length * 0.75)];
    const best = mapes[0];
    const worst = mapes[mapes.length - 1];
    const gradeA = ALL_PRODUCTS.filter(p => p.grade === 'A').length;
    const gradeB = ALL_PRODUCTS.filter(p => p.grade === 'B').length;
    const gradeC = ALL_PRODUCTS.filter(p => p.grade === 'C').length;
    const gradeD = ALL_PRODUCTS.filter(p => p.grade === 'D').length;
    const lowErr = gradeA + gradeB;
    const midErr = gradeC;
    const highErr = gradeD;
    // MASE median
    const mases = ALL_PRODUCTS.map(p => p.mase || 0.87).sort((a,b) => a-b);
    const maseMedian = mases[Math.floor(mases.length / 2)];
    const maseBeaten = ALL_PRODUCTS.filter(p => (p.mase || 0.87) < 1).length;
    return { median, p25, p75, best, worst, lowErr, midErr, highErr, gradeA, gradeB, gradeC, gradeD, maseMedian, maseBeaten };
  }, []);

  const filtered = useMemoM(() => {
    let res = ALL_PRODUCTS.filter(p => {
      if (bucket === 'LOW'  && !['A','B'].includes(p.grade)) return false;
      if (bucket === 'MID'  && p.grade !== 'C') return false;
      if (bucket === 'HIGH' && p.grade !== 'D') return false;
      if (cat !== 'TODOS' && p.category !== cat) return false;
      if (search && !(p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
    res.sort((a, b) => {
      if (sort === 'mape-asc')  return (a.mape||a.wmape||0) - (b.mape||b.wmape||0);
      if (sort === 'mape-desc') return (b.mape||b.wmape||0) - (a.mape||a.wmape||0);
      if (sort === 'demand')     return b.dailyDemand - a.dailyDemand;
      return 0;
    });
    return res;
  }, [bucket, cat, search, sort]);

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-8 py-8 space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-[12px] text-sub flex items-center gap-2">
            <Icon name="gauge" size={13} />
            <span>Precisión del modelo</span>
          </div>
          <h1 className="display text-[32px] mt-1 leading-tight">Rendimiento por SKU</h1>
          <p className="text-[13px] text-sub mt-1">MAPE medido sobre conjunto de test 2026 · {fmt.num(ALL_PRODUCTS.length)} productos activos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon="refresh" onClick={() => toast({ kind: 'info', title: 'Re-entrenando modelo…', detail: 'LightGBM · 480 SKUs · ETA 4 min' })}>
            Re-entrenar
          </Button>
          <Button variant="outline" icon="download" onClick={() => toast({ kind: 'ok', title: 'Métricas exportadas', detail: 'metrics_180526.csv' })}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-3 p-5">
          <div className="text-[11px] uppercase tracking-wider text-sub font-semibold">MAPE mediana</div>
          <div className="display text-[40px] mt-2 tabular leading-none">{summary.median.toFixed(1)}%</div>
          <div className="text-[12px] text-sub mt-2">
            <span className="tabular">P25 · {summary.p25.toFixed(1)}%</span>
            <span className="text-mute mx-1.5">·</span>
            <span className="tabular">P75 · {summary.p75.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="col-span-3 p-5">
          <div className="text-[11px] uppercase tracking-wider text-sub font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Modelo confiable
          </div>
          <div className="display text-[40px] mt-2 tabular leading-none text-ok">{summary.lowErr}</div>
          <div className="text-[12px] text-sub mt-2">SKUs con WMAPE &lt; 40%</div>
          <div className="text-[11px] text-mute mt-1 tabular">{((summary.lowErr / ALL_PRODUCTS.length) * 100).toFixed(0)}% del catálogo</div>
        </Card>

        <Card className="col-span-3 p-5">
          <div className="text-[11px] uppercase tracking-wider text-sub font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" /> Aceptable
          </div>
          <div className="display text-[40px] mt-2 tabular leading-none text-warn">{summary.midErr}</div>
          <div className="text-[12px] text-sub mt-2">Grado C (MAPE 50–100%)</div>
          <div className="text-[11px] text-mute mt-1 tabular">{((summary.midErr / ALL_PRODUCTS.length) * 100).toFixed(0)}% del catálogo</div>
        </Card>

        <Card className="col-span-3 p-5">
          <div className="text-[11px] uppercase tracking-wider text-sub font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-crit" /> Necesita atención
          </div>
          <div className="display text-[40px] mt-2 tabular leading-none text-crit">{summary.highErr}</div>
          <div className="text-[12px] text-sub mt-2">Grado D (MAPE ≥ 100%)</div>
          <div className="text-[11px] text-mute mt-1 tabular">{((summary.highErr / ALL_PRODUCTS.length) * 100).toFixed(0)}% del catálogo</div>
        </Card>
      </div>


      {/* MASE card */}
      <Card className="col-span-12 p-5 mt-1">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-sub font-semibold">MASE mediana — KPI principal</div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="display text-[36px] tabular leading-none">{summary.maseMedian.toFixed(2)}</span>
              <span className={`text-[13px] font-semibold ${summary.maseMedian < 1 ? 'text-ok' : 'text-warn'}`}>
                {summary.maseMedian < 1 ? '✓ Supera al naive' : '⚠ Por debajo del naive'}
              </span>
            </div>
          </div>
          <div className="text-[12px] text-sub max-w-[480px] leading-relaxed">
            <b className="text-ink">MASE &lt; 1</b> significa que el modelo supera al pronóstico ingenuo (repetir última semana).
            <br /><b className="text-ok tabular">{summary.maseBeaten}</b> de {ALL_PRODUCTS.length} productos ({Math.round(summary.maseBeaten / ALL_PRODUCTS.length * 100)}%) logran MASE &lt; 1.
            <br /><span className="text-mute">A diferencia del MAPE, el MASE es estable cuando la demanda es cercana a cero.</span>
          </div>
          <div className="flex items-center gap-6">
            {[['A','text-ok','bg-okbg',summary.gradeA],['B','text-ok','bg-okbg',summary.gradeB],
              ['C','text-warn','bg-warnbg',summary.gradeC],['D','text-crit','bg-critbg',summary.gradeD]].map(([g,fg,bg,n]) => (
              <div key={g} className="text-center">
                <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${bg} ${fg} font-bold text-[15px]`}>{g}</div>
                <div className="text-[18px] tabular font-semibold mt-1">{n}</div>
                <div className="text-[10px] text-sub">SKUs</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Distribution histogram */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[14px]">Distribución de MAPE</h2>
            <p className="text-[12px] text-sub mt-0.5">Sobre el conjunto de test (ene–may 2026) · 228 productos activos</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-sub">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 bg-ok rounded-sm" /> &lt;40%</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 bg-warn rounded-sm" /> 40–70%</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 bg-crit rounded-sm" /> ≥70%</span>
          </div>
        </div>
        <div className="p-5">
          <Histogram data={ALL_PRODUCTS.map(p => (p.mape || p.wmape || 0) * 100)} bins={16} height={180} />
        </div>
      </Card>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Pill active={bucket === 'TODOS'} count={ALL_PRODUCTS.length} onClick={() => setBucket('TODOS')}>Todos</Pill>
        <Pill active={bucket === 'LOW'}  count={summary.lowErr}  color="bg-ok"   onClick={() => setBucket('LOW')}>Confiable</Pill>
        <Pill active={bucket === 'MID'}  count={summary.midErr}  color="bg-warn" onClick={() => setBucket('MID')}>Aceptable</Pill>
        <Pill active={bucket === 'HIGH'} count={summary.highErr} color="bg-crit" onClick={() => setBucket('HIGH')}>Atención</Pill>

        <span className="h-5 w-px bg-line mx-2" />

        <select value={cat} onChange={e => setCat(e.target.value)}
                className="h-8 px-2.5 pr-7 text-[12px] bg-surf ring-1 ring-line rounded-[var(--radius-sm)]
                           text-ink focus:outline-none focus:ring-mute appearance-none cursor-pointer">
          <option value="TODOS">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)}
                className="h-8 px-2.5 pr-7 text-[12px] bg-surf ring-1 ring-line rounded-[var(--radius-sm)]
                           text-ink focus:outline-none focus:ring-mute appearance-none cursor-pointer">
          <option value="mape-asc">MAPE: menor primero</option>
          <option value="mape-desc">MAPE: mayor primero</option>
          <option value="demand">Demanda: mayor primero</option>
        </select>

        <div className="relative">
          <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mute" />
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Buscar SKU…"
                 className="h-8 w-[200px] pl-8 pr-3 text-[12px] bg-surf ring-1 ring-line rounded-[var(--radius-sm)]
                            placeholder:text-mute focus:ring-mute focus:outline-none" />
        </div>

        <div className="flex-1" />

        <div className="bg-surf ring-1 ring-line rounded-[var(--radius-sm)] flex p-0.5">
          <button onClick={() => setView('grid')}
                  className={`h-7 px-2.5 text-[12px] rounded-[var(--radius-xs)] flex items-center gap-1.5
                              ${view === 'grid' ? 'bg-ink text-[rgb(var(--surf))]' : 'text-sub hover:text-ink'}`}>
            <Icon name="pkg" size={12} /> Cuadrícula
          </button>
          <button onClick={() => setView('table')}
                  className={`h-7 px-2.5 text-[12px] rounded-[var(--radius-xs)] flex items-center gap-1.5
                              ${view === 'table' ? 'bg-ink text-[rgb(var(--surf))]' : 'text-sub hover:text-ink'}`}>
            <Icon name="list" size={12} /> Tabla
          </button>
        </div>
      </div>

      <div className="text-[12px] text-sub">
        Mostrando <b className="text-ink tabular">{fmt.num(filtered.length)}</b> de {fmt.num(ALL_PRODUCTS.length)} productos
      </div>

      {/* Content */}
      {view === 'grid'
        ? <MetricsGrid items={filtered.slice(0, 60)} onOpen={onOpenProduct} />
        : <MetricsTable items={filtered.slice(0, 60)} onOpen={onOpenProduct} />}

      {filtered.length > 60 && (
        <div className="text-center py-6">
          <Button variant="outline" icon="plus" onClick={() => toast({ kind: 'info', title: 'Cargando más…' })}>
            Cargar más ({fmt.num(filtered.length - 60)} restantes)
          </Button>
        </div>
      )}
    </div>
  );
};

const MetricsGrid = ({ items, onOpen }) => (
  <div className="grid grid-cols-4 gap-3">
    {items.map(p => (
      <button key={p.sku} onClick={() => onOpen(p.sku)}
              className="text-left">
        <Card className="p-4 hover:shadow-card-h transition-shadow h-full">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-mute">{p.sku}</span>
            <SeverityBadge status={p.status} dense withDot={false} />
          </div>
          <div className="font-medium text-[13px] mt-2 line-clamp-2 leading-snug min-h-[34px]">{p.name}</div>
          <div className="text-[11px] text-mute mt-1">{p.categoryName}</div>

          <div className="mt-3 -mx-1 h-9">
            <Sparkline data={p.spark} height={36}
                       stroke={p.trend > 0 ? 'rgb(var(--ok))' : p.trend < 0 ? 'rgb(var(--crit))' : 'rgb(var(--sub))'}
                       fill={p.trend > 0 ? 'rgb(var(--ok) / 0.12)' : p.trend < 0 ? 'rgb(var(--crit) / 0.10)' : 'rgb(var(--sub) / 0.08)'} />
          </div>

          <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="text-mute">WMAPE</div>
              <div className={`tabular font-semibold text-[14px] ${p.wmape > 70 ? 'text-crit' : p.wmape > 40 ? 'text-warn' : 'text-ok'}`}>
                {((p.mape || p.wmape || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-mute">Stock</div>
              <div className="tabular font-semibold text-[14px]">{fmt.num(p.stock)}</div>
            </div>
          </div>
        </Card>
      </button>
    ))}
  </div>
);

const MetricsTable = ({ items, onOpen }) => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-sub bg-surf2/40">
            <th className="font-medium py-3 pl-5 pr-2">SKU</th>
            <th className="font-medium py-3 pr-2">Producto</th>
            <th className="font-medium py-3 pr-2">Categoría</th>
            <th className="font-medium py-3 pr-2 text-right">Demanda diaria</th>
            <th className="font-medium py-3 pr-2">Tendencia 14d</th>
            <th className="font-medium py-3 pr-2 text-right">WMAPE</th>
            <th className="font-medium py-3 pr-2">Distribución</th>
            <th className="font-medium py-3 pr-5">Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.sku} className="row-hover border-t border-line cursor-pointer"
                onClick={() => onOpen(p.sku)}>
              <td className="pl-5 pr-2 py-2.5 font-mono text-[11px] text-mute">{p.sku}</td>
              <td className="pr-2 py-2.5 font-medium">{p.name}</td>
              <td className="pr-2 py-2.5 text-sub text-[12px]">{p.categoryName}</td>
              <td className="pr-2 py-2.5 text-right tabular">{p.dailyDemand}</td>
              <td className="pr-2 py-2.5">
                <div className="w-[80px]">
                  <Sparkline data={p.spark} height={20}
                             stroke={p.trend > 0 ? 'rgb(var(--ok))' : p.trend < 0 ? 'rgb(var(--crit))' : 'rgb(var(--mute))'} />
                </div>
              </td>
              <td className={`pr-2 py-2.5 text-right tabular font-semibold
                              ${p.wmape > 70 ? 'text-crit' : p.wmape > 40 ? 'text-warn' : 'text-ok'}`}>
                {((p.mape || p.wmape || 0) * 100).toFixed(1)}%
              </td>
              <td className="pr-2 py-2.5">
                <div className="w-[140px] h-2 bg-surf2 rounded-full ring-1 ring-line overflow-hidden relative">
                  <div className={`absolute inset-y-0 left-0 ${p.wmape > 70 ? 'bg-crit' : p.wmape > 40 ? 'bg-warn' : 'bg-ok'}`}
                       style={{ width: `${Math.min(100, p.wmape)}%` }} />
                </div>
              </td>
              <td className="pr-5 py-2.5">
                <SeverityBadge status={p.status} dense withDot={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

window.Metrics = Metrics;
