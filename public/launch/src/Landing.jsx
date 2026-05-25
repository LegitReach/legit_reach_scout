// Landing — hyper minimal.
function Landing({ onCTA }) {
  return (
    <div style={landingStyles.root}>
      <header style={landingStyles.header} className="lr-landing-header">
        <div style={landingStyles.brand}>LegitReach</div>
        <button style={landingStyles.signin} className="mono">sign in</button>
      </header>

      <main style={landingStyles.main} className="lr-landing-main">
        <h1 style={landingStyles.h1} className="lr-landing-h1">
          Show up <em style={landingStyles.em}>legitimately</em>.
        </h1>
        <p style={landingStyles.lede} className="lr-landing-lede">Community intelligence. No ads. No bots.</p>
        <button style={landingStyles.cta} onClick={onCTA} className="lr-landing-cta">
          <span>Start</span>
          <span style={landingStyles.arrow}>→</span>
        </button>
      </main>

      <footer style={landingStyles.footer} className="mono lr-landing-footer">
        <span>V2026.05.24</span>
        <span className="lr-landing-footer-r">boston / remote</span>
      </footer>
    </div>);

}

const landingStyles = {
  root: { position: "absolute", inset: 0, background: "#000", color: "#fff", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 32px" },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" },
  signin: { background: "transparent", color: "#888", border: "none", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },

  main: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px", maxWidth: 1100, margin: "0 auto", width: "100%" },
  h1: { fontSize: "clamp(56px, 9vw, 132px)", fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.04em" },
  em: { color: "#555", fontStyle: "italic", fontWeight: 300, textDecoration:"underline", textDecorationColor:"rgba(92,209,151,0.55)", textDecorationThickness:"0.045em", textUnderlineOffset:"0.12em" },
  lede: { marginTop: 24, fontSize: 16, color: "#777", letterSpacing: "-0.005em" },
  cta: { marginTop: 48, alignSelf: "flex-start", background: "#fff", color: "#000", border: "none", padding: "16px 22px", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 16, cursor: "pointer" },
  arrow: { fontSize: 16 },

  footer: { display: "flex", justifyContent: "space-between", padding: "18px 32px", fontSize: 10, color: "#3a3a3a", letterSpacing: "0.18em", textTransform: "uppercase" }
};

Object.assign(window, { Landing });