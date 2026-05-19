// Shared UI primitives.
// Card, Badge, Button, StatCard, StockBar, Sparkline, Toast, Skeleton, etc.

const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext } = React;

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card = ({ as = 'div', className = '', children, ...rest }) => {
  const C = as;
  return (
    <C className={`card rounded-[var(--radius)] bg-surf ring-1 ring-line ${className}`} {...rest}>
      {children}
    </C>
  );
};

// ─── Badge (severity) ─────────────────────────────────────────────────────────
const SeverityBadge = ({ status, dense = false, withDot = true, withDays = false, daysLeft }) => {
  const map = {
    CRITICO: { label: 'CRÍTICO', fg: 'text-crit',  bg: 'bg-critbg', dot: 'bg-crit' },
    URGENTE: { label: 'URGENTE', fg: 'text-warn',  bg: 'bg-warnbg', dot: 'bg-warn' },
    NORMAL:  { label: 'NORMAL',  fg: 'text-ok',    bg: 'bg-okbg',   dot: 'bg-ok'  },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${s.bg} ${s.fg}
                      ${dense ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'}
                      font-semibold tracking-wider`}>
      {withDot && (
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot} ${status === 'CRITICO' ? 'pulse-crit' : ''}`} />
      )}
      {s.label}
      {withDays && daysLeft != null && (
        <span className="ml-1 opacity-70 tabular">· {daysLeft}d</span>
      )}
    </span>
  );
};

// ─── Trend arrow ──────────────────────────────────────────────────────────────
const TrendIndicator = ({ value, dense = false }) => {
  if (value > 0) {
    return <span className={`inline-flex items-center gap-0.5 text-ok ${dense ? 'text-[11px]' : 'text-xs'}`}>
      <Icon name="trend-up" size={dense ? 11 : 13} /> <span className="tabular">+{Math.round(Math.abs(value) * 100) / 100}%</span>
    </span>;
  }
  if (value < 0) {
    return <span className={`inline-flex items-center gap-0.5 text-crit ${dense ? 'text-[11px]' : 'text-xs'}`}>
      <Icon name="trend-down" size={dense ? 11 : 13} /> <span className="tabular">{Math.round(Math.abs(value) * 100) / 100}%</span>
    </span>;
  }
  return <span className={`inline-flex items-center gap-0.5 text-sub ${dense ? 'text-[11px]' : 'text-xs'}`}>—</span>;
};

// ─── Button ───────────────────────────────────────────────────────────────────
const Button = ({ variant = 'default', size = 'md', icon, iconRight, children, className = '', ...rest }) => {
  const sizes = {
    sm: 'h-7 px-2.5 text-[12px] gap-1.5',
    md: 'h-9 px-3.5 text-[13px] gap-2',
    lg: 'h-11 px-5 text-[14px] gap-2',
  };
  const variants = {
    default: 'bg-surf2 text-ink hover:bg-line ring-1 ring-line',
    primary: 'bg-brand text-[rgb(var(--brand-fg))] hover:opacity-90',
    ghost:   'bg-transparent text-sub hover:bg-surf2 hover:text-ink',
    danger:  'bg-crit text-white hover:opacity-90',
    outline: 'bg-transparent text-ink ring-1 ring-line hover:bg-surf2',
  };
  return (
    <button className={`inline-flex items-center justify-center font-medium rounded-[var(--radius-sm)]
                        transition-colors duration-100 select-none
                        ${sizes[size]} ${variants[variant]} ${className}`}
            {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 14} />}
    </button>
  );
};

// ─── Pill (segmented filter) ─────────────────────────────────────────────────
const Pill = ({ active, count, children, onClick, color }) => (
  <button onClick={onClick}
          className={`inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium
                      transition-colors ring-1
                      ${active
                        ? 'bg-ink text-[rgb(var(--surf))] ring-ink'
                        : 'bg-surf text-sub hover:text-ink ring-line hover:ring-mute'}`}>
    {color && <span className={`h-1.5 w-1.5 rounded-full ${color}`} />}
    {children}
    {count != null && (
      <span className={`tabular text-[11px] ${active ? 'opacity-70' : 'opacity-60'}`}>{count}</span>
    )}
  </button>
);

// ─── KPI / stat card with multiple treatments ────────────────────────────────
const StatCard = ({ label, value, sub, trend, icon, tone = 'brand', treatment = 'flat', spark }) => {
  // tone: brand | crit | warn | ok
  // treatment: flat | gradient | sparkline
  const toneFg = { brand: 'text-ink', crit: 'text-crit', warn: 'text-warn', ok: 'text-ok' }[tone];
  const grad   = { brand: 'grad-brand', crit: 'grad-crit', warn: 'grad-warn', ok: 'grad-ok' }[tone];

  return (
    <Card className={`relative overflow-hidden p-5 ${treatment === 'gradient' ? grad : ''}`}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-sub">{label}</div>
        {icon && (
          <div className={`h-7 w-7 rounded-[var(--radius-xs)] grid place-items-center
                          ${tone === 'crit' ? 'bg-critbg text-crit' :
                            tone === 'warn' ? 'bg-warnbg text-warn' :
                            tone === 'ok'   ? 'bg-okbg text-ok'    :
                                              'bg-surf2 text-sub'}`}>
            <Icon name={icon} size={14} />
          </div>
        )}
      </div>
      <div className={`mt-3 display text-[34px] leading-none tabular ${toneFg}`}>{value}</div>
      <div className="mt-2 flex items-center gap-2 text-[12px] text-sub">
        {trend != null && <TrendIndicator value={trend} dense />}
        <span>{sub}</span>
      </div>
      {treatment === 'sparkline' && spark && (
        <div className="mt-3 -mx-1 h-10 opacity-90">
          <Sparkline data={spark} stroke={`rgb(var(--${tone === 'brand' ? 'ink' : tone}))`}
                     fill={`rgb(var(--${tone === 'brand' ? 'ink' : tone}) / 0.12)`} />
        </div>
      )}
    </Card>
  );
};

// ─── Sparkline (mini line chart) ──────────────────────────────────────────────
const Sparkline = ({ data, stroke = 'currentColor', fill = 'transparent', strokeWidth = 1.5, height = 40 }) => {
  const w = 100, h = 100;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.9 - h * 0.05;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         className="w-full" style={{ height }}>
      {fill !== 'transparent' && <path d={areaPath} fill={fill} stroke="none" />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

// ─── Stock progress bar ───────────────────────────────────────────────────────
const StockBar = ({ stock, reorderPoint, safetyStock, max, dense = false }) => {
  const ceiling = max ?? Math.max(reorderPoint * 2.5, stock * 1.2);
  const pct = Math.min(100, (stock / ceiling) * 100);
  const safetyPct = (safetyStock / ceiling) * 100;
  const reorderPct = (reorderPoint / ceiling) * 100;
  const tone =
    stock < safetyStock ? 'bg-crit' :
    stock < reorderPoint ? 'bg-warn' :
                           'bg-ok';
  return (
    <div className={`relative w-full ${dense ? 'h-1.5' : 'h-2'} rounded-full bg-surf2 ring-1 ring-line overflow-visible`}>
      <div className={`absolute inset-y-0 left-0 ${tone} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      {/* safety stock marker */}
      <div className="absolute inset-y-[-3px] w-px bg-crit/70" style={{ left: `${safetyPct}%` }} title="Stock de seguridad" />
      {/* reorder point marker */}
      <div className="absolute inset-y-[-3px] w-px bg-warn/70" style={{ left: `${reorderPct}%` }} title="Punto de reorden" />
    </div>
  );
};

// ─── Toast system ─────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.duration ?? 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="toast-enter pointer-events-auto bg-ink text-[rgb(var(--surf))]
                                     rounded-[var(--radius-sm)] shadow-lg px-4 py-3 min-w-[280px] max-w-md
                                     flex items-start gap-3 text-[13px]">
            <div className={`mt-0.5 h-5 w-5 rounded-full grid place-items-center
                            ${t.kind === 'ok' ? 'bg-ok/25 text-ok' :
                              t.kind === 'crit' ? 'bg-crit/25 text-crit' :
                              t.kind === 'warn' ? 'bg-warn/25 text-warn' :
                                                  'bg-white/15 text-[rgb(var(--surf))]'}`}>
              <Icon name={t.kind === 'ok' ? 'check' : t.kind === 'crit' ? 'x' : t.kind === 'warn' ? 'warn' : 'info'} size={12} strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{t.title}</div>
              {t.detail && <div className="opacity-70 text-[12px] mt-0.5">{t.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => <div className={`skel ${className}`} />;

// ─── Tooltip wrapper (hover) ──────────────────────────────────────────────────
const Tip = ({ label, children, className = '' }) => {
  const [show, setShow] = useState(false);
  return (
    <span className={`relative inline-flex ${className}`}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="tooltip" style={{ bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }}>
          {label}
        </span>
      )}
    </span>
  );
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt = {
  num: (n) => new Intl.NumberFormat('es-MX').format(Math.round(n)),
  money: (n) => '$' + new Intl.NumberFormat('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n)),
  moneyK: (n) => {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
    return '$' + Math.round(n);
  },
  pct: (n) => `${Math.round(n * 10) / 10}%`,
};

Object.assign(window, {
  Card, SeverityBadge, TrendIndicator, Button, Pill,
  StatCard, Sparkline, StockBar,
  ToastProvider, useToast,
  Skeleton, Tip, fmt,
});
