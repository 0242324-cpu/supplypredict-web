// Hand-rolled SVG charts. No Recharts here — gives us total visual control
// for the chart treatments the user asked about.

const { useState: useStateChart, useMemo: useMemoChart, useRef: useRefChart } = React;

// ─── Forecast chart ──────────────────────────────────────────────────────────
// props:
//   history:  [{ day: -29..0, actual }]
//   forecast: [{ day: 1..30, mean, lower, upper }]
//   projection: [{ day: 1..30, stock }]
//   reorderPoint, safetyStock, currentStock
//   treatment: 'simple' | 'danger' | 'confidence' | 'dual'
const ForecastChart = ({
  history, forecast, projection,
  reorderPoint, safetyStock, currentStock,
  treatment = 'danger',
  height = 360,
  isWeekly = false,
}) => {
  const W = 1000, H = height;
  const pad = { l: 56, r: 24, t: 30, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const all = [...history.map(d => d.actual),
               ...forecast.map(d => d.upper),
               ...forecast.map(d => d.mean),
               reorderPoint, safetyStock];
  const yMax = Math.max(...all) * 1.15;
  const yMin = 0;

  const xMin = history[0].day;
  const xMax = forecast[forecast.length - 1].day;
  const xRange = xMax - xMin;

  const x = (d) => pad.l + ((d - xMin) / xRange) * innerW;
  const y = (v) => pad.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const histPath = history.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.actual).toFixed(1)}`).join(' ');
  const forePath = forecast.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.mean).toFixed(1)}`).join(' ');

  // Bridge segment from last actual to first forecast point
  const last = history[history.length - 1];
  const first = forecast[0];
  const bridgePath = `M${x(last.day)},${y(last.actual)} L${x(first.day)},${y(first.mean)}`;

  // Confidence band area
  const ciPath = (() => {
    const top = forecast.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.upper).toFixed(1)}`).join(' ');
    const bottom = [...forecast].reverse().map((d, i) => `L${x(d.day).toFixed(1)},${y(d.lower).toFixed(1)}`).join(' ');
    return `${top} ${bottom} Z`;
  })();

  // Projection (stock over time) — secondary line
  const projPath = projection.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.day).toFixed(1)},${y(d.stock).toFixed(1)}`).join(' ');

  // Y axis ticks
  const yTicks = useMemoChart(() => {
    const step = niceStep(yMax / 5);
    const ticks = [];
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    return ticks;
  }, [yMax]);

  function niceStep(s) {
    const exp = Math.floor(Math.log10(s));
    const base = Math.pow(10, exp);
    const m = s / base;
    if (m < 1.5) return base;
    if (m < 3)   return 2 * base;
    if (m < 7)   return 5 * base;
    return 10 * base;
  }

  // X axis ticks: daily or weekly
  const xTicks = isWeekly
    ? [...history, ...forecast].map(d => d.day)  // one tick per weekly point
    : [-30, -20, -10, 0, 10, 20, 30].filter(d => d >= xMin && d <= xMax);

  // Hover state
  const [hover, setHover] = useStateChart(null);
  const svgRef = useRefChart(null);

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scale = W / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    if (mx < pad.l || mx > W - pad.r) { setHover(null); return; }
    const day = Math.round(xMin + ((mx - pad.l) / innerW) * xRange);
    if (day <= 0) {
      const h = history.find(d => d.day === day);
      if (h) setHover({ kind: 'hist', day, actual: h.actual });
    } else {
      const f = forecast.find(d => d.day === day);
      const p = projection.find(d => d.day === day);
      if (f) setHover({ kind: 'fore', day, ...f, stock: p?.stock });
    }
  };

  const showDanger = treatment === 'danger';
  const showCI = treatment === 'confidence' || treatment === 'dual';
  const showProj = treatment === 'dual';

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>

        <defs>
          <linearGradient id="histArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dangerArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--crit))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="rgb(var(--crit))" stopOpacity="0.20" />
          </linearGradient>
          <pattern id="diag" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(var(--crit))" strokeOpacity="0.18" strokeWidth="2" />
          </pattern>
        </defs>

        {/* Y gridlines */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)}
                  stroke="rgb(var(--line))" strokeWidth="1" />
            <text x={pad.l - 10} y={y(t)} textAnchor="end" dominantBaseline="middle"
                  fill="rgb(var(--mute))" fontSize="11" className="tabular">
              {fmt.num(t)}
            </text>
          </g>
        ))}

        {/* X gridline at zero baseline */}
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="rgb(var(--line))" />

        {/* Danger zone — shaded area below reorder point */}
        {showDanger && (
          <>
            <rect x={pad.l} y={y(reorderPoint)} width={innerW} height={Math.max(0, y(0) - y(reorderPoint))}
                  fill="url(#diag)" />
            <rect x={pad.l} y={y(reorderPoint)} width={innerW} height={Math.max(0, y(0) - y(reorderPoint))}
                  fill="url(#dangerArea)" />
          </>
        )}

        {/* Reorder & safety lines */}
        <line x1={pad.l} x2={W - pad.r} y1={y(reorderPoint)} y2={y(reorderPoint)}
              stroke="rgb(var(--warn))" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={W - pad.r - 4} y={y(reorderPoint) - 6} textAnchor="end"
              fill="rgb(var(--warn))" fontSize="11" fontWeight="600">
          Punto de reorden · {fmt.num(reorderPoint)}
        </text>

        <line x1={pad.l} x2={W - pad.r} y1={y(safetyStock)} y2={y(safetyStock)}
              stroke="rgb(var(--crit))" strokeWidth="1.5" strokeDasharray="3 4" />
        <text x={W - pad.r - 4} y={y(safetyStock) - 6} textAnchor="end"
              fill="rgb(var(--crit))" fontSize="11" fontWeight="600">
          Stock de seguridad · {fmt.num(safetyStock)}
        </text>

        {/* Today separator */}
        <line x1={x(0)} x2={x(0)} y1={pad.t} y2={H - pad.b}
              stroke="rgb(var(--ink))" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 4" />
        <text x={x(0)} y={pad.t - 12} textAnchor="middle"
              fill="rgb(var(--ink))" fontSize="11" fontWeight="600">HOY</text>

        {/* X axis labels */}
        {xTicks.map(t => (
          <text key={t} x={x(t)} y={H - pad.b + 18} textAnchor="middle"
                fill="rgb(var(--mute))" fontSize="11" className="tabular">
            {isWeekly
              ? (() => {
                  const pt = [...history, ...forecast].find(p => p.day === t);
                  return pt?.weekLabel || (t === 0 ? 'hoy' : `${Math.round(t/7)}s`);
                })()
              : (t === 0 ? 'hoy' : (t > 0 ? `+${t}d` : `${t}d`))}
          </text>
        ))}

        {/* Historical area fill */}
        <path d={`${histPath} L${x(last.day)},${y(0)} L${x(history[0].day)},${y(0)} Z`}
              fill="url(#histArea)" />

        {/* History line */}
        <path d={histPath} fill="none" stroke="rgb(var(--ink))" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />

        {/* CI band */}
        {showCI && (
          <path d={ciPath} fill="rgb(var(--brand))" fillOpacity="0.13" stroke="none" />
        )}

        {/* Forecast bridge */}
        <path d={bridgePath} fill="none" stroke="rgb(var(--brand))" strokeWidth="2"
              strokeLinejoin="round" strokeDasharray="3 3" opacity="0.7" />

        {/* Forecast line */}
        <path d={forePath} fill="none" stroke="rgb(var(--brand))" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 5" />

        {/* Projection (stock-on-hand) — dual mode */}
        {showProj && (
          <>
            <path d={projPath} fill="none" stroke="rgb(var(--crit))" strokeWidth="1.75"
                  strokeLinejoin="round" strokeLinecap="round" />
            <text x={x(forecast[forecast.length - 1].day)} y={y(projection[projection.length - 1].stock) - 8}
                  textAnchor="end" fill="rgb(var(--crit))" fontSize="11" fontWeight="600">
              Stock proyectado
            </text>
          </>
        )}

        {/* Now dot */}
        <circle cx={x(last.day)} cy={y(last.actual)} r="4.5"
                fill="rgb(var(--surf))" stroke="rgb(var(--ink))" strokeWidth="2" />

        {/* Hover crosshair */}
        {hover && (
          <>
            <line x1={x(hover.day)} x2={x(hover.day)} y1={pad.t} y2={H - pad.b}
                  stroke="rgb(var(--ink))" strokeOpacity="0.3" strokeWidth="1" />
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

      {/* Tooltip */}
      {hover && (
        <div className="absolute pointer-events-none bg-ink text-[rgb(var(--surf))] rounded-md shadow-lg
                        px-3 py-2 text-[11px] tabular leading-tight"
             style={{
               left: `calc(${(x(hover.day) / W) * 100}% + 8px)`,
               top: 16,
             }}>
          <div className="font-semibold opacity-70 mb-1 text-[10px] uppercase tracking-wider">
            {hover.day === 0 ? 'Hoy' : hover.day > 0 ? `+${hover.day} días` : `${Math.abs(hover.day)} días atrás`}
          </div>
          {hover.kind === 'hist' && (
            <div className="flex items-baseline gap-3">
              <span className="opacity-70">Ventas reales</span>
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
                <div className="flex items-baseline gap-3 opacity-80">
                  <span className="opacity-70">Rango 80%</span>
                  <span>{fmt.num(hover.lower)} – {fmt.num(hover.upper)}</span>
                </div>
              )}
              {showProj && hover.stock != null && (
                <div className="flex items-baseline gap-3 mt-1 pt-1 border-t border-white/15">
                  <span className="opacity-70">Stock proyectado</span>
                  <span className="font-semibold">{fmt.num(hover.stock)} uds</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Histogram (for MAPE distribution on Metrics page) ───────────────────────
const Histogram = ({ data, bins = 12, height = 180, accent = 'rgb(var(--brand))' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = (max - min) / bins;
  const buckets = Array(bins).fill(0);
  data.forEach(v => {
    const i = Math.min(bins - 1, Math.floor((v - min) / step));
    buckets[i]++;
  });
  const peak = Math.max(...buckets);
  const W = 800, H = height;
  const pad = { l: 30, r: 8, t: 12, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const bw = innerW / bins;
  const median = [...data].sort((a, b) => a - b)[Math.floor(data.length / 2)];
  const medianX = pad.l + ((median - min) / (max - min)) * innerW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = pad.t + innerH * (1 - p);
        return <line key={p} x1={pad.l} x2={W - pad.r} y1={y} y2={y}
                     stroke="rgb(var(--line))" strokeWidth="1" />;
      })}
      {buckets.map((c, i) => {
        const h = (c / peak) * innerH;
        const x = pad.l + i * bw + 1;
        const y = pad.t + innerH - h;
        const v = min + step * (i + 0.5);
        const tone = v < 40 ? 'rgb(var(--ok))' : v < 70 ? 'rgb(var(--warn))' : 'rgb(var(--crit))';
        return (
          <rect key={i} x={x} y={y} width={bw - 2} height={h} rx="2"
                fill={tone} fillOpacity="0.85" />
        );
      })}
      <line x1={medianX} x2={medianX} y1={pad.t} y2={H - pad.b}
            stroke="rgb(var(--ink))" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={medianX} y={pad.t - 2} textAnchor="middle"
            fill="rgb(var(--ink))" fontSize="10" fontWeight="600" className="tabular">
        mediana {median.toFixed(1)}%
      </text>
      {[0, 25, 50, 75, 100].map(v => (
        <text key={v} x={pad.l + ((v - min) / (max - min)) * innerW} y={H - 6}
              textAnchor="middle" fill="rgb(var(--mute))" fontSize="10" className="tabular">
          {v}%
        </text>
      ))}
    </svg>
  );
};

Object.assign(window, { ForecastChart, Histogram });
