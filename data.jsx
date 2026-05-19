// Mock data — Toyo Foods supply chain.
// 480 SKUs distributed across categories, with realistic-looking forecasts.
// All identifiers and copy are Spanish (MX).

const CATEGORIES = [
  { id: 'salsa',   name: 'Salsas y Aderezos',    color: 'oklch(0.65 0.14 35)'  },
  { id: 'fideos',  name: 'Fideos y Pastas',      color: 'oklch(0.70 0.12 80)'  },
  { id: 'arroz',   name: 'Arroz y Granos',       color: 'oklch(0.65 0.10 100)' },
  { id: 'aceites', name: 'Aceites y Vinagres',   color: 'oklch(0.62 0.13 60)'  },
  { id: 'conser',  name: 'Conservas',            color: 'oklch(0.58 0.12 200)' },
  { id: 'cong',    name: 'Congelados',           color: 'oklch(0.62 0.10 220)' },
  { id: 'snack',   name: 'Botanas Asiáticas',    color: 'oklch(0.66 0.14 25)'  },
  { id: 'beb',     name: 'Bebidas',              color: 'oklch(0.60 0.12 280)' },
];

const PRODUCT_NAMES = [
  ['salsa', 'Salsa de Soya Premium 500ml'],
  ['salsa', 'Salsa Teriyaki Toyo 350ml'],
  ['salsa', 'Salsa Ponzu Cítrica 250ml'],
  ['salsa', 'Salsa de Ostión Especial 510g'],
  ['salsa', 'Aderezo Goma Sésamo 300ml'],
  ['salsa', 'Salsa Tonkatsu 300ml'],
  ['salsa', 'Salsa de Anguila 500g'],
  ['salsa', 'Mirin Hon-Mirin 500ml'],
  ['salsa', 'Vinagre de Arroz 500ml'],
  ['salsa', 'Salsa Sriracha 740ml'],

  ['fideos', 'Ramen Instantáneo Shoyu (caja 24)'],
  ['fideos', 'Fideo Soba 100% Trigo Sarraceno 270g'],
  ['fideos', 'Udon Fresco 200g'],
  ['fideos', 'Fideo Somen Premium 250g'],
  ['fideos', 'Fideo de Arroz Pad Thai 400g'],
  ['fideos', 'Fideo Yakisoba 600g'],
  ['fideos', 'Pasta Chow Mein 454g'],
  ['fideos', 'Ramen Miso Picante (caja 12)'],
  ['fideos', 'Fideo Vermicelli de Frijol Mungo'],

  ['arroz', 'Arroz Koshihikari 5kg'],
  ['arroz', 'Arroz Sushi Premium 2kg'],
  ['arroz', 'Arroz Jazmín Tailandés 10kg'],
  ['arroz', 'Arroz Basmati 5kg'],
  ['arroz', 'Arroz Glutinoso Mochi 1kg'],
  ['arroz', 'Quinoa Tricolor 500g'],
  ['arroz', 'Mijo Pelado 1kg'],

  ['aceites', 'Aceite de Sésamo Tostado 250ml'],
  ['aceites', 'Aceite de Coco Virgen 1L'],
  ['aceites', 'Aceite de Chile Rayu 100ml'],
  ['aceites', 'Vinagre Negro Chinkiang 550ml'],
  ['aceites', 'Aceite de Cacahuate 1L'],
  ['aceites', 'Aceite Vegetal Wok 5L'],

  ['conser', 'Brotes de Bambú en Lata 425g'],
  ['conser', 'Castañas de Agua en Lata 227g'],
  ['conser', 'Atún en Salsa de Soya 170g'],
  ['conser', 'Almejas Baby en Lata 425g'],
  ['conser', 'Algas Wakame Seca 100g'],
  ['conser', 'Hojas de Nori Tostadas 50 hojas'],
  ['conser', 'Hongos Shiitake Secos 100g'],
  ['conser', 'Pasta de Miso Blanco 500g'],
  ['conser', 'Pasta de Miso Rojo 1kg'],
  ['conser', 'Kimchi Tradicional 500g'],
  ['conser', 'Jengibre Encurtido Gari 1.5kg'],
  ['conser', 'Daikon Encurtido Takuan 500g'],

  ['cong', 'Gyoza de Cerdo Congelado (50pz)'],
  ['cong', 'Edamame Premium 500g'],
  ['cong', 'Bao Bun Relleno (caja 30)'],
  ['cong', 'Camarón Tempura Pre-cocido 1kg'],
  ['cong', 'Pulpo Baby Sashimi 500g'],
  ['cong', 'Atún Bluefin Sashimi 1kg'],
  ['cong', 'Salmón Atlántico Sashimi 1kg'],

  ['snack', 'Senbei Galletas de Arroz 200g'],
  ['snack', 'Pocky Fresa 47g (display 30)'],
  ['snack', 'Pocky Matcha 47g (display 30)'],
  ['snack', 'Mochi Helado Variado (12pz)'],
  ['snack', 'Algas Nori Snack 5g (caja 20)'],
  ['snack', 'Cacahuate Wasabi 150g'],
  ['snack', 'Calamar Seco Sazonado 100g'],

  ['beb', 'Té Verde Sencha 100 bolsas'],
  ['beb', 'Matcha Ceremonial 30g'],
  ['beb', 'Ramune Original 200ml (caja 30)'],
  ['beb', 'Sake Junmai 720ml'],
  ['beb', 'Té Hojicha Tostado 80g'],
  ['beb', 'Leche de Soya Sin Azúcar 1L'],
];

// Seeded random — deterministic across reloads.
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(7777);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// Build 480 products. Repeat / vary names across SKUs.
function buildProducts() {
  const out = [];
  for (let i = 0; i < 480; i++) {
    const base = PRODUCT_NAMES[i % PRODUCT_NAMES.length];
    const [catId, baseName] = base;
    const cat = CATEGORIES.find(c => c.id === catId);
    const variant = i >= PRODUCT_NAMES.length ? ['', ' Caja Mayoreo', ' Pack 6', ' Pack 12', ' Reposición'][Math.floor(i / PRODUCT_NAMES.length) % 5] : '';
    const sku = `TY-${String(1000 + i).padStart(4, '0')}`;

    // Stock state
    const dailyDemand = Math.round(8 + rand() * 60);
    const leadTime = [3, 5, 7, 10, 14][Math.floor(rand() * 5)];
    const safetyStock = Math.round(dailyDemand * (rand() * 3 + 2));
    const reorderPoint = dailyDemand * leadTime + safetyStock;

    // Make ~10% critical, ~22% urgent, rest normal
    const roll = rand();
    let stock, daysLeft, status;
    if (roll < 0.10) {
      // Critical — stock below safety, days to stockout < lead time
      stock = Math.round(dailyDemand * (rand() * 3 + 0.5));
      daysLeft = Math.max(1, Math.round(stock / dailyDemand));
      status = 'CRITICO';
    } else if (roll < 0.32) {
      // Urgent — at or near reorder point
      stock = Math.round(reorderPoint * (0.85 + rand() * 0.3));
      daysLeft = Math.round(stock / dailyDemand);
      status = 'URGENTE';
    } else {
      // Normal — well stocked
      stock = Math.round(reorderPoint * (1.4 + rand() * 1.6));
      daysLeft = Math.round(stock / dailyDemand);
      status = 'NORMAL';
    }

    // WMAPE — distribution centered around 58% with a long left tail
    const wmape = Math.round((30 + rand() * 80 + (status === 'CRITICO' ? rand() * 20 : 0)) * 10) / 10;

    // Trend: -1, 0, 1
    const trend = rand() < 0.45 ? 1 : rand() < 0.7 ? -1 : 0;

    // Generate a 14-day sparkline of demand around dailyDemand
    const spark = Array.from({ length: 14 }, (_, j) => {
      const seasonal = Math.sin((j / 14) * Math.PI * 2) * dailyDemand * 0.15;
      const noise = (rand() - 0.5) * dailyDemand * 0.4;
      return Math.max(0, Math.round(dailyDemand + seasonal + noise + (trend * j * dailyDemand * 0.02)));
    });

    out.push({
      sku,
      name: baseName + variant,
      category: catId,
      categoryName: cat.name,
      stock,
      reorderPoint,
      safetyStock,
      dailyDemand,
      leadTime,
      daysLeft,
      status,
      wmape,
      trend,
      spark,
      supplier: pick(['Kikkoman MX', 'Yamamotoyama', 'Distribuidora Oriental SA', 'Nissin de México', 'Yamasaki Foods', 'Comercial Asiática del Pacífico']),
      lastOrderDate: `2026-04-${String(Math.floor(rand() * 28) + 1).padStart(2, '0')}`,
      orderQty: Math.round(dailyDemand * leadTime * (1.5 + rand() * 0.8)),
      unitCost: Math.round((20 + rand() * 480) * 100) / 100,
    });
  }
  return out;
}

const ALL_PRODUCTS = buildProducts();

// Forecast for a specific product — 30 days history + 30 days forecast.
function buildForecast(p) {
  const base = p.dailyDemand;
  const history = [];
  const r = mulberry32(parseInt(p.sku.slice(3)) + 99);
  for (let i = 29; i >= 0; i--) {
    const seasonal = Math.sin((i / 30) * Math.PI * 2 + 1) * base * 0.18;
    const trendC = p.trend * (30 - i) * base * 0.008;
    const noise = (r() - 0.5) * base * 0.3;
    history.push({
      day: -i,
      actual: Math.max(0, Math.round(base + seasonal + noise - trendC)),
    });
  }
  const forecast = [];
  for (let i = 1; i <= 30; i++) {
    const seasonal = Math.sin(((-i) / 30) * Math.PI * 2 + 1) * base * 0.18;
    const trendC = p.trend * i * base * 0.012;
    const mean = Math.max(0, Math.round(base + seasonal + trendC));
    const ci = Math.round(mean * (0.15 + i * 0.012));   // widening CI
    forecast.push({ day: i, mean, lower: Math.max(0, mean - ci), upper: mean + ci });
  }
  // Combined timeline used for stock-projection on the chart.
  let projStock = p.stock;
  const projection = forecast.map(f => {
    projStock = Math.max(0, projStock - f.mean);
    return { day: f.day, stock: projStock };
  });
  return { history, forecast, projection };
}

// Recent alerts (newest first) — derived from critical/urgent
const ALERTS = ALL_PRODUCTS
  .filter(p => p.status === 'CRITICO' || p.status === 'URGENTE')
  .sort((a, b) => a.daysLeft - b.daysLeft)
  .slice(0, 12);

// Recent activity feed
const ACTIVITY = [
  { id: 1, ts: 'hace 2 min', actor: 'Sistema',     action: 'Pronóstico actualizado', detail: '480 SKUs · LightGBM v2.3.1', kind: 'info' },
  { id: 2, ts: 'hace 14 min', actor: 'M. Hernández', action: 'Orden de compra OC-2384 generada', detail: 'TY-1003 Salsa Ponzu · 240 uds', kind: 'ok' },
  { id: 3, ts: 'hace 38 min', actor: 'Sistema',    action: 'Nueva alerta CRÍTICO',   detail: 'TY-1011 Ramen Shoyu · 2 días',  kind: 'crit' },
  { id: 4, ts: 'hace 1 h',  actor: 'C. Robles',   action: 'Exportó alertas a CSV',  detail: '12 SKUs · alertas.csv',         kind: 'info' },
  { id: 5, ts: 'hace 3 h',  actor: 'Sistema',     action: 'Ingesta de ventas POS',  detail: '18,402 registros nuevos',       kind: 'info' },
  { id: 6, ts: 'hace 5 h',  actor: 'A. Sandoval', action: 'Ajustó stock TY-1027',   detail: '+ 120 uds (recepción parcial)', kind: 'warn' },
];

// Global stats for header / dashboard hero
function computeStats() {
  const total = ALL_PRODUCTS.length;
  const crit  = ALL_PRODUCTS.filter(p => p.status === 'CRITICO').length;
  const warn  = ALL_PRODUCTS.filter(p => p.status === 'URGENTE').length;
  const ok    = total - crit - warn;
  const medianMape = 58.3;
  const inventoryValue = ALL_PRODUCTS.reduce((s, p) => s + p.stock * p.unitCost, 0);
  return { total, crit, warn, ok, medianMape, inventoryValue };
}

const STATUS_LABEL = {
  CRITICO: 'Crítico',
  URGENTE: 'Urgente',
  NORMAL:  'Normal',
};

Object.assign(window, {
  ALL_PRODUCTS,
  ALERTS,
  ACTIVITY,
  CATEGORIES,
  STATUS_LABEL,
  buildForecast,
  computeStats,
});
