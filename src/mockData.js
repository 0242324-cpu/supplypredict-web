// Mock data — replaced by real API when backend is live
export const MOCK_DASHBOARD = {
  total_products: 495,
  critical_alerts: 495,
  urgent_alerts: 0,
  normal_count: 0,
  pct_at_risk: 100,
  top_alerts: [
    { product_id: "SE-DGB302-12675", current_stock: -41423, reorder_point: 844966, lead_time_days: 73.6, days_coverage: -3.7, status: "CRÍTICO", qty_recommended: 377114 },
    { product_id: "SE-SFP606-1258",  current_stock: -6617,  reorder_point: 131935, lead_time_days: 80,   days_coverage: -4.1, status: "CRÍTICO", qty_recommended: 55122 },
    { product_id: "SE-BEB159-11725", current_stock: -6492,  reorder_point: 99125,  lead_time_days: 55.6, days_coverage: -3.7, status: "CRÍTICO", qty_recommended: 59036 },
    { product_id: "SE-BEB155-12181", current_stock: -6747,  reorder_point: 201205, lead_time_days: 86.8, days_coverage: -2.9, status: "CRÍTICO", qty_recommended: 75708 },
    { product_id: "SE-BEB155-12180", current_stock: -5930,  reorder_point: 184640, lead_time_days: 88.6, days_coverage: -2.9, status: "CRÍTICO", qty_recommended: 67936 },
    { product_id: "SE-BEB159-11723", current_stock: -5224,  reorder_point: 84691,  lead_time_days: 55.6, days_coverage: -3.5, status: "CRÍTICO", qty_recommended: 50259 },
    { product_id: "CO-CAR201-10890", current_stock: 313,    reorder_point: 8200,   lead_time_days: 27,   days_coverage: 0.8,  status: "CRÍTICO", qty_recommended: 12000 },
    { product_id: "SE-ARR101-0838",  current_stock: -95,    reorder_point: 1200,   lead_time_days: 7,    days_coverage: -1.2, status: "CRÍTICO", qty_recommended: 3000 },
    { product_id: "SE-BEB154-2848",  current_stock: -3100,  reorder_point: 55000,  lead_time_days: 60,   days_coverage: -2.1, status: "CRÍTICO", qty_recommended: 28000 },
    { product_id: "CO-PDM453-11660", current_stock: 108,    reorder_point: 4200,   lead_time_days: 18,   days_coverage: 0.5,  status: "CRÍTICO", qty_recommended: 7000 },
  ],
};

export const MOCK_PRODUCTS = Array.from({ length: 50 }, (_, i) => ({
  product_id: `PROD-${String(i+1).padStart(4,'0')}`,
  current_stock: Math.floor(Math.random() * 10000) - 6000,
  reorder_point: Math.floor(Math.random() * 50000) + 1000,
  lead_time_days: Math.floor(Math.random() * 80) + 5,
  avg_daily_sales: Math.floor(Math.random() * 500) + 10,
  days_coverage: (Math.random() * 10) - 5,
  status: "CRÍTICO",
  qty_recommended: Math.floor(Math.random() * 50000) + 1000,
}));

export const MOCK_FORECAST = {
  dates: ["2026-04-07","2026-04-14","2026-04-21","2026-04-28","2026-05-05"],
  yhat: [84000, 91000, 87500, 95000, 88000],
  yhat_lower: [70000, 76000, 72000, 80000, 73000],
  yhat_upper: [98000, 106000, 103000, 110000, 103000],
};
