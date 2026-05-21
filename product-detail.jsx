// Product Detail page — chart-led, with KPIs, recommendation, history.

const { useMemo: useMemoP, useState: useStateP, useEffect: useEffectP } = React;

const ProductDetail = ({ sku, tweaks, onBack, onOpenProduct }) => {
  const toast = useToast();
  const p = useMemoP(() => ALL_PRODUCTS.find(x => x.sku === sku) || ALL_PRODUCTS[0], [sku]);
  const [apiForecast, setApiForecast] = useStateP(null);
  useEffectP(() => {
    setApiForecast(null);
    fetchForecastData(p.sku).then(data => {
      if (data) setApiForecast(data);
    });
  }, [p.sku]);
  const fc = useMemoP(() => {
    if (apiForecast) return buildWeeklyForecastForChart(apiForecast, p);
    return buildForecast(p);
  }, [p, apiForecast]);
  const [explainOpen, setExplainOpen] = useStateP(false);

  // Find similar items (same category, similar daily demand)
  const related = useMemoP(() =>
    ALL_PRODUCTS
      .filter(x => x.category === p.category && x.sku !== p.sku)
      .sort((a, b) => Math.abs(a.dailyDemand - p.dailyDemand) - Math.abs(b.dailyDemand - p.dailyDemand))
      .slice(0, 4),
    [p]);

  const totalForecast30d = fc.forecast.reduce((s, d) => s + d.mean, 0);
  const daysOnHand = Math.round(p.stock / p.dailyDemand);
  const stockoutDay = fc.projection.findIndex(d => d.stock <= p.safetyStock);

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[12px] text-sub">
          <button onClick={onBack} className="hover:text-ink transition-colors flex items-center gap-1">
            <Icon name="arrow-l" size={12} /> Dashboard
          </button>
          <span className="text-mute">/</span>
          <span>{p.categoryName}</span>
          <span className="text-mute">/</span>
          <span className="text-ink font-mono">{p.sku}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" icon="download" onClick={() => toast({ kind: 'ok', title: 'Pronóstico exportado', detail: p.sku + ' · CSV' })}>
            Descargar
          </Button>
          <Button variant="primary" size="md" icon="plus" onClick={() => toast({ kind: 'ok', title: 'OC-2391 generada', detail: `${fmt.num(p.orderQty)} uds · proveedor ${p.supplier}` })}>
            Generar OC ({fmt.num(p.orderQty)} uds)
          </Button>
        </div>
      </div>

      {/* Product header */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {/* Product placeholder thumbnail */}
          <div className="shrink-0 h-[88px] w-[88px] rounded-[var(--radius)] grid place-items-center
                          bg-surf2 ring-1 ring-line"
               style={{
                 backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, rgb(var(--line) / 0.7) 6px 7px)',
               }}>
            <Icon name="box" size={28} className="text-mute" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <SeverityBadge status={p.status} withDays daysLeft={p.daysLeft} />
              <span className="font-mono text-[12px] text-mute">{p.sku}</span>
              <span className="text-[12px] text-sub">{p.categoryName}</span>
            </div>
            <h1 className="display text-[28px] leading-tight mt-2">{p.name}</h1>
            <div className="mt-3 flex items-center gap-6 text-[12px] text-sub">
              <span><span className="text-mute">Proveedor:</span> <span className="text-ink">{p.supplier}</span></span>
              <span><span className="text-mute">Lead time:</span> <span className="text-ink tabular">{p.leadTime}d</span></span>
              <span><span className="text-mute">Costo unitario:</span> <span className="text-ink tabular">${p.unitCost}</span></span>
              <span><span className="text-mute">Última orden:</span> <span className="text-ink tabular">{p.lastOrderDate}</span></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendation banner — context-aware */}
      {p.status !== 'NORMAL' && (
        <div className={`rounded-[var(--radius)] p-5 ring-1 flex items-start gap-4
                        ${p.status === 'CRITICO' ? 'bg-critbg/40 ring-crit/30' : 'bg-warnbg/40 ring-warn/30'}`}>
          <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0
                          ${p.status === 'CRITICO' ? 'bg-crit text-white' : 'bg-warn text-white'}`}>
            <Icon name="alert" size={16} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <div className={`text-[11px] uppercase tracking-wider font-semibold
                            ${p.status === 'CRITICO' ? 'text-crit' : 'text-warn'}`}>
              Acción recomendada
            </div>
            <div className="text-[15px] font-semibold mt-1">
              Generar OC por <span className="tabular">{fmt.num(p.orderQty)} unidades</span> al proveedor {p.supplier}
            </div>
            <div className="text-[12.5px] text-sub mt-1">
              Con el lead time actual de <b className="text-ink">{p.leadTime} días</b>, el inventario se proyecta por debajo del stock de seguridad
              {stockoutDay >= 0 ? <> en <b className="text-ink">{stockoutDay + 1} días</b>.</> : ' dentro de la ventana de pronóstico.'}
              {' '}Cobertura objetivo: 21 días.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant={p.status === 'CRITICO' ? 'danger' : 'primary'} icon="check" onClick={() => toast({ kind: 'ok', title: 'OC aprobada', detail: `${fmt.num(p.orderQty)} uds · ${p.supplier}` })}>
                Aprobar orden sugerida
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExplainOpen(v => !v)}>
                ¿Por qué esta recomendación?
              </Button>
            </div>
            {explainOpen && (
              <div className="mt-4 p-4 bg-surf rounded-[var(--radius-sm)] ring-1 ring-line text-[12.5px]">
                <div className="font-semibold mb-2">Cálculo de la sugerencia</div>
                <table className="w-full">
                  <tbody className="tabular">
                    <tr className="border-b border-line">
                      <td className="py-1.5 text-sub">Demanda semanal promedio</td>
                      <td className="py-1.5 text-right">{Math.round(p.weeklyDemand || p.dailyDemand * 7)} uds/sem</td>
                    </tr>
                    {p.mase != null && <tr>
                      <td className="py-1.5 text-sub">MASE del modelo</td>
                      <td className={`py-1.5 text-right font-semibold ${p.mase < 1 ? 'text-ok' : 'text-warn'}`}>
                        {p.mase.toFixed(2)} {p.mase < 1 ? '✓' : ''}
                      </td>
                    </tr>}
                    {p.grade && <tr>
                      <td className="py-1.5 text-sub">Grado de precisión</td>
                      <td className={`py-1.5 text-right font-bold tabular ${
                        p.grade === 'A' ? 'text-ok' : p.grade === 'B' ? 'text-ok' :
                        p.grade === 'C' ? 'text-warn' : 'text-crit'}`}>
                        {p.grade} · MAPE {((p.mape||p.wmape||0)*100).toFixed(1)}%
                      </td>
                    </tr>}
                    <tr className="border-b border-line">
                      <td className="py-1.5 text-sub">Lead time del proveedor</td>
                      <td className="py-1.5 text-right">{p.leadTime} días</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-1.5 text-sub">Stock de seguridad</td>
                      <td className="py-1.5 text-right">{fmt.num(p.safetyStock)} uds</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-1.5 text-sub">Cobertura objetivo</td>
                      <td className="py-1.5 text-right">21 días</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold">Cantidad sugerida</td>
                      <td className="py-1.5 text-right font-semibold">{fmt.num(p.orderQty)} uds</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3">
        <KPI label="Stock actual" value={fmt.num(p.stock)} sub="unidades" tone="brand" />
        <KPI label="Días en mano" value={daysOnHand} sub="al ritmo actual"
             tone={daysOnHand < p.leadTime ? 'crit' : daysOnHand < 14 ? 'warn' : 'ok'} />
        <KPI label="Punto de reorden" value={fmt.num(p.reorderPoint)} sub="umbral" tone="warn" />
        <KPI label="Pronóstico 30d" value={fmt.num(totalForecast30d)} sub="unidades" tone="brand" />
        <KPI label="WMAPE 30d" value={`${p.wmape.toFixed(1)}%`} sub="precisión modelo"
             tone={p.wmape > 80 ? 'crit' : p.wmape > 50 ? 'warn' : 'ok'} />
      </div>

      {/* Forecast chart */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="chart" size={15} className="text-sub" />
              <h2 className="font-semibold text-[14px]">Demanda histórica y pronóstico semanal</h2>
            </div>
            <p className="text-[12px] text-sub mt-1">Ventas reales (test set ene–may 2026) + 5 semanas de pronóstico LightGBM · intervalo de confianza al 80%</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-end">
            <Legend swatch="bg-ink" label="Ventas reales" />
            <Legend swatch="bg-brand" stroke label="Pronóstico" dashed />
            {(tweaks.chartTreatment === 'confidence' || tweaks.chartTreatment === 'dual') && (
              <Legend swatch="bg-brand/30" label="Intervalo 80%" />
            )}
            {tweaks.chartTreatment === 'danger' && (
              <Legend swatch="bg-crit/30" label="Zona de riesgo" pattern />
            )}
            {tweaks.chartTreatment === 'dual' && (
              <Legend swatch="bg-crit" stroke label="Stock proyectado" />
            )}
          </div>
        </div>
        <div className="p-4">
          <ForecastChart
            history={fc.history}
            forecast={fc.forecast}
            projection={fc.projection}
            isWeekly={!!fc.isWeekly}
            reorderPoint={p.reorderPoint}
            safetyStock={p.safetyStock}
            currentStock={p.stock}
            treatment={tweaks.chartTreatment}
          />
        </div>
      </Card>

      {/* Bottom: history & supplier + related */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-7 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="font-semibold text-[14px]">Historial de órdenes</h2>
            <p className="text-[12px] text-sub mt-0.5">Últimas 6 órdenes de compra</p>
          </div>
          <div className="divide-y divide-line">
            {fakeOrderHistory(p).map((o, i) => (
              <div key={i} className="px-5 py-3 grid grid-cols-12 gap-3 items-center text-[13px]">
                <div className="col-span-2 font-mono text-[11px] text-mute">{o.id}</div>
                <div className="col-span-3 text-sub tabular">{o.date}</div>
                <div className="col-span-3 tabular">{fmt.num(o.qty)} uds</div>
                <div className="col-span-2 tabular text-sub">${o.cost}</div>
                <div className="col-span-2 text-right">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md
                                    ${o.status === 'Recibida' ? 'bg-okbg text-ok' :
                                      o.status === 'En tránsito' ? 'bg-warnbg text-warn' :
                                                                   'bg-surf2 text-sub'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-5 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="font-semibold text-[14px]">Productos similares</h2>
            <p className="text-[12px] text-sub mt-0.5">Misma categoría · demanda semanal comparable</p>
          </div>
          <div className="divide-y divide-line">
            {related.map(r => (
              <button key={r.sku} onClick={() => onOpenProduct(r.sku)}
                      className="w-full text-left px-5 py-3 hover:bg-surf2 transition-colors flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-mute">{r.sku}</span>
                    <SeverityBadge status={r.status} dense withDot={false} />
                  </div>
                  <div className="text-[13px] font-medium mt-0.5 truncate">{r.name}</div>
                </div>
                <div className="w-[70px] shrink-0">
                  <Sparkline data={r.spark} height={22}
                             stroke={r.trend > 0 ? 'rgb(var(--ok))' : r.trend < 0 ? 'rgb(var(--crit))' : 'rgb(var(--mute))'} />
                </div>
                <div className="text-[11px] text-sub tabular w-[50px] text-right">{r.daysLeft}d</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const Legend = ({ swatch, stroke, label, dashed, pattern }) => (
  <span className="inline-flex items-center gap-1.5 text-sub">
    {stroke
      ? <span className={`inline-block h-0.5 w-5 ${swatch} ${dashed ? 'border-t border-dashed' : ''}`}
              style={dashed ? { background: 'transparent', borderTopWidth: 2, borderColor: 'rgb(var(--brand))' } : {}} />
      : pattern
        ? <span className={`inline-block h-3 w-4 rounded-sm`}
                style={{ background: `repeating-linear-gradient(45deg, rgb(var(--crit) / 0.4) 0 2px, transparent 2px 4px)` }} />
        : <span className={`inline-block h-2 w-2 rounded-sm ${swatch}`} />}
    {label}
  </span>
);

const KPI = ({ label, value, sub, tone = 'brand' }) => {
  const fg = { brand: 'text-ink', crit: 'text-crit', warn: 'text-warn', ok: 'text-ok' }[tone];
  return (
    <Card className="p-4">
      <div className="text-[10.5px] uppercase tracking-[0.07em] text-sub font-semibold">{label}</div>
      <div className={`display text-[26px] tabular mt-2 leading-none ${fg}`}>{value}</div>
      <div className="text-[11.5px] text-mute mt-1">{sub}</div>
    </Card>
  );
};

function fakeOrderHistory(p) {
  const r = (() => { let s = parseInt(p.sku.slice(3)); return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
  const statuses = ['Recibida', 'Recibida', 'Recibida', 'Recibida', 'En tránsito', 'Pendiente'];
  return Array.from({ length: 6 }, (_, i) => ({
    id: 'OC-' + (2384 - i),
    date: `2026-${String(4 - Math.floor(i / 2)).padStart(2, '0')}-${String(Math.floor(r() * 28) + 1).padStart(2, '0')}`,
    qty: Math.round(p.orderQty * (0.8 + r() * 0.5)),
    cost: fmt.num(p.orderQty * p.unitCost * (0.8 + r() * 0.5)),
    status: statuses[i],
  }));
}

window.ProductDetail = ProductDetail;
