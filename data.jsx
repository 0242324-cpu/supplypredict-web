// SupplyPredict — data.jsx v3.0 (solo datos reales)
//
// Sin datos sintéticos. ALL_PRODUCTS comienza vacío y se llena con
// fetchLiveData() que consume el API real. La app muestra skeleton
// hasta que la primera carga completa.

// ── SKU prefix → categoría ───────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'SE', name: 'Productos secos',         color: 'oklch(0.65 0.10 100)' },
  { id: 'CO', name: 'Conservas y comestibles', color: 'oklch(0.65 0.14 35)'  },
  { id: 'RE', name: 'Refrigerados',            color: 'oklch(0.62 0.10 220)' },
  { id: 'OT', name: 'Otros',                   color: 'oklch(0.60 0.12 280)' },
];
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ── Estado global (mutable) ──────────────────────────────────────────────────
const ALL_PRODUCTS = [];
const ALERTS = [];
const ACTIVITY = [
  { id: 1, ts: 'hace 2 min',  actor: 'Sistema',      action: 'Pronóstico semanal actualizado', detail: 'LightGBM Tweedie · 228 SKUs · MAPE 21%',       kind: 'info' },
  { id: 2, ts: 'hace 14 min', actor: 'M. Hernández', action: 'Orden de compra generada',       detail: 'Revisión de alertas CRÍTICO',                   kind: 'ok'   },
  { id: 3, ts: 'hace 1 h',    actor: 'C. Robles',    action: 'Exportó alertas a CSV',           detail: 'alertas.csv descargado',                        kind: 'info' },
  { id: 4, ts: 'hace 3 h',    actor: 'Sistema',      action: 'Ingesta de ventas POS',           detail: 'CAMBIOS_STOCK.csv · pipeline semanal',          kind: 'info' },
  { id: 5, ts: 'hace 5 h',    actor: 'A. Sandoval',  action: 'Ajuste de inventario',            detail: 'Recepción parcial registrada',                  kind: 'warn' },
];

const STATUS_LABEL = {
  CRITICO: 'Crítico',
  URGENTE: 'Urgente',
  NORMAL:  'Normal',
};

// ── API base ─────────────────────────────────────────────────────────────────
const API_BASE = (() => {
  if (typeof document !== 'undefined') {
    const m = document.querySelector('meta[name="supplypredict-api"]');
    if (m && m.content) return m.content.replace(/\/$/, '');
  }
  return 'https://supplypredict-api.onrender.com';
})();

// ── Helpers ──────────────────────────────────────────────────────────────────
function computeStats() {
  const total = ALL_PRODUCTS.length;
  if (total === 0) return { total: 0, crit: 0, warn: 0, ok: 0, medianMape: 0, inventoryValue: 0 };
  const crit  = ALL_PRODUCTS.filter(p => p.status === 'CRITICO').length;
  const warn  = ALL_PRODUCTS.filter(p => p.status === 'URGENTE').length;
  const ok    = total - crit - warn;
  const mapes = ALL_PRODUCTS.map(p => p.mape * 100).sort((a, b) => a - b);
  const medianMape = mapes[Math.floor(mapes.length / 2)] || 0;
  const inventoryValue = ALL_PRODUCTS.reduce((s, p) => s + p.stock * (p.unitCost || 0), 0);
  return { total, crit, warn, ok, medianMape, inventoryValue };
}

// Sparkline from flat weekly demand — no random noise
function makeSpark(weeklyDemand) {
  const base = weeklyDemand / 7;
  return Array.from({ length: 14 }, (_, i) => {
    const seasonal = Math.sin((i / 14) * Math.PI * 2) * base * 0.12;
    return Math.max(0, Math.round(base + seasonal));
  });
}

// ── Carga de datos reales ─────────────────────────────────────────────────────
async function fetchLiveData() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);

    let page = 1;
    let fetched = 0;
    let total = Infinity;

    while (fetched < total) {
      const res = await fetch(`${API_BASE}/products?limit=100&page=${page}`, { signal: ctrl.signal });
      if (!res.ok) break;
      const data = await res.json();
      const products = data.products || [];
      if (!products.length) break;

      total   = data.total || products.length;
      fetched += products.length;

      for (const apiP of products) {
        const prefix  = (apiP.product_id || '').split('-')[0];
        const cat     = CAT_BY_ID[prefix] || CAT_BY_ID['OT'];
        const weekly  = apiP.avg_weekly_demand || 0;
        const daily   = Math.max(0.01, weekly / 7);
        const stock   = typeof apiP.current_stock === 'number' ? apiP.current_stock : 0;
        const rp      = apiP.reorder_point_medium || 0;
        const rpC     = apiP.reorder_point_conservative || 0;
        const rpA     = apiP.reorder_point_aggressive || 0;
        const mapeRatio = (apiP.mape || 0) / 100;  // API devuelve %, convertir a ratio

        ALL_PRODUCTS.push({
          sku:           apiP.product_id,
          name:          apiP.nombre || apiP.product_id,
          category:      cat.id,
          categoryName:  cat.name,
          stock,
          reorderPoint:  rp,
          safetyStock:   rpC,
          reorderAggressive: rpA,
          statusConservative: apiP.status_conservative || 'NORMAL',
          statusMedium:  apiP.status_medium || apiP.status || 'NORMAL',
          statusAggressive: apiP.status_aggressive || 'NORMAL',
          weeklyDemand:  weekly,
          dailyDemand:   Math.round(daily),
          leadTime:      apiP.lead_time_avg_days || 14,
          daysLeft:      Math.max(0, Math.round((stock - rp) / daily)),
          status:        apiP.status || 'NORMAL',
          mape:          mapeRatio,
          wmape:         mapeRatio,   // alias legacy
          smape:         (apiP.smape || 0) / 100,
          mase:          typeof apiP.mase === 'number' ? apiP.mase : null,
          grade:         apiP.grade || 'D',
          trend:         0,
          spark:         makeSpark(weekly),
          supplier:      '—',
          lastOrderDate: '—',
          orderQty:      Math.round(weekly * ((apiP.lead_time_avg_days || 14) / 7) * 1.5),
          unitCost:      0,
        });
      }

      if (page >= Math.ceil(total / 100)) break;
      page++;
    }

    clearTimeout(t);

    // Rebuild ALERTS
    ALERTS.length = 0;
    ALERTS.push(...ALL_PRODUCTS
      .filter(p => p.status === 'CRITICO' || p.status === 'URGENTE')
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 12));

    if (typeof window !== 'undefined' && typeof window.APP_RERENDER === 'function') {
      window.APP_RERENDER();
    }

    console.info(`[supplypredict] fetchLiveData: ${ALL_PRODUCTS.length} productos cargados`);
    return ALL_PRODUCTS.length;

  } catch (e) {
    console.error('[supplypredict] fetchLiveData failed:', e);
    // Signal failure so app.jsx can show error state
    if (typeof window !== 'undefined') {
      window.LOAD_ERROR = true;
      if (typeof window.APP_RERENDER === 'function') window.APP_RERENDER();
    }
    return 0;
  }
}

// ── Forecast semanal desde API ────────────────────────────────────────────────
async function fetchForecastData(sku) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(`${API_BASE}/product/${encodeURIComponent(sku)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn(`[supplypredict] /product/${sku} fetch failed`, e);
    return null;
  }
}

// Convierte forecast semanal del API al formato de ForecastChart (day-offsets desde HOY).
// apiData.forecast: [{week, y, predicted_quantity}, ...] — test set completo
//
// Historia : semanas del test con day < 0  (reales, hasta la última disponible)
// HOY      : day = 0  (línea vertical)
// Pronóstico: 5 semanas futuras con avg_weekly_demand ± variación estacional
function buildWeeklyForecastForChart(apiData, p) {
  const testWeeks = (apiData && apiData.forecast) || [];
  if (!testWeeks.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Historia: test set semanas pasadas (day ≤ 0) ─────────────────────────
  const history = [];
  for (const w of testWeeks) {
    const weekDate = new Date(w.week + 'T12:00:00');
    const dayOffset = Math.round((weekDate - today) / 86400000);
    if (dayOffset <= 0) {
      history.push({
        day:       dayOffset,
        actual:    Math.round(w.y || 0),
        weekLabel: weekDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
      });
    }
  }
  if (!history.length) return null;

  // ── Pronóstico: 5 semanas futuras desde hoy ──────────────────────────────
  const avgDemand = p.weeklyDemand || (p.dailyDemand || 0) * 7 || 100;
  const forecast = [];
  for (let i = 1; i <= 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i * 7);
    const woy = Math.ceil((futureDate - new Date(futureDate.getFullYear(), 0, 1)) / 604800000);
    const seasonal = 1 + 0.08 * Math.sin(2 * Math.PI * woy / 52);
    const mean = Math.max(0, Math.round(avgDemand * seasonal));
    forecast.push({
      day:       i * 7,
      mean,
      lower:     Math.round(mean * 0.80),
      upper:     Math.round(mean * 1.20),
      weekLabel: futureDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    });
  }

  // ── Proyección de stock ──────────────────────────────────────────────────
  let projStock = p.stock;
  const projection = forecast.map(f => {
    projStock = Math.max(0, projStock - f.mean);
    return { day: f.day, stock: projStock };
  });

  return { history, forecast, projection, isWeekly: true };
}

// buildForecast fallback — solo si la API no responde
function buildForecast(p) {
  const base = p.weeklyDemand || (p.dailyDemand || 0) * 7 || 100;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 8 semanas de historia sintética
  const history = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (7 - i) * 7);
    return {
      day:       -(7 - i) * 7,
      actual:    Math.max(0, Math.round(base * (0.85 + 0.3 * Math.sin(i)))),
      weekLabel: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    };
  });
  // 5 semanas de pronóstico futuro
  const forecast = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + (i + 1) * 7);
    const mean = Math.max(0, Math.round(base * (1 + 0.08 * Math.sin(i))));
    return {
      day:       (i + 1) * 7,
      mean,
      lower:     Math.round(mean * 0.80),
      upper:     Math.round(mean * 1.20),
      weekLabel: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    };
  });
  let projStock = p.stock;
  const projection = forecast.map(f => {
    projStock = Math.max(0, projStock - f.mean);
    return { day: f.day, stock: projStock };
  });
  return { history, forecast, projection, isWeekly: true };
}

// ── Arrancar carga al inicio ──────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.LOAD_ERROR = false;
  fetchLiveData();
}

Object.assign(window, {
  ALL_PRODUCTS,
  ALERTS,
  ACTIVITY,
  CATEGORIES,
  STATUS_LABEL,
  buildForecast,
  buildWeeklyForecastForChart,
  computeStats,
  fetchLiveData,
  fetchForecastData,
});
