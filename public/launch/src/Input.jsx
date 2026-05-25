// Input — hyper minimal. Just a field.
const { useState: useStateInput, useEffect: useEffectInput, useRef: useRefInput } = React;

function Input({ onSubmit, onBack }) {
  const [url, setUrl] = useStateInput("");
  const ref = useRefInput(null);
  useEffectInput(() => {
    // Focus on mount AND after a tick (some browsers steal focus during transition)
    ref.current && ref.current.focus();
    const t = setTimeout(() => ref.current && ref.current.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  function normalize(v) {
    return v.trim().replace(/^https?:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"").toLowerCase();
  }
  function submit(e) {
    e && e.preventDefault();
    const host = normalize(url);
    if (host) onSubmit(host);
  }

  return (
    <div style={inputStyles.root}>
      <header style={inputStyles.header} className="lr-input-header">
        <div style={inputStyles.brand}>LegitReach</div>
        <button style={inputStyles.back} className="mono" onClick={onBack}>← back</button>
      </header>

      <main style={inputStyles.main} className="lr-input-main">
        <div className="mono" style={inputStyles.step}>01 / WEBSITE</div>
        <form onSubmit={submit} style={inputStyles.form}>
          <span style={inputStyles.prefix} className="mono lr-input-prefix">https://</span>
          <input
            ref={ref}
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="yourbrand.com"
            style={inputStyles.input}
            className="lr-input-field"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" style={inputStyles.submit} disabled={!url.trim()}>→</button>
        </form>
        <div style={inputStyles.try} className="mono lr-input-try">
          <span style={inputStyles.tryLead}>don't have a website?</span>
          <button style={inputStyles.demoChip} onClick={() => onSubmit("legitreach.com")}>
            demo on <span style={inputStyles.demoHost}>legitreach.com</span> <span style={inputStyles.demoArrow}>→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

const inputStyles = {
  root:{ position:"absolute", inset:0, background:"#000", color:"#fff", display:"flex", flexDirection:"column" },
  header:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 32px" },
  brand:{ fontSize:13, fontWeight:700, letterSpacing:"0.06em" },
  back:{ background:"none", border:"none", color:"#888", fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", cursor:"pointer" },

  main:{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 32px", maxWidth:760, width:"100%", margin:"0 auto" },
  step:{ fontSize:10, letterSpacing:"0.22em", color:"#555", marginBottom:32 },

  form:{ display:"flex", alignItems:"stretch", borderBottom:"1px solid #1c1c1c" },
  prefix:{ display:"flex", alignItems:"center", paddingRight:14, fontSize:14, color:"#444" },
  input:{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontSize:36, padding:"18px 0", letterSpacing:"-0.02em", fontWeight:500 },
  submit:{ background:"transparent", color:"#fff", border:"none", padding:"0 8px", fontSize:24, cursor:"pointer", transition:"opacity .15s" },

  try:{ marginTop:28, display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" },
  tryLead:{ fontSize:11, color:"#555", letterSpacing:"0.06em" },
  demoChip:{ background:"transparent", border:"1px solid #1a1a1a", color:"#bbb", padding:"8px 14px", fontSize:11, letterSpacing:"0.06em", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, transition:"all .15s" },
  demoHost:{ color:"#fff", fontWeight:500 },
  demoArrow:{ color:"#666", marginLeft:2 },
  chip:{ background:"transparent", border:"none", color:"#555", padding:0, fontSize:11, letterSpacing:"0.06em", cursor:"pointer", textDecoration:"underline", textDecorationColor:"#222", textUnderlineOffset:4 },
};

Object.assign(window, { Input });
