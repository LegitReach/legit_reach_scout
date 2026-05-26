// Root app — landing → input → terminal (terminal handles its own loading).
const { useState: useStateApp } = React;

function App() {
  // Entered via the site's "Create now" CTA, so we start directly on the
  // URL-input screen. "back" from input returns to the main site landing.
  const [screen, setScreen] = useStateApp("input");
  const [host, setHost]     = useStateApp("legitreach.com");

  React.useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @keyframes lrPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      @keyframes lrPulseSoft { 0%,100%{ box-shadow: 0 0 0 1px rgba(214,166,55,0.18), 0 0 24px rgba(214,166,55,0.10); } 50%{ box-shadow: 0 0 0 1px rgba(214,166,55,0.35), 0 0 32px rgba(214,166,55,0.22); } }
      @keyframes lrTourPulse { 0%,100%{ box-shadow: 0 0 0 1px rgba(63,156,106,0.35), 0 0 32px rgba(63,156,106,0.32), inset 0 0 18px rgba(63,156,106,0.10); } 50%{ box-shadow: 0 0 0 1px rgba(63,156,106,0.55), 0 0 48px rgba(63,156,106,0.48), inset 0 0 22px rgba(63,156,106,0.14); } }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 12px; height: 12px; background: #fff; border-radius: 50%;
        cursor: pointer;
      }
      input[type=range]::-moz-range-thumb {
        width: 12px; height: 12px; background: #fff; border: none;
        border-radius: 50%; cursor: pointer;
      }
      button:disabled { opacity: 0.35; cursor: not-allowed; }
      button:not(:disabled):hover { filter: brightness(1.06); }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #050505; }
      ::-webkit-scrollbar-thumb { background: #1a1a1a; }

      /* ───────── mobile ───────── */
      @media (max-width: 760px) {
        /* Landing */
        .lr-landing-header, .lr-landing-footer { padding: 14px 18px !important; }
        .lr-landing-main { padding: 0 18px !important; }
        .lr-landing-h1 { font-size: 52px !important; line-height: 1 !important; }
        .lr-landing-lede { font-size: 14px !important; margin-top: 18px !important; }
        .lr-landing-cta { margin-top: 36px !important; padding: 14px 18px !important; font-size: 14px !important; }
        .lr-landing-footer-r { display: none !important; }

        /* Input */
        .lr-input-header { padding: 14px 18px !important; }
        .lr-input-main { padding: 0 18px !important; }
        .lr-input-field { font-size: 26px !important; padding: 14px 0 !important; }
        .lr-input-prefix { font-size: 12px !important; padding-right: 10px !important; }
        .lr-input-try { flex-wrap: wrap !important; gap: 12px !important; }

        /* Terminal — topbar */
        .lr-term-topbar { padding: 10px 14px !important; flex-wrap: wrap !important; gap: 10px !important; row-gap: 8px !important; }
        .lr-term-topbar-left { gap: 10px !important; flex: 1 1 auto !important; min-width: 0 !important; }
        .lr-term-topbar-right { gap: 8px !important; flex: 0 0 auto !important; }
        .lr-term-brand { font-size: 11px !important; }
        .lr-term-sep { display: none !important; }
        .lr-term-host-name { font-size: 13px !important; }
        .lr-term-host-status { font-size: 9px !important; }
        .lr-term-avatar { width: 24px !important; height: 24px !important; font-size: 10px !important; }
        .lr-term-pipe { gap: 8px !important; padding: 6px 10px !important; font-size: 10px !important; }
        .lr-term-pipe-text { min-width: 0 !important; max-width: 96px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lr-term-pipe-bar { width: 44px !important; }
        .lr-term-pipe-pct { min-width: 26px !important; font-size: 10px !important; }

        /* Tabs — horizontal scroll */
        .lr-term-tabbar { overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .lr-term-tabbar::-webkit-scrollbar { display: none; }
        .lr-term-tab { min-width: auto !important; padding: 11px 14px !important; gap: 8px !important; flex: 0 0 auto !important; }
        .lr-term-tab-name { font-size: 13px !important; }
        .lr-term-tabbar-filler { display: none !important; }

        /* Body scrolls on mobile (the whole workspace becomes one scroll page) */
        .lr-term-body { overflow-y: auto !important; -webkit-overflow-scrolling: touch; }

        /* The loaded content is wrapped by BlurFade in absolutely-positioned
           layers (height:100%), which blocks the page from growing/scrolling on
           a phone. Relax those layers so each view flows at its natural height. */
        .lr-term-section { height: auto !important; min-height: 0 !important; overflow: visible !important; }
        .lr-term-section > div:first-child { position: relative !important; height: auto !important; }
        .lr-term-section > div:first-child > div { position: relative !important; inset: auto !important; }

        .lr-term-col { padding: 18px 16px !important; height: auto !important; min-height: 360px; }
        .lr-term-cloud-row { grid-template-columns: 22px 1fr 60px 32px !important; gap: 10px !important; }

        /* Community sub-selector */
        .lr-term-community-bar { padding: 10px 14px !important; flex-wrap: wrap !important; gap: 10px !important; }
        .lr-term-community-meta { display: none !important; }
        .lr-term-community-pills { gap: 6px !important; }
        .lr-term-community-bar .lr-term-pill { font-size: 13px !important; }

        /* Credits button — keep number, hide label on small screens */
        .lr-term-credits { padding: 6px 10px !important; }

        /* Top nav tabs — spread evenly, no numbers, fit 4 across one row */
        .lr-term-tabbar { overflow-x: visible !important; }
        .lr-term-tab { flex: 1 1 0 !important; min-width: 0 !important; justify-content: center !important; padding: 13px 4px !important; gap: 0 !important; }
        .lr-term-tab .lr-term-tab-name { font-size: 13px !important; }
        .lr-term-tab .mono { display: none !important; }  /* hide 01/02/03 prefixes */
        .lr-term-tabbar-filler { display: none !important; }

        /* Scan box: stack brand signals + community as two boxes on mobile */
        .lr-scan-insights { grid-template-columns: 1fr !important; }
        .lr-scan-insights > div + div { border-left: none !important; border-top: 1px solid #0e0e0e !important; }

        /* Sentiment view stacks + scrolls */
        .lr-sentiment-wrap { grid-template-columns: 1fr !important; height: auto !important; overflow: visible !important; }
        .lr-sentiment-panel { border-right: none !important; border-bottom: 1px solid #0e0e0e !important; padding: 18px 16px !important; }
        .lr-sentiment-pie-row { flex-direction: row !important; gap: 16px !important; align-items: center !important; flex-wrap: wrap !important; }

        /* Engagement + blueprint flow naturally on mobile */
        .lr-engagement-wrap, .lr-blueprint-wrap { height: auto !important; overflow: visible !important; }

        /* Terminal overview = one scrollable page of stacked, full boxes */
        .lr-overview-wrap { padding: 16px 14px !important; gap: 12px !important; height: auto !important; overflow: visible !important; }
        .lr-overview-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        .lr-overview-panel { min-height: 0 !important; padding: 16px 16px !important; gap: 10px !important; }

        /* Show the full panels as proper boxes; drop the cramped one-liners */
        .lr-overview-bulk { display: flex !important; }
        .lr-overview-mobile-summary { display: none !important; }

        /* Title row stays readable */
        .lr-overview-wrap > div:first-child > div > div:first-child { font-size: 18px !important; }
        .lr-overview-wrap > div:first-child > div > div:last-child  { font-size: 10px !important; margin-top: 3px !important; }

        /* Keep the sentiment pie compact in its box */
        .lr-overview-panel svg[width="180"] { width: 96px !important; height: 96px !important; }

        .lr-overview-more { padding: 10px 12px !important; font-size: 12px !important; }

        /* Engagement view */
        .lr-engagement-wrap { padding: 18px 16px !important; }
        .lr-engagement-sort-row { flex-wrap: wrap !important; }

        /* Blueprint view */
        .lr-blueprint-wrap { padding: 18px 16px !important; }
        .lr-blueprint-card { grid-template-columns: 1fr !important; gap: 14px !important; padding: 16px !important; }
        .lr-blueprint-cta { width: 100% !important; justify-content: center !important; }

        /* Credits modal */
        .lr-credits-dialog { width: 100% !important; max-height: 92vh !important; overflow: auto !important; }
        .lr-credits-tiers { grid-template-columns: 1fr !important; }
        .lr-credits-pay-row { gap: 4px !important; }
        .lr-credits-pay { width: 100% !important; justify-content: center !important; }

        /* Footer */
        .lr-term-footbar { padding: 10px 14px !important; flex-wrap: wrap !important; gap: 8px !important; }
        .lr-term-tone-pill { padding: 7px 12px !important; font-size: 11px !important; }
        .lr-term-foot-right { gap: 10px !important; margin-left: 0 !important; }

        /* Modal */
        .lr-modal-backdrop { padding: 12px !important; align-items: flex-end !important; }
        .lr-modal-dialog { max-height: 92vh !important; width: 100% !important; }
        .lr-modal-header { padding: 14px 18px !important; }
        .lr-modal-body { padding: 14px 18px !important; }
        .lr-modal-footer { padding: 12px 18px !important; flex-wrap: wrap !important; gap: 10px !important; }
        .lr-modal-ship { width: 100% !important; justify-content: center !important; }

        /* Settings sheet */
        .lr-settings-sheet { max-height: 92vh !important; }
        .lr-settings-body { grid-template-columns: 1fr !important; }
        .lr-settings-col { border-right: none !important; border-bottom: 1px solid #111 !important; padding: 16px 18px !important; }
        .lr-settings-col:last-child { border-bottom: none !important; }
        .lr-settings-head { padding: 14px 18px !important; }
        .lr-settings-foot { padding: 12px 18px !important; flex-wrap: wrap !important; gap: 10px !important; }
        .lr-settings-save { width: 100% !important; text-align: center !important; justify-content: center !important; }
        .lr-upload-gdpr { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }

        /* Section status card */
        .lr-status-card { width: 88% !important; padding: 14px 14px 12px !important; }

        /* Flow chrome — keep but lift above thumb-zone */
        .lr-flow-chrome { bottom: 8px !important; }
      }

      @media (max-width: 380px) {
        .lr-landing-h1 { font-size: 42px !important; }
        .lr-term-pipe-text { display: none !important; }
        .lr-term-brand { display: none !important; }
        .lr-term-credits .lr-credits-label, .lr-term-credits span:last-child { display: none !important; }
      }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  return (
    <div style={{position:"absolute", inset:0}}>
      {screen === "landing"  && <Landing  onCTA={() => setScreen("input")} />}
      {screen === "input"    && <Input    onBack={() => { window.location.href = "/"; }} onSubmit={h => { setHost(h); setScreen("terminal"); }} />}
      {screen === "terminal" && <Terminal initialHost={host} onExit={() => setScreen("input")} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
