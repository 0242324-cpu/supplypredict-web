// App shell — header, nav, dark-mode, route state, Tweaks integration.

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aesthetic": "terminal",
  "dark": false,
  "severityTreatment": "badge",
  "statTreatment": "sparkline",
  "chartTreatment": "confidence",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateA({ name: 'dashboard', sku: null });

  // Apply aesthetic + dark to <html>
  useEffectA(() => {
    document.documentElement.setAttribute('data-aesthetic', tweaks.aesthetic);
    document.documentElement.classList.toggle('dark', !!tweaks.dark);
  }, [tweaks.aesthetic, tweaks.dark]);

  const navigate = (name, sku = null) => {
    setRoute({ name, sku });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openProduct = (sku) => navigate('product', sku);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-page text-ink">
        <Header current={route.name}
                tweaks={tweaks}
                onNavigate={navigate}
                onToggleDark={() => setTweak('dark', !tweaks.dark)} />

        <main>
          {route.name === 'dashboard' && (
            <Dashboard tweaks={tweaks}
                       onOpenProduct={openProduct}
                       onNavigate={navigate} />
          )}
          {route.name === 'product' && (
            <ProductDetail sku={route.sku}
                           tweaks={tweaks}
                           onBack={() => navigate('dashboard')}
                           onOpenProduct={openProduct} />
          )}
          {route.name === 'metrics' && (
            <Metrics tweaks={tweaks}
                     onOpenProduct={openProduct} />
          )}
        </main>

        <Footer />

        <TweaksPanel title="Tweaks">
          <TweakSection label="Estética" />
          <TweakRadio  label="Aesthetic" value={tweaks.aesthetic}
                       options={[
                         { value: 'clean',    label: 'Clean' },
                         { value: 'warm',     label: 'Cálido' },
                         { value: 'terminal', label: 'Terminal' },
                       ]}
                       onChange={(v) => setTweak('aesthetic', v)} />
          <TweakToggle label="Modo oscuro" value={tweaks.dark}
                       onChange={(v) => setTweak('dark', v)} />

          <TweakSection label="Severidad" />
          <TweakRadio  label="Tratamiento" value={tweaks.severityTreatment}
                       options={[
                         { value: 'badge', label: 'Solo badge' },
                         { value: 'tint',  label: 'Tinte fila' },
                         { value: 'rail',  label: 'Barra lateral' },
                         { value: 'combo', label: 'Combinado' },
                       ]}
                       onChange={(v) => setTweak('severityTreatment', v)} />

          <TweakSection label="KPI cards" />
          <TweakRadio  label="Estilo" value={tweaks.statTreatment}
                       options={[
                         { value: 'flat',      label: 'Plano' },
                         { value: 'gradient',  label: 'Gradiente' },
                         { value: 'sparkline', label: 'Sparkline' },
                       ]}
                       onChange={(v) => setTweak('statTreatment', v)} />

          <TweakSection label="Gráfica de pronóstico" />
          <TweakRadio  label="Tratamiento" value={tweaks.chartTreatment}
                       options={[
                         { value: 'simple',     label: 'Simple' },
                         { value: 'danger',     label: 'Zona de riesgo' },
                         { value: 'confidence', label: 'Intervalo conf.' },
                         { value: 'dual',       label: 'Stock proyectado' },
                       ]}
                       onChange={(v) => setTweak('chartTreatment', v)} />
        </TweaksPanel>
      </div>
    </ToastProvider>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ current, tweaks, onNavigate, onToggleDark }) => {
  const stats = computeStats();
  return (
    <header className="sticky top-0 z-30 bg-page/85 backdrop-blur-md border-b border-line">
      <div className="mx-auto max-w-[1440px] px-8 h-16 flex items-center gap-6">
        <button onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-[var(--radius-xs)] bg-ink grid place-items-center text-[rgb(var(--surf))]">
            <Icon name="spark" size={15} strokeWidth={2} />
          </div>
          <div>
            <div className="display text-[15px] leading-none">SupplyPredict</div>
            <div className="text-[10px] text-mute leading-none mt-0.5 tracking-wide uppercase">Toyo Foods · México</div>
          </div>
        </button>

        <nav className="flex items-center gap-1 ml-6">
          <NavTab active={current === 'dashboard'} icon="home"  onClick={() => onNavigate('dashboard')}>Dashboard</NavTab>
          <NavTab active={current === 'product'}   icon="box"   onClick={() => onNavigate('product', 'TY-1010')}>Producto</NavTab>
          <NavTab active={current === 'metrics'}   icon="gauge" onClick={() => onNavigate('metrics')}>Métricas</NavTab>
        </nav>

        <div className="flex-1" />

        {/* Live alert pill */}
        <button onClick={() => onNavigate('dashboard')}
                className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)]
                           bg-critbg text-crit ring-1 ring-crit/20 text-[12px] font-medium hover:ring-crit/40 transition-all">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-crit pulse-crit" />
          <span><b className="tabular">{stats.crit}</b> alertas críticas</span>
        </button>

        {/* Cmd-K */}
        <button className="inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] bg-surf ring-1 ring-line text-sub hover:text-ink hover:ring-mute transition-colors">
          <Icon name="search" size={13} />
          <span className="text-[12px]">Buscar…</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 ml-2 px-1.5 h-5 rounded text-[10px] bg-surf2 text-mute font-mono ring-1 ring-line">⌘K</kbd>
        </button>

        <button onClick={onToggleDark}
                title={tweaks.dark ? 'Modo claro' : 'Modo oscuro'}
                className="h-9 w-9 grid place-items-center rounded-[var(--radius-sm)] bg-surf ring-1 ring-line text-sub hover:text-ink hover:ring-mute transition-colors">
          <Icon name={tweaks.dark ? 'sun' : 'moon'} size={14} />
        </button>

        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[oklch(0.65_0.13_50)] to-[oklch(0.55_0.15_15)] grid place-items-center text-white text-[12px] font-semibold ring-2 ring-page">
          MH
        </div>
      </div>
    </header>
  );
};

const NavTab = ({ active, icon, onClick, children }) => (
  <button onClick={onClick}
          className={`inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors
                      ${active ? 'bg-ink/8 text-ink' : 'text-sub hover:text-ink hover:bg-surf2'}`}
          style={active ? { background: 'rgb(var(--surf2))' } : undefined}>
    <Icon name={icon} size={14} />
    {children}
  </button>
);

const Footer = () => (
  <footer className="mx-auto max-w-[1440px] px-8 py-8 border-t border-line mt-12 flex items-center justify-between text-[11px] text-mute">
    <div className="flex items-center gap-3">
      <span>SupplyPredict v2.3.1</span>
      <span>·</span>
      <span>LightGBM · 480 SKUs</span>
      <span>·</span>
      <span>Datos sincronizados a las 06:00 CDMX</span>
    </div>
    <div className="flex items-center gap-3">
      <a className="hover:text-ink transition-colors" href="#">Documentación</a>
      <a className="hover:text-ink transition-colors" href="#">Soporte</a>
      <a className="hover:text-ink transition-colors" href="#">API</a>
    </div>
  </footer>
);

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
