// Dashboard page — alerts + stat hero + product table.

const { useState: useStateD, useMemo: useMemoD } = React;

const Dashboard = ({ tweaks, onOpenProduct, onNavigate }) => {
  const toast = useToast();
  const stats = useMemoD(() => computeStats(), []);
  const [statusFilter, setStatusFilter] = useStateD('TODOS');
  const [search, setSearch] = useStateD('');
  const [hoverRow, setHoverRow] = useStateD(null);

  const sevTreatment = tweaks.severityTreatment; // 'badge' | 'tint' | 'rail' | 'combo'
  const statTreatment = tweaks.statTreatment;     // 'flat' | 'gradient' | 'sparkline'

  const filtered = useMemoD(() => {
    return ALL_PRODUCTS.filter(p => {
      if (statusFilter !== 'TODOS' && p.status !== statusFilter) return false;
      if (search && !(p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    }).sort((a, b) => {
      // Critical first, then by days left
      const rank = { CRITICO: 0, URGENTE: 1, NORMAL: 2 };
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return a.daysLeft - b.daysLeft;
    });
  }, [statusFilter, search]);

  const tableRows = filtered.slice(0, 12);

  // Sparkline aggregated across all products — total weekly demand
  const totalSpark = useMemoD(() => {
    const arr = Array(14).fill(0);
    ALL_PRODUCTS.forEach(p => p.spark.forEach((v, i) => arr[i] += v));
    return arr;
  }, []);

  const inventorySpark = useMemoD(() => {
    // Faux: derive a smooth descending line from total demand
    const start = stats.inventoryValue * 1.05;
    return Array.from({ length: 14 }, (_, i) => Math.round(start - (i / 14) * stats.inventoryValue * 0.08 + Math.sin(i / 2) * stats.inventoryValue * 0.01));
  }, [stats.inventoryValue]);

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-8 py-8 space-y-7">
      {/* Header bar */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-[12px] text-sub flex items-center gap-2">
            <span>Centro de Pronóstico</span>
            <span className="text-mute">·</span>
            <span className="inline-flex items-center gap-1.5 text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-ok inline-block animate-pulse" />
              Última ejecución hace 2 min
            </span>
          </div>
          <h1 className="display text-[36px] mt-1.5 leading-tight">
            Buenos días, TOYO.
            <span className="text-sub"> Hoy hay </span>
            <span className="text-crit">{stats.crit} SKUs</span>
            <span className="text-sub"> en riesgo de quiebre.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon="upload" onClick={() => toast({ kind: 'ok', title: 'Inventario subido', detail: '480 SKUs actualizados desde POS' })}>
            Importar
          </Button>
          <Button variant="outline" icon="download" onClick={() => toast({ kind: 'ok', title: 'Alertas exportadas', detail: 'alertas_180526.csv · 12 SKUs' })}>
            Exportar alertas
          </Button>
          <Button variant="primary" icon="plus" onClick={() => toast({ kind: 'info', title: 'Generando órdenes de compra…', detail: 'Procesando 12 SKUs críticos' })}>
            Generar órdenes
          </Button>
        </div>
      </div>

      {/* Stat hero — 4 KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="SKUs en catálogo"
          value={fmt.num(stats.total)}
          sub="activos en pronóstico"
          icon="box"
          tone="brand"
          treatment={statTreatment}
          spark={totalSpark}
        />
        <StatCard
          label="Alertas críticas"
          value={stats.crit}
          sub={`${stats.warn} en estado urgente`}
          trend={-3.2}
          icon="alert"
          tone="crit"
          treatment={statTreatment}
          spark={[3,4,4,5,7,6,8,9,11,10,12,13,14,stats.crit]}
        />
        <StatCard
          label="MAPE mediana"
          value={`${typeof stats.medianMape === "number" ? stats.medianMape.toFixed(1) : stats.medianMape}%`}
          sub="LightGBM v2.3.1 · 30d"
          trend={-1.8}
          icon="gauge"
          tone="warn"
          treatment={statTreatment}
          spark={[64,63,62,61,62,60,60,59,59,58,58,58,58,58.3]}
        />
        <StatCard
          label="Valor de inventario"
          value={fmt.moneyK(stats.inventoryValue)}
          sub="MXN · al cierre de ayer"
          trend={2.4}
          icon="pkg"
          tone="ok"
          treatment={statTreatment}
          spark={inventorySpark}
        />
      </div>

      {/* Two-column: alerts + activity */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="alert" size={15} className="text-crit" />
                <h2 className="font-semibold text-[14px]">Alertas críticas</h2>
                <span className="text-[11px] text-sub bg-surf2 px-1.5 py-0.5 rounded">
                  {ALERTS.length}
                </span>
              </div>
              <p className="text-[12px] text-sub mt-1">Productos con riesgo de quiebre en los próximos 14 días</p>
            </div>
            <Button variant="ghost" size="sm" iconRight="arrow-r" onClick={() => setStatusFilter('CRITICO')}>
              Ver todo
            </Button>
          </div>
          <div className="divide-y divide-line">
            {ALERTS.slice(0, 5).map(p => (
              <AlertRow key={p.sku} p={p} onOpen={() => onOpenProduct(p.sku)} />
            ))}
          </div>
        </Card>

        <Card className="col-span-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div className="flex items-center gap-2">
              <Icon name="clock" size={15} className="text-sub" />
              <h2 className="font-semibold text-[14px]">Actividad reciente</h2>
            </div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => toast({ title: 'Actualizando…', kind: 'info' })}>
              {''}
            </Button>
          </div>
          <div className="divide-y divide-line flex-1 overflow-auto max-h-[420px]">
            {ACTIVITY.map(a => (
              <div key={a.id} className="px-5 py-3.5 hover:bg-surf2 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-6 w-6 rounded-full grid place-items-center shrink-0
                                  ${a.kind === 'crit' ? 'bg-critbg text-crit' :
                                    a.kind === 'ok'   ? 'bg-okbg text-ok' :
                                    a.kind === 'warn' ? 'bg-warnbg text-warn' :
                                                        'bg-surf2 text-sub ring-1 ring-line'}`}>
                    <Icon name={
                      a.kind === 'crit' ? 'alert' :
                      a.kind === 'ok'   ? 'check' :
                      a.kind === 'warn' ? 'info'  :
                                          'refresh'} size={12} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink leading-snug">{a.action}</div>
                    <div className="text-[12px] text-sub mt-0.5 truncate">{a.detail}</div>
                    <div className="text-[11px] text-mute mt-1">{a.ts} · {a.actor}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[14px]">Productos por revisar</h2>
            <p className="text-[12px] text-sub mt-0.5">Ordenados por días hasta quiebre · {filtered.length} resultados</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mute" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="SKU o nombre…"
                     className="h-9 w-[240px] pl-8 pr-3 text-[13px] bg-surf2 ring-1 ring-line rounded-[var(--radius-sm)]
                                placeholder:text-mute focus:ring-ink focus:outline-none transition" />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-line flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'TODOS',    label: 'Todos',   count: ALL_PRODUCTS.length },
            { id: 'CRITICO',  label: 'Crítico', count: stats.crit, color: 'bg-crit' },
            { id: 'URGENTE',  label: 'Urgente', count: stats.warn, color: 'bg-warn' },
            { id: 'NORMAL',   label: 'Normal',  count: stats.ok,   color: 'bg-ok'   },
          ].map(f => (
            <Pill key={f.id} active={statusFilter === f.id} count={f.count}
                  color={f.color} onClick={() => setStatusFilter(f.id)}>
              {f.label}
            </Pill>
          ))}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" icon="sort">Ordenar</Button>
          <Button variant="ghost" size="sm" icon="sliders">Columnas</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-sub bg-surf2/40">
                <th className="font-medium py-3 pl-5 pr-2 w-[44px]"></th>
                <th className="font-medium py-3 pr-2">Producto</th>
                <th className="font-medium py-3 pr-2">Estado</th>
                <th className="font-medium py-3 pr-2 text-right">Stock</th>
                <th className="font-medium py-3 pr-2 w-[180px]">Cobertura</th>
                <th className="font-medium py-3 pr-2 text-right">Días</th>
                <th className="font-medium py-3 pr-2">Demanda 14d</th>
                <th className="font-medium py-3 pr-2 text-right">WMAPE</th>
                <th className="font-medium py-3 pr-5 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(p => (
                <TableRow key={p.sku} p={p}
                          sevTreatment={sevTreatment}
                          isHover={hoverRow === p.sku}
                          onHover={setHoverRow}
                          onOpen={() => onOpenProduct(p.sku)}
                          onAction={(label) => toast({ kind: 'ok', title: label, detail: p.sku + ' · ' + p.name })} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-line flex items-center justify-between text-[12px] text-sub">
          <span>Mostrando <b className="text-ink">{tableRows.length}</b> de {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" icon="arrow-l">{''}</Button>
            <span className="px-2 tabular">1 / {Math.ceil(filtered.length / 12)}</span>
            <Button variant="ghost" size="sm" iconRight="arrow-r" onClick={() => onNavigate('metrics')}>Ver todos en Métricas</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Alert row (left rail, countdown, stock bar) ─────────────────────────────
const AlertRow = ({ p, onOpen }) => {
  const isCrit = p.status === 'CRITICO';
  return (
    <div onClick={onOpen}
         className={`row-hover relative px-5 py-4 cursor-pointer
                     ${isCrit ? 'rail-crit' : 'rail-warn'}`}>
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-[64px]">
          <div className={`text-center rounded-[var(--radius-xs)] py-1.5 px-1.5 ring-1
                          ${isCrit ? 'bg-critbg text-crit ring-crit/30' : 'bg-warnbg text-warn ring-warn/30'}`}>
            <div className="display text-[22px] leading-none tabular">{p.daysLeft}</div>
            <div className="text-[9px] font-semibold tracking-wider mt-0.5 uppercase">días</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-mute">{p.sku}</span>
            <SeverityBadge status={p.status} dense />
          </div>
          <div className="font-medium text-[13.5px] mt-0.5 truncate">{p.name}</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 max-w-[280px]">
              <StockBar stock={p.stock} reorderPoint={p.reorderPoint} safetyStock={p.safetyStock} dense />
            </div>
            <div className="text-[11px] text-sub tabular whitespace-nowrap">
              <b className="text-ink">{fmt.num(p.stock)}</b> uds · reorden {fmt.num(p.reorderPoint)}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-mute">Sugerido</div>
          <div className="font-semibold tabular">{fmt.num(p.orderQty)} uds</div>
        </div>
      </div>
    </div>
  );
};

// ─── Product table row ───────────────────────────────────────────────────────
const TableRow = ({ p, sevTreatment, isHover, onHover, onOpen, onAction }) => {
  const tintClass =
    (sevTreatment === 'tint' || sevTreatment === 'combo')
      ? (p.status === 'CRITICO' ? 'tint-crit' : p.status === 'URGENTE' ? 'tint-warn' : '')
      : '';
  const railClass =
    (sevTreatment === 'rail' || sevTreatment === 'combo')
      ? (p.status === 'CRITICO' ? 'rail-crit' : p.status === 'URGENTE' ? 'rail-warn' : 'rail-ok')
      : '';
  const showBadge = sevTreatment === 'badge' || sevTreatment === 'combo';

  return (
    <tr className={`row-hover border-t border-line cursor-pointer ${tintClass} ${railClass}`}
        onMouseEnter={() => onHover(p.sku)}
        onMouseLeave={() => onHover(null)}
        onClick={onOpen}>
      <td className="pl-5 pr-2 py-3 align-middle">
        <div className="font-mono text-[11px] text-mute">{p.sku}</div>
      </td>
      <td className="pr-2 py-3 align-middle">
        <div className="font-medium">{p.name}</div>
        <div className="text-[11px] text-mute mt-0.5">{p.categoryName}</div>
      </td>
      <td className="pr-2 py-3 align-middle">
        {showBadge
          ? <SeverityBadge status={p.status} dense />
          : <span className={`text-[12px] font-medium
                              ${p.status === 'CRITICO' ? 'text-crit' : p.status === 'URGENTE' ? 'text-warn' : 'text-ok'}`}>
              {STATUS_LABEL[p.status]}
            </span>}
      </td>
      <td className="pr-2 py-3 align-middle text-right tabular font-medium">{fmt.num(p.stock)}</td>
      <td className="pr-2 py-3 align-middle">
        <StockBar stock={p.stock} reorderPoint={p.reorderPoint} safetyStock={p.safetyStock} dense />
      </td>
      <td className={`pr-2 py-3 align-middle text-right tabular font-semibold
                      ${p.status === 'CRITICO' ? 'text-crit' : p.status === 'URGENTE' ? 'text-warn' : 'text-sub'}`}>
        {p.daysLeft}d
      </td>
      <td className="pr-2 py-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-[80px]">
            <Sparkline data={p.spark} height={22} strokeWidth={1.5}
                       stroke={p.trend > 0 ? 'rgb(var(--ok))' : p.trend < 0 ? 'rgb(var(--crit))' : 'rgb(var(--mute))'} />
          </div>
          <TrendIndicator value={p.trend * 4.2} dense />
        </div>
      </td>
      <td className="pr-2 py-3 align-middle text-right">
        <span className={`tabular text-[12px]
                          ${(p.mape||p.wmape||0)*100 > 80 ? 'text-crit' : (p.mape||p.wmape||0)*100 > 50 ? 'text-warn' : 'text-ok'}`}>
          {((p.mape || p.wmape || 0) * 100).toFixed(1)}%
        </span>
      </td>
      <td className="pr-5 py-3 align-middle text-right">
        <div className={`flex items-center justify-end gap-1 transition-opacity
                        ${isHover ? 'opacity-100' : 'opacity-0'}`}>
          <Tip label="Generar OC">
            <button onClick={(e) => { e.stopPropagation(); onAction('OC generada'); }}
                    className="h-7 w-7 rounded-[var(--radius-xs)] hover:bg-surf text-sub hover:text-ink grid place-items-center transition-colors">
              <Icon name="plus" size={13} />
            </button>
          </Tip>
          <Tip label="Ver detalle">
            <button onClick={onOpen}
                    className="h-7 w-7 rounded-[var(--radius-xs)] hover:bg-surf text-sub hover:text-ink grid place-items-center transition-colors">
              <Icon name="eye" size={13} />
            </button>
          </Tip>
          <Tip label="Más">
            <button onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-[var(--radius-xs)] hover:bg-surf text-sub hover:text-ink grid place-items-center transition-colors">
              <Icon name="dots" size={13} />
            </button>
          </Tip>
        </div>
      </td>
    </tr>
  );
};

window.Dashboard = Dashboard;
