# SupplyPredict Web

Frontend for **SupplyPredict** — Toyo Foods supply-chain forecasting dashboard.

This is a **static site** built from the Claude Design handoff bundle
(`/v1/design/h/-eAhaksU4YMP7fnVUYLjag`). React 18, Babel (in-browser),
and Tailwind are loaded from CDN — there's no build step.

## Files

- `index.html` — entry point; loads CDN deps and the JSX modules
- `styles.css` — design tokens (light/dark × clean/warm/terminal aesthetics)
- `app.jsx` — shell, header, footer, route state, Tweaks panel
- `dashboard.jsx` — landing: KPIs, alert list, product table
- `product-detail.jsx` — per-SKU forecast + history
- `metrics.jsx` — WMAPE distribution + per-SKU metrics table
- `data.jsx` — mock data (480 SKUs, 8 categories) — to be wired to
  `https://supplypredict-api.onrender.com`
- `ui.jsx`, `charts.jsx`, `icons.jsx` — shared components
- `tweaks-panel.jsx` — live design-token tweaker (aesthetic, dark mode,
  severity treatment, stat-card style, chart treatment)

## Local preview

Any static server works:

```bash
python3 -m http.server 5173
# → http://localhost:5173
```

## Deploy

Vercel auto-deploys `main`. The `vercel.json` config sets
`framework: null` and `buildCommand: null` so files are served as-is,
with `.jsx` served as `text/babel` for Babel-standalone.

Live: <https://supplypredict-web.vercel.app>

## Wiring to the API

`data.jsx` currently holds mock data so the design renders end-to-end.
To switch to real data from <https://supplypredict-api.onrender.com>,
replace the `ALL_PRODUCTS` / `ALERTS` / `ACTIVITY` arrays with fetches
inside the page components (or expose a single `useApi()` hook).

## Old frontend

The previous Vite + React 19 build lives in `_old_frontend/` (gitignored).
Pull from git history if you need it.
