// Lucide-style icons (custom subset — 1.75px stroke, rounded).
// Each renders into a <svg> with currentColor stroke.

const Icon = ({ name, size = 16, strokeWidth = 1.75, className = '', ...rest }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         className={`inline-block shrink-0 ${className}`} aria-hidden="true" {...rest}>
      {paths}
    </svg>
  );
};

const ICONS = {
  // navigation
  'home':       <><path d="M3 12 12 3l9 9" /><path d="M5 10v10h14V10" /></>,
  'gauge':      <><path d="M12 14 7.2 9.2" /><circle cx="12" cy="14" r="9" /><path d="M3 14h2M12 5v2M19 14h2" /></>,
  'list':       <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="0.6" fill="currentColor" /><circle cx="4" cy="12" r="0.6" fill="currentColor" /><circle cx="4" cy="18" r="0.6" fill="currentColor" /></>,
  // status
  'alert':      <><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5" /><circle cx="12" cy="18" r=".7" fill="currentColor" /></>,
  'check':      <><path d="m4 12 5 5L20 6" /></>,
  'check-c':    <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  'warn':       <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><circle cx="12" cy="16.5" r=".7" fill="currentColor" /></>,
  'x':          <><path d="M6 6 18 18 M18 6 6 18" /></>,
  'x-c':        <><circle cx="12" cy="12" r="9" /><path d="m8 8 8 8M16 8l-8 8" /></>,
  'info':       <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r=".7" fill="currentColor" /></>,
  // arrows / trends
  'up':         <><path d="m5 15 7-7 7 7" /></>,
  'down':       <><path d="m5 9 7 7 7-7" /></>,
  'trend-up':   <><path d="M3 17 9 11l4 4 8-8" /><path d="M14 4h7v7" /></>,
  'trend-down': <><path d="M3 7 9 13l4-4 8 8" /><path d="M14 20h7v-7" /></>,
  'arrow-r':    <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  'arrow-l':    <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  // common UI
  'search':     <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  'filter':     <><path d="M3 5h18l-7 8v6l-4-2v-4z" /></>,
  'sort':       <><path d="M8 4v16M5 17l3 3 3-3" /><path d="M16 20V4M13 7l3-3 3 3" /></>,
  'download':   <><path d="M12 4v12" /><path d="m6 11 6 6 6-6" /><path d="M4 20h16" /></>,
  'upload':     <><path d="M12 20V8" /><path d="m6 13 6-6 6 6" /><path d="M4 4h16" /></>,
  'plus':       <><path d="M12 5v14M5 12h14" /></>,
  'dots':       <><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>,
  'menu':       <><path d="M3 6h18M3 12h18M3 18h18" /></>,
  'eye':        <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  // theme
  'sun':        <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
  'moon':       <><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" /></>,
  // domain
  'box':        <><path d="m3 7 9-4 9 4-9 4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></>,
  'truck':      <><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.7" /><circle cx="17" cy="18" r="1.7" /></>,
  'clock':      <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  'spark':      <><path d="m12 3 2.5 6 6.5.5-5 4.5L18 21l-6-3.5L6 21l1.5-7-5-4.5 6.5-.5z" /></>,
  'chart':      <><path d="M3 21h18" /><path d="M6 17v-7M11 17V8M16 17v-5M21 17v-9" /></>,
  'pkg':        <><path d="M12 3 3 7v10l9 4 9-4V7z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
  'sliders':    <><path d="M4 6h6M14 6h6M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="12" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  'logo':       <><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" stroke="none"/><path d="m7 14 3 3 7-9" stroke="rgb(var(--surf))" /></>,
  'refresh':    <><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>,
  'cmd':        <><path d="M9 9V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v3" /><path d="M9 15v3a3 3 0 1 1-3-3h12a3 3 0 1 1-3 3v-3" /><path d="M9 9h6v6H9z" /></>,
  'star':       <><path d="m12 3 2.7 6.3 6.8.5-5.2 4.5L17.8 21 12 17.3 6.2 21l1.5-6.7L2.5 9.8l6.8-.5z" /></>,
  'flame':      <><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6-1 2-3 2-4 4-1-1-2-3-5-3 0 6-2 5-2 10 0 4 3 7 7 7z" /></>,
  'bell':       <><path d="M18 16V11a6 6 0 0 0-12 0v5l-2 3h16z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
};

window.Icon = Icon;
