// Hand-rolled SVG charts — total visual control.
// ForecastChart : demanda pasada + pronóstico (sin líneas de stock)
// StockChart    : proyección de inventario + punto de reorden + stock de seguridad
// Histogram     : distribución de MAPE en página de métricas

const { useState: useStateChart, useMemo: useMemoChart, useRef: useRefChart } = React;

// ─── Shared helpers ───────────────────────────────────────────────────────────
function niceStep(s) {
  if (!s || !isFinite(s)) return 1;
  const exp  = Math.floor(Math.log10(s));
  const base = Math.pow(10, exp);
  const m    = s / base;
  if (m < 1.5) return base;
  if (m < 3)   return 2 * base;
  if (m < 7)   return 5 * base;
  return 10 * base;
}

// ─── ForecastChart ────────────────────────────────────────────────────────────
// Muestra demanda histórica (test set) + pronóstico futuro.
// Sin líneas de stock — esas van en StockChart.
//
// props:
//   history  : [{ day, actual, weekLabel }]
//   forecast : [{ day, mean, lower, upper, weekLabel }]
//   treatment: 'simple' | 'confidence'
//   isWeekly : bool
const ForecastChart = ({
  history,
  forecast,
  treatment = 'confidence',
  height    = 320,
  isWeekly  = false,
}) => {
  const W = 1000, H = height;
  const pad = { l: 62, r: 24, t: 28, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  if (!history?.length || !forecast?.length) return null;

  // Mostrar solo las ultimas 12 semanas de historia para que HOY quede ~70% del eje
  const DISPLAY_HIST_WEEKS = 12;
  const displayHistory = history.slice(-DISPLAY_HIST_WEEKS);

  const allVals = [
    ...displayHistory.map(d => d.actual),
    ...forecast.map(d => d.upper),
    ...forecast.map(d => d.mean),
  ].filter(Number.isFinite);
  const yMax = Math.max(...allVals) * 1.18;
  const yMin = 0;

  const xMin = displayHistory[0].day;
  const xMax = forecast[forecast.length - 1].day;
  const xRange = xMax - xMin || 1;

  const x = d => pad.l + ((d - xMin) / xRange) * innerW;
  const y = v => pad.t + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const histPath = displayHistory.map((d, i) =>
    `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.actual).toFixed(1)}`
  ).join(' ');

  const forePath = forecast.map((d, i) =>
    `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.mean).toFixed(1)}`
  ).join(' ');

  const last  = displayHistory[displayHistory.length - 1] || history[history.length - 1];
  const first = forecast[0];
  const bridgePath = `M${x(last.day).toFixed(1)},${y(last.actual).toFixed(1)} L${x(first.day).toFixed(1)},${y(first.mean).toFixed(1)}`;

  const ciPath = (() => {
    const top = forecast.map((d, i) =>
      `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.upper).toFixed(1)}`
    ).join(' ');
    const bot = [...forecast].reverse().map(d =>
      `L${x(d.day).toFixed(1)},${y(d.lower).toFixed(1)}`
    ).join(' ');
    return `${top} ${bot} Z`;
  })();

  const yTicks = useMemoChart(() => {
    const step = niceStep(yMax / 5);
    const ticks = [];
    for (let v = 0; v <= yMax + step; v += step) ticks.push(v);
    return ticks;
  }, [yMax]);

  const xTicks = (() => {
    if (!isWeekly) return [-30, -20, -10, 0, 10, 20, 30].filter(d => d >= xMin && d <= xMax);
    // Combinar historia visible + forecast, etiquetar cada 2do punto para no aglomerar
    const allPts = [...displayHistory, ...forecast];
    return allPts.filter((_, i) => i % 2 === 0).map(d => d.day);
  })();

  const [hover, setHover] = useStateChart(null);
  const [mousePos, setMousePos] = useStateChart({ x: 0, y: 0 });
  const svgRef = useRefChart(null);

  const onMove = e => {
    setMousePos({ x: e.clientX, y: e.clientY });
    const rect  = svgRef.current.getBoundingClientRect();
    const scale = W / rect.width;
    const mx    = (e.clientX - rect.left) * scale;
    if (mx < pad.l || mx > W - pad.r) { setHover(null); return; }
    const day = Math.round(xMin + ((mx - pad.l) / innerW) * xRange);
    const snapped = [...displayHistory, ...forecast].reduce((best, d) =>
      Math.abs(d.day - day) < Math.abs(best.day - day) ? d : best
    );
    if (snapped.actual != null) {
      setHover({ kind: 'hist', ...snapped });
    } else {
      setHover({ kind: 'fore', ...snapped });
    }
  };

  const showCI = treatment === 'confidence';

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="demHistArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(var(--brand))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)}
                  stroke="rgb(var(--line))" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle"
                  fill="rgb(var(--mute))" fontSize="11" className="tabular">
              {fmt.num(t)}
            </text>
          </g>
        ))}

        {/* Baseline */}
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)}
              stroke="rgb(var(--line))" strokeWidth="1" />

        {/* HOY separator */}
        <line x1={x(0)} x2={x(0)} y1={pad.t} y2={H - pad.b}
              stroke="rgb(var(--ink))" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 4" />
        <text x={x(0)} y={pad.t - 10} textAnchor="middle"
              fill="rgb(var(--ink))" fontSize="11" fontWeight="600">HOY</text>

        {/* X labels */}
        {xTicks.map(t => (
          <text key={t} x={x(t)} y={H - pad.b + 18} textAnchor="middle"
                fill="rgb(var(--mute))" fontSize="11" className="tabular">
            {isWeekly
              ? (() => {
                  const pt = [...displayHistory, ...forecast].find(p => p.day === t);
                  return pt?.weekLabel || `${Math.round(t / 7)}s`;
                })()
              : (t === 0 ? 'hoy' : t > 0 ? `+${t}d` : `${t}d`)}
          </text>
        ))}

        {/* History area fill */}
        <path d={`${histPath} L${x(last.day).toFixed(1)},${y(0)} L${x(displayHistory[0].day).toFixed(1)},${y(0)} Z`}
              fill="url(#demHistArea)" />

        {/* History line */}
        <path d={histPath} fill="none" stroke="rgb(var(--ink))" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />

        {/* CI band */}
        {showCI && (
          <path d={ciPath} fill="rgb(var(--brand))" fillOpacity="0.13" stroke="none" />
        )}

        {/* Bridge */}
        <path d={bridgePath} fill="none" stroke="rgb(var(--brand))" strokeWidth="2"
              strokeDasharray="3 3" opacity="0.7" />

        {/* Forecast line */}
        <path d={forePath} fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 4" />

        {/* Last actual dot */}
        <circle cx={x(last.day)} cy={y(last.actual)} r="5"
                fill="rgb(var(--surf))" stroke="rgb(var(--ink))" strokeWidth="2.5" />

        {/* Hover */}
        {hover && (
          <>
            <line x1={x(hover.day)} x2={x(hover.day)} y1={pad.t} y2={H - pad.b}
                  stroke="rgb(var(--ink))" strokeOpacity="0.25" strokeWidth="1" />
            {hover.kind === 'fore' && (
              <circle cx={x(hover.day)} cy={y(hover.mean)} r="4.5"
                      fill="rgb(var(--brand))" stroke="rgb(var(--surf))" strokeWidth="2" />
            )}
            {hover.kind === 'hist' && (
              <circle cx={x(hover.day)} cy={y(hover.actual)} r="4.5"
                      fill="rgb(var(--ink))" stroke="rgb(var(--surf))" strokeWidth="2" />
            )}
          </>
        )}
      </svg>

      {/* Tooltip — fixed so it's never clipped by card borders */}
      {hover && (
        <div className="fixed pointer-events-none bg-ink text-[rgb(var(--surf))] rounded-md shadow-xl
                        px-3 py-2 text-[11px] tabular leading-tight z-[9999]"
             style={{
               left: Math.min(mousePos.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 220),
               top:  Math.max(mousePos.y - 80, 8),
             }}>
          <div className="font-semibold opacity-60 mb-1 text-[10px] uppercase tracking-wider">
            {isWeekly ? `Sem ${hover.weekLabel}` : hover.day === 0 ? 'Hoy' : hover.day > 0 ? `+${hover.day}d` : `${Math.abs(hover.day)}d atrás`}
          </div>
          {hover.kind === 'hist' && (
            <div className="flex items-baseline gap-3">
              <span className="opacity-70">Demanda real</span>
              <span className="font-semibold">{fmt.num(hover.actual)} uds</span>
            </div>
          )}
          {hover.kind === 'fore' && (
            <>
              <div className="flex items-baseline gap-3">
                <span className="opacity-70">Pronóstico</span>
                <span className="font-semibold">{fmt.num(hover.mean)} uds</span>
              </div>
              {showCI && (
                <div className="flex items-baseline gap-3 opacity-75 text-[10px] mt-0.5">
                  <span className="opacity-70">IC 80%</span>
                  <span>{fmt.num(hover.lower)} – {fmt.num(hover.upper)}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── StockChart ───────────────────────────────────────────────────────────────
// Cubre el mismo rango temporal que ForecastChart:
//   - Lado izquierdo (pasado): stock reconstruido hacia atrás desde stock actual
//     usando la demanda real de cada semana del test set.
//   - HOY: línea vertical en day=0
//   - Lado derecho (futuro): depleción proyectada con pronóstico de demanda
//
// Permite comparar directamente con la gráfica de demanda y ver desabasto.
//
// props:
//   currentStock : número (stock hoy)
//   history      : [{ day, actual, weekLabel }]  — de fc.history
//   forecast     : [{ day, mean, weekLabel }]     — de fc.forecast
//   reorderPoint : número
//   safetyStock  : número
const StockChart = ({
  currentStock,
  history = [],
  forecast = [],
  simulatedProjection = [],   // ciclo de reorden simulado (s,Q)
  orderEvents = [],           // [{ day, type: 'place'|'arrive', qty }]
  reorderPoint,
  safetyStock,
  height = 320,
}) => {
  const W = 1000, H = height;
  const pad = { l: 72, r: 24, t: 28, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  if (!history.length && !forecast.length) return null;

  // ── Reconstruir stock histórico hacia atrás ──────────────────────────────
  // Partimos del stock actual y reconstruimos semana por semana hacia el pasado:
  //   stock[t-1] = stock[t] + demanda[t] - compras[t]
  // Esto refleja correctamente los reabastecimientos (compras sube el stock).
  const histStock = [];
  let s = currentStock;
  const rev = [...history].reverse();
  for (const h of rev) {
    histStock.unshift({ day: h.day, stock: s, weekLabel: h.weekLabel, compras: h.compras || 0 });
    s = Math.max(0, s + (h.actual || 0) - (h.compras || 0));
  }

  // Punto HOY
  const todayPt = { day: 0, stock: currentStock, weekLabel: 'Hoy' };

  // ── Proyeccion futura: usa simulacion de ciclo (s,Q) si esta disponible ─────
  const futureStock = simulatedProjection.length > 0
    ? simulatedProjection
    : (() => {
        const arr = [];
        let sv = currentStock;
        for (const f of forecast) {
          sv = Math.max(0, sv - (f.mean || 0));
          arr.push({ day: f.day, stock: sv, weekLabel: f.weekLabel });
        }
        return arr;
      })();

  const allPts = [...histStock, todayPt, ...futureStock];

  // ── Escalas ───────────────────────────────────────────────────────────────
  const allVals = [...allPts.map(p => p.stock), reorderPoint, safetyStock].filter(Number.isFinite);
  const yMax = Math.max(...allVals) * 1.18;
  const yMin = 0;

  const xMin = allPts[0]?.day ?? 0;
  const xMax = allPts[allPts.length - 1]?.day ?? 0;
  const xRange = xMax - xMin || 1;

  const x = d => pad.l + ((d - xMin) / xRange) * innerW;
  const y = v => pad.t + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  // Paths separados: histórico (sólido) y futuro (punteado)
  const histPath = [...histStock, todayPt].map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)},${y(p.stock).toFixed(1)}`
  ).join(' ');

  const futurePath = [todayPt, ...futureStock].map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)},${y(p.stock).toFixed(1)}`
  ).join(' ');

  const histAreaPath = `${histPath} L${x(todayPt.day).toFixed(1)},${y(0)} L${x(histStock[0]?.day ?? 0).toFixed(1)},${y(0)} Z`;
  const futureAreaPath = `${futurePath} L${x(xMax).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`;

  // Y ticks
  const yTicks = useMemoChart(() => {
    const step = niceStep(yMax / 5);
    const ticks = [];
    for (let v = 0; v <= yMax + step; v += step) ticks.push(v);
    return ticks;
  }, [yMax]);

  // X ticks: same points as the chart
  const xTicks = allPts.map(p => p.day);

  // Primera semana futura que baja del reorder point
  const critPt = futureStock.find(p => p.stock < reorderPoint);

  // Color final del futuro
  const lastStock = futureStock.length ? futureStock[futureStock.length - 1].stock : currentStock;
  const futureColor = lastStock <= safetyStock ? 'rgb(var(--crit))' : lastStock <= reorderPoint ? 'rgb(var(--warn))' : 'rgb(var(--ok))';

  const [hover, setHover] = useStateChart(null);
  const [mousePos, setMousePos] = useStateChart({ x: 0, y: 0 });
  const svgRef = useRefChart(null);

  const onMove = e => {
    setMousePos({ x: e.clientX, y: e.clientY });
    const rect  = svgRef.current.getBoundingClientRect();
    const scale = W / rect.width;
    const mx    = (e.clientX - rect.left) * scale;
    if (mx < pad.l || mx > W - pad.r) { setHover(null); return; }
    const day = xMin + ((mx - pad.l) / innerW) * xRange;
    const snapped = allPts.reduce((best, p) =>
      Math.abs(p.day - day) < Math.abs(best.day - day) ? p : best
    );
    setHover(snapped);
  };

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="stockHistArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(var(--ink))" stopOpacity="0.10" />
            <stop offset="100%" stopColor="rgb(var(--ink))" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="stockFutureArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={futureColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={futureColor} stopOpacity="0.02" />
          </linearGradient>
          <pattern id="dangerHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(var(--crit))" strokeOpacity="0.14" strokeWidth="2" />
          </pattern>
        </defs>

        {/* Y gridlines */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)}
                  stroke="rgb(var(--line))" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle"
                  fill="rgb(var(--mute))" fontSize="11" className="tabular">
              {fmt.num(t)}
            </text>
          </g>
        ))}

        {/* Danger hatch below reorder point */}
        {reorderPoint > 0 && y(reorderPoint) < H - pad.b && (
          <rect x={pad.l} y={y(reorderPoint)} width={innerW}
                height={Math.max(0, (H - pad.b) - y(reorderPoint))}
                fill="url(#dangerHatch)" />
        )}

        {/* Reorder point line */}
        {reorderPoint > 0 && (
          <>
            <line x1={pad.l} x2={W - pad.r} y1={y(reorderPoint)} y2={y(reorderPoint)}
                  stroke="rgb(var(--warn))" strokeWidth="1.5" strokeDasharray="7 4" />
            <text x={W - pad.r - 4} y={y(reorderPoint) - 7} textAnchor="end"
                  fill="rgb(var(--warn))" fontSize="11" fontWeight="600">
              Punto de reorden · {fmt.num(Math.round(reorderPoint))}
            </text>
          </>
        )}

        {/* Safety stock line */}
        {safetyStock > 0 && (
          <>
            <line x1={pad.l} x2={W - pad.r} y1={y(safetyStock)} y2={y(safetyStock)}
                  stroke="rgb(var(--crit))" strokeWidth="1.5" strokeDasharray="3 4" />
            <text x={W - pad.r - 4} y={y(safetyStock) - 7} textAnchor="end"
                  fill="rgb(var(--crit))" fontSize="11" fontWeight="600">
              Stock de seguridad · {fmt.num(Math.round(safetyStock))}
            </text>
          </>
        )}

        {/* HOY separator */}
        <line x1={x(0)} x2={x(0)} y1={pad.t} y2={H - pad.b}
              stroke="rgb(var(--ink))" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 4" />
        <text x={x(0)} y={pad.t - 10} textAnchor="middle"
              fill="rgb(var(--ink))" fontSize="11" fontWeight="600">HOY</text>

        {/* X labels — only show one every 2-3 to avoid crowding */}
        {allPts.filter((_, i) => i % Math.max(1, Math.floor(allPts.length / 10)) === 0 || i === allPts.length - 1).map(p => (
          <text key={p.day} x={x(p.day)} y={H - pad.b + 18} textAnchor="middle"
                fill="rgb(var(--mute))" fontSize="11" className="tabular">
            {p.weekLabel}
          </text>
        ))}

        {/* Historical area */}
        <path d={histAreaPath} fill="url(#stockHistArea)" />

        {/* Historical stock line — solid */}
        <path d={histPath} fill="none" stroke="rgb(var(--ink))" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />

        {/* Future area */}
        {futureStock.length > 0 && (
          <path d={futureAreaPath} fill="url(#stockFutureArea)" />
        )}

        {/* Future stock line — dashed, colored by status */}
        {futureStock.length > 0 && (
          <path d={futurePath} fill="none" stroke={futureColor} strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 4" />
        )}

        {/* Today dot */}
        <circle cx={x(0)} cy={y(currentStock)} r="5"
                fill="rgb(var(--surf))" stroke="rgb(var(--ink))" strokeWidth="2.5" />

        {/* Purchase/restock events — green upward arrows on historical weeks with compras > 0 */}
        {histStock.filter(h => h.compras > 0).map((h, i) => (
          <g key={`restock-${i}`}>
            {/* Arrow shaft */}
            <line x1={x(h.day)} x2={x(h.day)}
                  y1={y(h.stock) + 3} y2={y(h.stock + h.compras) - 3}
                  stroke="rgb(var(--ok))" strokeWidth="1.8" strokeOpacity="0.85" />
            {/* Arrow head */}
            <polygon
              points={`${x(h.day)},${y(h.stock + h.compras) - 8} ${x(h.day) - 5},${y(h.stock + h.compras) + 2} ${x(h.day) + 5},${y(h.stock + h.compras) + 2}`}
              fill="rgb(var(--ok))" fillOpacity="0.85" />
            {/* Small dot at base */}
            <circle cx={x(h.day)} cy={y(h.stock)} r="3.5"
                    fill="rgb(var(--ok))" fillOpacity="0.7" />
          </g>
        ))}

        {/* Order events: place (orange arrow down) and arrive (green arrow up) */}
        {orderEvents.map((ev, i) => {
          const ex = x(ev.day);
          // Find stock level at this day
          const pt = futureStock.find(p => p.day === ev.day);
          const ey = pt ? y(pt.stock) : y(reorderPoint || 0);
          const isArrive = ev.type === 'arrive';
          const color = isArrive ? 'rgb(var(--ok))' : 'rgb(var(--warn))';
          const arrowY1 = isArrive ? ey + 22 : ey - 22;
          const arrowY2 = isArrive ? ey + 6  : ey - 6;
          const tipY    = isArrive ? ey + 2  : ey - 2;
          const label   = isArrive ? 'Llega pedido' : 'Colocar orden';
          return (
            <g key={`order-${i}`}>
              {/* Vertical dashed line from top/bottom edge */}
              <line x1={ex} x2={ex} y1={pad.t} y2={H - pad.b}
                    stroke={color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
              {/* Arrow */}
              <line x1={ex} x2={ex} y1={arrowY1} y2={arrowY2}
                    stroke={color} strokeWidth="2" strokeOpacity="0.9" />
              <polygon
                points={`${ex},${tipY} ${ex-5},${isArrive ? tipY+10 : tipY-10} ${ex+5},${isArrive ? tipY+10 : tipY-10}`}
                fill={color} fillOpacity="0.9" />
              {/* Label */}
              <text x={ex + 6} y={isArrive ? ey + 28 : ey - 28}
                    fill={color} fontSize="9" fontWeight="600" opacity="0.85">
                {label}
              </text>
            </g>
          );
        })}

        {/* Alert when stock first crosses reorder point (only if no simulation) */}
        {critPt && orderEvents.length === 0 && (
          <g>
            <circle cx={x(critPt.day)} cy={y(critPt.stock)} r="9"
                    fill="rgb(var(--warn))" fillOpacity="0.18"
                    stroke="rgb(var(--warn))" strokeWidth="1.5" />
            <text x={x(critPt.day)} y={y(critPt.stock) - 16}
                  textAnchor="middle" fill="rgb(var(--warn))" fontSize="10" fontWeight="700">
              ⚠
            </text>
          </g>
        )}

        {/* Hover crosshair */}
        {hover && (
          <>
            <line x1={x(hover.day)} x2={x(hover.day)} y1={pad.t} y2={H - pad.b}
                  stroke="rgb(var(--ink))" strokeOpacity="0.22" strokeWidth="1" />
            <circle cx={x(hover.day)} cy={y(hover.stock)} r="4.5"
                    fill={hover.day > 0 ? futureColor : 'rgb(var(--ink))'}
                    stroke="rgb(var(--surf))" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip — fixed */}
      {hover && (
        <div className="fixed pointer-events-none bg-ink text-[rgb(var(--surf))] rounded-md shadow-xl
                        px-3 py-2 text-[11px] tabular leading-tight z-[9999]"
             style={{
               left: Math.min(mousePos.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 220),
               top:  Math.max(mousePos.y - 80, 8),
             }}>
          <div className="font-semibold opacity-60 mb-1 text-[10px] uppercase tracking-wider">
            {hover.day === 0 ? 'Hoy' : hover.day < 0 ? `Sem ${hover.weekLabel}` : `Pronóstico ${hover.weekLabel}`}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="opacity-70">{hover.day <= 0 ? 'Stock real aprox.' : 'Stock proyectado'}</span>
            <span className={`font-semibold ${hover.stock <= safetyStock ? 'text-[rgb(var(--crit))]' : hover.stock <= reorderPoint ? 'text-[rgb(var(--warn))]' : ''}`}>
              {fmt.num(Math.round(hover.stock))} uds
            </span>
          </div>
          {hover.day > 0 && hover.stock <= reorderPoint && (
            <div className="mt-1 text-[10px] opacity-80">
              {hover.stock <= safetyStock ? '❌ Bajo stock de seguridad' : '⚠ Bajo punto de reorden'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Histogram (Metrics page) ─────────────────────────────────────────────────
const Histogram = ({ data, bins = 12, height = 180 }) => {
  if (!data?.length) return null;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const step = (max - min) / bins || 1;
  const buckets = Array(bins).fill(0);
  data.forEach(v => {
    const i = Math.min(bins - 1, Math.floor((v - min) / step));
    buckets[i]++;
  });
  const peak   = Math.max(...buckets);
  const W = 800, H = height;
  const pad    = { l: 30, r: 8, t: 14, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const bw     = innerW / bins;
  const median = [...data].sort((a, b) => a - b)[Math.floor(data.length / 2)];
  const medX   = pad.l + ((median - min) / (max - min || 1)) * innerW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={pad.l} x2={W - pad.r}
              y1={pad.t + innerH * (1 - p)} y2={pad.t + innerH * (1 - p)}
              stroke="rgb(var(--line))" strokeWidth="1" />
      ))}
      {buckets.map((c, i) => {
        const h    = (c / peak) * innerH;
        const bx   = pad.l + i * bw + 1;
        const by   = pad.t + innerH - h;
        const mid  = min + step * (i + 0.5);
        const tone = mid < 20 ? 'rgb(var(--ok))' : mid < 50 ? 'rgb(var(--ok))' : mid < 100 ? 'rgb(var(--warn))' : 'rgb(var(--crit))';
        return <rect key={i} x={bx} y={by} width={bw - 2} height={h} rx="2" fill={tone} fillOpacity="0.85" />;
      })}
      <line x1={medX} x2={medX} y1={pad.t} y2={H - pad.b}
            stroke="rgb(var(--ink))" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={medX} y={pad.t - 2} textAnchor="middle"
            fill="rgb(var(--ink))" fontSize="10" fontWeight="600" className="tabular">
        mediana {median.toFixed(1)}%
      </text>
      {[0, 25, 50, 75, 100].map(v => (
        <text key={v} x={pad.l + ((v - min) / (max - min || 1)) * innerW} y={H - 5}
              textAnchor="middle" fill="rgb(var(--mute))" fontSize="10" className="tabular">
          {v}%
        </text>
      ))}
    </svg>
  );
};

Object.assign(window, { ForecastChart, StockChart, Histogram });
