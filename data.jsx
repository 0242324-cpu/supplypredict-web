// SupplyPredict — catalog backed by the real Toyo Foods SKU list.
//
// Codes are the 494 real SKUs from df_supply_clean.csv (the SALDOINICIAL row
// is a data artifact, not a product, so it's excluded).
//
// Descriptions: we ship with `name = sku` so codes render correctly on first
// paint, then asynchronously fetch /product-names from the live API and
// upgrade names in place (force-rerender via APP_RERENDER). The API currently
// returns descriptions for ~346/494 SKUs; the rest keep the SKU as their
// display name until that mapping grows.
//
// Stock / demand / forecast / WMAPE values are still simulated for now (the
// design's severity counts and chart shapes depend on a controlled distribution).
// When you're ready, swap `buildProducts` over to fetch /products + /product/{sku}
// from the live API — the page components only read from window.ALL_PRODUCTS, so
// the swap-in is local to this file.

// ── SKU prefix → category. Two-letter prefixes used by Toyo's coding scheme. ──
const CATEGORIES = [
  { id: 'SE', name: 'Productos secos',      color: 'oklch(0.65 0.10 100)' },
  { id: 'CO', name: 'Conservas y comestibles', color: 'oklch(0.65 0.14 35)'  },
  { id: 'RE', name: 'Refrigerados',         color: 'oklch(0.62 0.10 220)' },
  { id: 'OT', name: 'Otros',                color: 'oklch(0.60 0.12 280)' },
];
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Real SKUs from df_supply_clean.csv (494 products).
const REAL_SKUS = [
  "CO-CAR201-10890",
  "CO-CAR201-10891",
  "CO-CAR201-6301",
  "CO-CAR202-8082",
  "CO-DGB309-2133",
  "CO-DGB309-2157",
  "CO-DGB309-2159",
  "CO-DGB309-2160",
  "CO-DGB309-2161",
  "CO-FVL354-3030",
  "CO-FVL356-0522",
  "CO-FVL356-1512",
  "CO-FVL356-6031",
  "CO-FVL356-8665",
  "CO-FVL357-5141",
  "CO-FVL399-8315",
  "CO-HYE449-7719",
  "CO-PDM450-0176",
  "CO-PDM450-10620",
  "CO-PDM451-1841",
  "CO-PDM451-2342",
  "CO-PDM452-1278",
  "CO-PDM452-1516",
  "CO-PDM452-1518",
  "CO-PDM452-7974",
  "CO-PDM452-9155",
  "CO-PDM453-11660",
  "CO-PDM453-1606",
  "CO-PDM453-3986",
  "CO-PDM453-8551",
  "CO-PDM453-9524",
  "CO-PDM453-9525",
  "CO-PDM454-0619",
  "CO-PDM454-10684",
  "CO-PDM454-9727",
  "CO-PDM454-9728",
  "CO-PDM454-9902",
  "CO-PDM454-9940",
  "CO-PDM456-0043",
  "CO-PDM456-0044",
  "CO-PDM456-11588",
  "CO-PDM456-11589",
  "CO-PDM456-11872",
  "CO-PDM456-13112",
  "CO-PDM456-1388",
  "CO-PDM456-1392",
  "CO-PDM456-2438",
  "CO-PDM456-3530",
  "CO-PDM456-9830",
  "CO-PDM458-9766",
  "CO-PDM458-9767",
  "CO-PDM458-9801",
  "CO-PDM458-9804",
  "CO-PDM499-10736",
  "CO-PDM499-6120",
  "CO-SFP602-10089",
  "CO-SFP602-10323",
  "CO-SFP602-4788",
  "CO-SFP602-5743",
  "CO-SFP602-6804",
  "CO-SFP603-4127",
  "CO-SFP606-1147",
  "CO-SFP606-7121",
  "CO-SFP649-6116",
  "CO-SYE558-6000",
  "CO-TYE751-0208",
  "CO-TYE751-1324",
  "CO-TYE752-1323",
  "CO-TYE752-2021",
  "CO-TYE753-0213",
  "CO-TYE753-1325",
  "CO-TYE755-11585",
  "CO-TYE755-11682",
  "CO-TYE755-1768",
  "CO-TYE755-1899",
  "CO-TYE755-1900",
  "CO-TYE755-5391",
  "CO-TYE755-8977",
  "CO-TYE755-9904",
  "CO-TYE755-9905",
  "OT-UTE800-8678",
  "OT-UTE804-11365",
  "OT-UTE804-1577",
  "OT-UTE804-1839",
  "OT-UTE805-10748",
  "OT-UTE805-8693",
  "OT-UTE805-9293",
  "OT-UTE807-1946",
  "OT-UTE807-5311",
  "OT-UTE899-0255",
  "OT-UTE899-3614",
  "OT-UTE899-4151",
  "OT-UTE899-5280",
  "OT-UTE899-5987",
  "OT-UTE899-5999",
  "OT-UTE899-6421",
  "RE-BEB152-0098",
  "RE-BEB159-0096",
  "RE-FVL350-10044",
  "RE-FVL350-11764",
  "RE-FVL350-11765",
  "RE-FVL350-11766",
  "RE-FVL350-11940",
  "RE-FVL350-13727",
  "RE-FVL350-13729",
  "RE-FVL350-13730",
  "RE-FVL350-9655",
  "RE-FVL350-9973",
  "RE-FVL350-9974",
  "RE-FVL355-0529",
  "RE-FVL355-1270",
  "RE-FVL357-0523",
  "RE-FVL357-0524",
  "RE-FVL357-4672",
  "RE-PDM456-5578",
  "RE-SYE551-0988",
  "RE-SYE551-1002",
  "RE-SYE551-1906",
  "RE-SYE551-7892",
  "RE-SYE552-1947",
  "RE-SYE556-4678",
  "RE-SYE599-0828",
  "RE-TQO701-0847",
  "RE-TQO701-0848",
  "RE-TQO701-8978",
  "RE-TQO702-0581",
  "RE-TQO702-0582",
  "RE-TQO702-0584",
  "RE-TQO702-0585",
  "RE-TQO702-4369",
  "SE-ACE050-0701",
  "SE-ACE050-0702",
  "SE-ACE050-0703",
  "SE-ACE050-1101",
  "SE-ACE050-7079",
  "SE-ACE099-10941",
  "SE-ACE099-1875",
  "SE-ARR101-0063",
  "SE-ARR101-0065",
  "SE-ARR101-0066",
  "SE-ARR101-0833",
  "SE-ARR101-0836",
  "SE-ARR101-0838",
  "SE-ARR101-10709",
  "SE-ARR101-1205",
  "SE-ARR101-1206",
  "SE-ARR101-1786",
  "SE-ARR101-1888",
  "SE-ARR101-1889",
  "SE-ARR101-4518",
  "SE-ARR101-4781",
  "SE-ARR102-11297",
  "SE-ARR102-11328",
  "SE-ARR102-11401",
  "SE-ARR102-1813",
  "SE-ARR102-2882",
  "SE-ARR103-3525",
  "SE-ARR149-11326",
  "SE-ARR149-1442",
  "SE-BEB150-12593",
  "SE-BEB150-12594",
  "SE-BEB150-13474",
  "SE-BEB151-0920",
  "SE-BEB151-11268",
  "SE-BEB151-1429",
  "SE-BEB151-1430",
  "SE-BEB151-1432",
  "SE-BEB151-8538",
  "SE-BEB152-0097",
  "SE-BEB153-0121",
  "SE-BEB153-0876",
  "SE-BEB153-10006",
  "SE-BEB153-10007",
  "SE-BEB153-10008",
  "SE-BEB153-11094",
  "SE-BEB154-0543",
  "SE-BEB154-10950",
  "SE-BEB154-10951",
  "SE-BEB154-10952",
  "SE-BEB154-10953",
  "SE-BEB154-10954",
  "SE-BEB154-11893",
  "SE-BEB154-12246",
  "SE-BEB154-2283",
  "SE-BEB154-2343",
  "SE-BEB154-2344",
  "SE-BEB154-2345",
  "SE-BEB154-2346",
  "SE-BEB154-2848",
  "SE-BEB154-9916",
  "SE-BEB154-9917",
  "SE-BEB154-9918",
  "SE-BEB155-12180",
  "SE-BEB155-12181",
  "SE-BEB155-12182",
  "SE-BEB155-12183",
  "SE-BEB157-2338",
  "SE-BEB157-3982",
  "SE-BEB157-5610",
  "SE-BEB157-9598",
  "SE-BEB158-10883",
  "SE-BEB158-10884",
  "SE-BEB158-11691",
  "SE-BEB158-5776",
  "SE-BEB158-7899",
  "SE-BEB158-8059",
  "SE-BEB158-8505",
  "SE-BEB159-11722",
  "SE-BEB159-11723",
  "SE-BEB159-11724",
  "SE-BEB159-11725",
  "SE-BEB159-11726",
  "SE-BEB159-11727",
  "SE-BEB159-12595",
  "SE-BEB159-12596",
  "SE-BEB159-12598",
  "SE-BEB159-12599",
  "SE-BEB159-12600",
  "SE-BEB159-12601",
  "SE-BEB159-12824",
  "SE-BEB159-12825",
  "SE-BEB159-12826",
  "SE-BEB159-13475",
  "SE-BEB160-4910",
  "SE-BEB199-13606",
  "SE-BEB199-13607",
  "SE-BEB199-8467",
  "SE-DEL250-9584",
  "SE-DGB302-11832",
  "SE-DGB302-12673",
  "SE-DGB302-12674",
  "SE-DGB302-12675",
  "SE-DGB302-12676",
  "SE-DGB302-12678",
  "SE-DGB302-12687",
  "SE-DGB302-13558",
  "SE-DGB302-13559",
  "SE-DGB302-13560",
  "SE-DGB302-13614",
  "SE-DGB302-13955",
  "SE-DGB302-14012",
  "SE-DGB303-0485",
  "SE-DGB303-11344",
  "SE-DGB303-11346",
  "SE-DGB303-11347",
  "SE-DGB303-12396",
  "SE-DGB303-2128",
  "SE-DGB303-2862",
  "SE-DGB303-3104",
  "SE-DGB303-3454",
  "SE-DGB303-3456",
  "SE-DGB303-3658",
  "SE-DGB303-4007",
  "SE-DGB303-4008",
  "SE-DGB303-4134",
  "SE-DGB303-4135",
  "SE-DGB303-4719",
  "SE-DGB303-4720",
  "SE-DGB303-4721",
  "SE-DGB303-4780",
  "SE-DGB303-8494",
  "SE-DGB304-0473",
  "SE-DGB304-12727",
  "SE-DGB304-2126",
  "SE-DGB304-2127",
  "SE-DGB304-9777",
  "SE-DGB309-10268",
  "SE-DGB309-10272",
  "SE-DGB309-10273",
  "SE-DGB309-10274",
  "SE-DGB309-10275",
  "SE-DGB309-10277",
  "SE-DGB309-10278",
  "SE-DGB309-10341",
  "SE-DGB309-10342",
  "SE-DGB309-12121",
  "SE-DGB309-12122",
  "SE-DGB309-12123",
  "SE-DGB309-12124",
  "SE-DGB309-6096",
  "SE-FVL353-0648",
  "SE-FVL358-10122",
  "SE-FVL358-1944",
  "SE-FVL359-2136",
  "SE-FVL397-9883",
  "SE-HYE400-0240",
  "SE-HYE402-1832",
  "SE-HYE402-1970",
  "SE-HYE402-4950",
  "SE-HYE403-10027",
  "SE-HYE403-11103",
  "SE-HYE403-11104",
  "SE-HYE403-1315",
  "SE-HYE403-1926",
  "SE-HYE403-1978",
  "SE-HYE403-1979",
  "SE-HYE403-1980",
  "SE-HYE403-4153",
  "SE-HYE449-0107",
  "SE-HYE449-10281",
  "SE-HYE449-10282",
  "SE-HYE449-6877",
  "SE-PDM450-10026",
  "SE-PDM450-1798",
  "SE-PDM450-1799",
  "SE-PDM450-1909",
  "SE-PDM450-1910",
  "SE-PDM450-1912",
  "SE-PDM450-1913",
  "SE-PDM450-1914",
  "SE-PDM450-1915",
  "SE-PDM450-2038",
  "SE-PDM450-2902",
  "SE-PDM450-4086",
  "SE-PDM450-5475",
  "SE-PDM450-8666",
  "SE-PDM453-10346",
  "SE-PDM457-11392",
  "SE-PDM457-4671",
  "SE-SAL500-0864",
  "SE-SAL500-0882",
  "SE-SAL500-0885",
  "SE-SAL500-0887",
  "SE-SAL500-0895",
  "SE-SAL500-0896",
  "SE-SAL500-0897",
  "SE-SAL500-0900",
  "SE-SAL500-0907",
  "SE-SAL500-3033",
  "SE-SAL500-4231",
  "SE-SAL500-4748",
  "SE-SAL501-8723",
  "SE-SAL501-8724",
  "SE-SAL502-0787",
  "SE-SAL502-0788",
  "SE-SAL502-0793",
  "SE-SAL502-0795",
  "SE-SAL502-0796",
  "SE-SAL502-0910",
  "SE-SAL502-0921",
  "SE-SAL502-10098",
  "SE-SAL502-1313",
  "SE-SAL502-1351",
  "SE-SAL502-1936",
  "SE-SAL502-1937",
  "SE-SAL502-1938",
  "SE-SAL502-2073",
  "SE-SAL502-2075",
  "SE-SAL502-2917",
  "SE-SAL502-4202",
  "SE-SAL502-9726",
  "SE-SAL503-0803",
  "SE-SAL503-1075",
  "SE-SAL503-10895",
  "SE-SAL503-1934",
  "SE-SAL503-1935",
  "SE-SAL503-7750",
  "SE-SAL504-0002",
  "SE-SAL504-0130",
  "SE-SAL504-0155",
  "SE-SAL504-0940",
  "SE-SAL504-0941",
  "SE-SAL504-0942",
  "SE-SAL504-1316",
  "SE-SAL504-2887",
  "SE-SAL504-7787",
  "SE-SAL505-0552",
  "SE-SAL505-10747",
  "SE-SAL549-10744",
  "SE-SAL549-10745",
  "SE-SAL549-11112",
  "SE-SAL549-11360",
  "SE-SAL549-1769",
  "SE-SAL549-1770",
  "SE-SAL549-5474",
  "SE-SFP400-11963",
  "SE-SFP600-0246",
  "SE-SFP600-0247",
  "SE-SFP600-10864",
  "SE-SFP601-10127",
  "SE-SFP601-11107",
  "SE-SFP601-1389",
  "SE-SFP601-6782",
  "SE-SFP601-9675",
  "SE-SFP602-2616",
  "SE-SFP603-0138",
  "SE-SFP603-0139",
  "SE-SFP603-10657",
  "SE-SFP604-0541",
  "SE-SFP604-11559",
  "SE-SFP604-2007",
  "SE-SFP604-5309",
  "SE-SFP606-10800",
  "SE-SFP606-10801",
  "SE-SFP606-10803",
  "SE-SFP606-10804",
  "SE-SFP606-11139",
  "SE-SFP606-11299",
  "SE-SFP606-11311",
  "SE-SFP606-11312",
  "SE-SFP606-11313",
  "SE-SFP606-11317",
  "SE-SFP606-11318",
  "SE-SFP606-11319",
  "SE-SFP606-11366",
  "SE-SFP606-11476",
  "SE-SFP606-11477",
  "SE-SFP606-11478",
  "SE-SFP606-11479",
  "SE-SFP606-11816",
  "SE-SFP606-11817",
  "SE-SFP606-11850",
  "SE-SFP606-11851",
  "SE-SFP606-11852",
  "SE-SFP606-11854",
  "SE-SFP606-11855",
  "SE-SFP606-11991",
  "SE-SFP606-12100",
  "SE-SFP606-1250",
  "SE-SFP606-1251",
  "SE-SFP606-1258",
  "SE-SFP606-12972",
  "SE-SFP606-12973",
  "SE-SFP606-1301",
  "SE-SFP606-13044",
  "SE-SFP606-13276",
  "SE-SFP606-1434",
  "SE-SFP606-3980",
  "SE-SFP606-6097",
  "SE-SFP606-7122",
  "SE-SFP606-7151",
  "SE-SFP606-7235",
  "SE-SFP606-7236",
  "SE-SFP606-7759",
  "SE-SFP606-8018",
  "SE-SFP606-9812",
  "SE-SFP606-9838",
  "SE-SFP606-9839",
  "SE-SFP606-9840",
  "SE-SFP606-9841",
  "SE-SFP606-9861",
  "SE-SFP606-9862",
  "SE-SFP649-0035",
  "SE-SYE550-1447",
  "SE-SYE553-1486",
  "SE-SYE553-1932",
  "SE-SYE555-8459",
  "SE-SYE558-0470",
  "SE-SYE558-1386",
  "SE-SYE558-1543",
  "SE-SYE558-1884",
  "SE-SYE558-1885",
  "SE-SYE558-1943",
  "SE-SYE558-4048",
  "SE-SYE558-4049",
  "SE-SYE558-4405",
  "SE-SYE558-4406",
  "SE-SYE558-4407",
  "SE-SYE558-6392",
  "SE-SYE558-8688",
  "SE-SYE558-9811",
  "SE-SYE559-1801",
  "SE-SYE559-1803",
  "SE-SYE559-1905",
  "SE-SYE599-0018",
  "SE-SYE599-0024",
  "SE-SYE599-1084",
  "SE-SYE599-1085",
  "SE-SYE599-1086",
  "SE-SYE599-1087",
  "SE-SYE599-1088",
  "SE-SYE599-1089",
  "SE-SYE599-10940",
  "SE-SYE599-1131",
  "SE-SYE599-1132",
  "SE-SYE599-13046",
  "SE-SYE599-2023",
  "SE-SYE599-2947",
  "SE-SYE599-2962",
  "SE-SYE599-5231",
  "SE-SYE599-6765",
  "SE-TE650-8463",
  "SE-TE651-10923",
  "SE-TE652-8465",
  "SE-TE653-8464",
  "SE-TQO702-1111",
  "SE-TQO702-1113",
  "SE-TQO702-12625",
  "SE-TQO702-12626",
  "SE-TYE750-10386",
  "SE-TYE750-9965",
  "SE-TYE754-1097",
  "SE-TYE754-1098",
  "SE-TYE754-1099"
];

// Will be populated by fetchProductNames() from /product-names. SKUs not in
// the map fall back to the SKU as their display name.
let PRODUCT_NAMES = {};

// API base — set via <meta name="supplypredict-api"> in index.html, else fall
// back to the live Render deployment.
const API_BASE = (() => {
  if (typeof document !== 'undefined') {
    const m = document.querySelector('meta[name="supplypredict-api"]');
    if (m && m.content) return m.content.replace(/\/$/, '');
  }
  return 'https://supplypredict-api.onrender.com';
})();

// ── Seeded RNG so demos are deterministic across reloads ─────────────────────
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

// Build product objects from the real SKU list.
function buildProducts() {
  const out = [];
  for (let i = 0; i < REAL_SKUS.length; i++) {
    const sku = REAL_SKUS[i];
    const prefix = sku.split('-')[0];
    const cat = CAT_BY_ID[prefix] || CAT_BY_ID['OT'];

    // Simulated demand / stock — same generation logic as before, keyed off SKU
    // index so reload is stable.
    const dailyDemand = Math.round(8 + rand() * 60);
    const leadTime = [3, 5, 7, 10, 14][Math.floor(rand() * 5)];
    const safetyStock = Math.round(dailyDemand * (rand() * 3 + 2));
    const reorderPoint = dailyDemand * leadTime + safetyStock;

    const roll = rand();
    let stock, daysLeft, status;
    if (roll < 0.10) {
      stock = Math.round(dailyDemand * (rand() * 3 + 0.5));
      daysLeft = Math.max(1, Math.round(stock / dailyDemand));
      status = 'CRITICO';
    } else if (roll < 0.32) {
      stock = Math.round(reorderPoint * (0.85 + rand() * 0.3));
      daysLeft = Math.round(stock / dailyDemand);
      status = 'URGENTE';
    } else {
      stock = Math.round(reorderPoint * (1.4 + rand() * 1.6));
      daysLeft = Math.round(stock / dailyDemand);
      status = 'NORMAL';
    }

    const wmape = Math.round((30 + rand() * 80 + (status === 'CRITICO' ? rand() * 20 : 0)) * 10) / 10;
    const trend = rand() < 0.45 ? 1 : rand() < 0.7 ? -1 : 0;
    const spark = Array.from({ length: 14 }, (_, j) => {
      const seasonal = Math.sin((j / 14) * Math.PI * 2) * dailyDemand * 0.15;
      const noise = (rand() - 0.5) * dailyDemand * 0.4;
      return Math.max(0, Math.round(dailyDemand + seasonal + noise + (trend * j * dailyDemand * 0.02)));
    });

    out.push({
      sku,
      // Initial display name = SKU. fetchProductNames() upgrades this in-place
      // once the live mapping is available.
      name: sku,
      category: cat.id,
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
      supplier: pick(['Proveedor A', 'Proveedor B', 'Proveedor C', 'Proveedor D', 'Proveedor E']),
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
  // Seed by SKU hash so forecasts stay stable per product.
  let h = 0;
  for (let i = 0; i < p.sku.length; i++) h = (h * 31 + p.sku.charCodeAt(i)) | 0;
  const r = mulberry32(Math.abs(h) + 99);

  const history = [];
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
    const ci = Math.round(mean * (0.15 + i * 0.012));
    forecast.push({ day: i, mean, lower: Math.max(0, mean - ci), upper: mean + ci });
  }
  let projStock = p.stock;
  const projection = forecast.map(f => {
    projStock = Math.max(0, projStock - f.mean);
    return { day: f.day, stock: projStock };
  });
  return { history, forecast, projection };
}

// Alerts (newest first) — derived from critical/urgent.
const ALERTS = ALL_PRODUCTS
  .filter(p => p.status === 'CRITICO' || p.status === 'URGENTE')
  .sort((a, b) => a.daysLeft - b.daysLeft)
  .slice(0, 12);

// Recent activity feed. Uses real-looking SKUs from the catalog.
const _firstCrit = ALERTS.find(p => p.status === 'CRITICO');
const _firstWarn = ALERTS.find(p => p.status === 'URGENTE');
const ACTIVITY = [
  { id: 1, ts: 'hace 2 min', actor: 'Sistema',     action: 'Pronóstico actualizado',     detail: `${ALL_PRODUCTS.length} SKUs · LightGBM v2.3.1`, kind: 'info' },
  { id: 2, ts: 'hace 14 min', actor: 'M. Hernández', action: 'Orden de compra OC-2384 generada', detail: _firstWarn ? `${_firstWarn.sku} · ${_firstWarn.orderQty} uds` : '—', kind: 'ok'   },
  { id: 3, ts: 'hace 38 min', actor: 'Sistema',    action: 'Nueva alerta CRÍTICO',       detail: _firstCrit ? `${_firstCrit.sku} · ${_firstCrit.daysLeft} días` : '—',   kind: 'crit' },
  { id: 4, ts: 'hace 1 h',  actor: 'C. Robles',   action: 'Exportó alertas a CSV',      detail: `${ALERTS.length} SKUs · alertas.csv`,            kind: 'info' },
  { id: 5, ts: 'hace 3 h',  actor: 'Sistema',     action: 'Ingesta de ventas POS',      detail: '18,402 registros nuevos',                        kind: 'info' },
  { id: 6, ts: 'hace 5 h',  actor: 'A. Sandoval', action: `Ajustó stock ${ALL_PRODUCTS[26].sku}`, detail: '+ 120 uds (recepción parcial)',         kind: 'warn' },
];

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

// ── Live name upgrade ────────────────────────────────────────────────────────
// App.jsx registers a callback into window.APP_RERENDER so we can trigger a
// React re-render once the names map arrives.
function applyProductNames(map) {
  if (!map || typeof map !== 'object') return 0;
  PRODUCT_NAMES = map;
  let hits = 0;
  for (const p of ALL_PRODUCTS) {
    const n = map[p.sku];
    if (n && typeof n === 'string') {
      p.name = n;
      hits++;
    }
  }
  if (typeof window !== 'undefined' && typeof window.APP_RERENDER === 'function') {
    window.APP_RERENDER();
  }
  return hits;
}

async function fetchProductNames() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${API_BASE}/product-names`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const hits = applyProductNames(data);
    console.info(`[supplypredict] product-names upgraded ${hits}/${ALL_PRODUCTS.length} SKUs`);
    return hits;
  } catch (e) {
    console.warn('[supplypredict] /product-names fetch failed, falling back to SKU-as-name', e);
    return 0;
  }
}

// Kick off the fetch immediately. App.jsx will install window.APP_RERENDER
// before the first useEffect; if the fetch finishes before that, we still
// mutate ALL_PRODUCTS in place so the first render shows the right names.
if (typeof window !== 'undefined') {
  fetchProductNames();
}

Object.assign(window, {
  ALL_PRODUCTS,
  ALERTS,
  ACTIVITY,
  CATEGORIES,
  STATUS_LABEL,
  buildForecast,
  computeStats,
  applyProductNames,
  fetchProductNames,
});
