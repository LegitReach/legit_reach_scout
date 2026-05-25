// Terminal — three-tab workspace: Sentiment, Engagement, Blueprint.
// The shell appears instantly; each tab's content blurs in as it "loads".
const { useState: useStateT, useEffect: useEffectT, useRef: useRefT, useMemo: useMemoT } = React;

const STAGES = window.LOAD_STAGES;

const VIEW_TABS = [
{ id: "terminal",   label: "Terminal",   stageIdx: null, num: null },
{ id: "sentiment",  label: "Sentiment",  stageIdx: 1,    num: "01" },
{ id: "engagement", label: "Engagement", stageIdx: 2,    num: "02" },
{ id: "blueprint",  label: "Blueprint",  stageIdx: 3,    num: "03" }];


function Terminal({ initialHost, onExit }) {
  const [activeHost, setActiveHost] = useStateT(initialHost);
  // Real API state — populated by magic-scan + curate calls.
  // null = still loading, use mock getSite() as visual placeholder.
  const [realSiteData, setRealSiteData] = useStateT(null);
  const [apiPhase, setApiPhase] = useStateT("scanning"); // scanning | curating | done | error
  const [apiError, setApiError] = useStateT(null);

  const site = useMemoT(
    () => realSiteData || window.getSite(activeHost),
    [activeHost, realSiteData]
  );
  const [communityIdx, setCommunityIdx] = useStateT(0);
  const [viewTab, setViewTab] = useStateT("terminal");
  const [siteMenuOpen, setSiteMenuOpen] = useStateT(false);
  const [toneOpen, setToneOpen] = useStateT(false);
  const [settingsHighlight, setSettingsHighlight] = useStateT(null); // "upload" | null
  const [creditsOpen, setCreditsOpen] = useStateT(false);
  const [credits, setCredits] = useStateT(47);
  const [streaksOpen, setStreaksOpen] = useStateT(false);
  const [streakDays] = useStateT(14);
  // upload state lifted up so Sentiment overlay can react to it
  const [upload, setUpload] = useStateT(null);
  const personalized = upload?.stage === "ready";
  const [actionModal, setActionModal] = useStateT(null);
  const [tone, setTone] = useStateT({
    voice: "Founder", formality: 35, enthusiasm: 60, technicality: 50, selfPromo: 18,
    bio: "We are LegitReach. We help brands listen and reply in communities, without paid media."
  });

  // Progressive load.
  const [loadIdx, setLoadIdx] = useStateT(0);
  const [stageProgress, setStageProgress] = useStateT(0);
  const [sub, setSub] = useStateT({});

  useEffectT(() => {
    setLoadIdx(0);setStageProgress(0);setSub({});
    let raf,cancelled = false,i = 0,start = performance.now();
    function tick() {
      if (cancelled) return;
      const cur = STAGES[i];
      if (!cur) return;
      const p = Math.min(1, (performance.now() - start) / cur.ms);
      setStageProgress(p);

      const subN = cur.substages.length;
      const sIdx = Math.min(subN - 1, Math.floor(p * subN));
      const subStart = sIdx / subN;
      const subSpan = 1 / subN;
      const subP = Math.min(1, (p - subStart) / subSpan);
      const counter = cur.substages[sIdx].counter;
      const counterVal = Math.round(counter.from + (counter.to - counter.from) * easeOutQuad(subP));
      setSub((prev) => ({ ...prev, [i]: { subIdx: sIdx, counterVal, counter, subP } }));

      if (p >= 1) {
        const last = cur.substages[subN - 1];
        setSub((prev) => ({ ...prev, [i]: { subIdx: subN - 1, counterVal: last.counter.to, counter: last.counter, subP: 1 } }));
        i++;
        setLoadIdx(i);
        if (i >= STAGES.length) return;
        start = performance.now();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {cancelled = true;cancelAnimationFrame(raf);};
  }, [activeHost]);

  // ─── Real API calls ──────────────────────────────────────────────────────
  // Sequence: magic-scan (brand + community) → curate (posts + blueprint)
  // apiPhase drives the ready flags; the animation above is purely visual.
  useEffectT(() => {
    setApiPhase("scanning");
    setRealSiteData(null);
    setApiError(null);
    setCommunityIdx(0); // reset to first community when host changes
    var cancelled = false;

    async function run() {
      try {
        // Step 1 — magic-scan (~24 s with Apify proxy)
        var scanRes = await fetch("/api/tech-week/magic-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: activeHost })
        });
        if (cancelled) return;
        if (!scanRes.ok) throw new Error("magic-scan HTTP " + scanRes.status);
        var scanData = await scanRes.json();
        if (cancelled) return;

        // Partial update — show real community name + keyword cloud immediately
        var partialSite = window.mapApiDataToSite(activeHost, scanData, null);
        setRealSiteData(partialSite);
        setApiPhase("curating");

        // Step 2 — curate (~10-15 s)
        var curateRes = await fetch("/api/tech-week/curate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandProfile: scanData.brandProfile, community: scanData.community })
        });
        if (cancelled) return;
        if (!curateRes.ok) throw new Error("curate HTTP " + curateRes.status);
        var curateData = await curateRes.json();
        if (cancelled) return;

        var fullSite = window.mapApiDataToSite(activeHost, scanData, curateData);
        setRealSiteData(fullSite);
        setApiPhase("done");
      } catch (err) {
        if (!cancelled) {
          console.error("[Terminal] API error:", err);
          setApiError(err.message);
          setApiPhase("error");
        }
      }
    }

    run();
    return function() { cancelled = true; };
  }, [activeHost]);

  const overall = useMemoT(function() {
    // API-phase-aware progress: blend timer animation within each phase
    var t = Math.min(1, (loadIdx + stageProgress) / STAGES.length);
    if (apiPhase === "scanning")  return t * 0.45;
    if (apiPhase === "curating")  return 0.5 + t * 0.40;
    if (apiPhase === "done")      return 1;
    if (apiPhase === "error")     return 0;
    return t * 0.10;
  }, [apiPhase, loadIdx, stageProgress]);

  function subFor(stageIdx) {
    if (stageIdx < loadIdx) return null;
    if (stageIdx > loadIdx) return { stage: STAGES[stageIdx], subIdx: 0, counter: STAGES[stageIdx].substages[0].counter, counterVal: 0, subP: 0, queued: true };
    const s = sub[stageIdx] || { subIdx: 0, counter: STAGES[stageIdx].substages[0].counter, counterVal: 0, subP: 0 };
    return { ...s, stage: STAGES[stageIdx] };
  }

  // ready flags are driven by real API completion, not the visual timer.
  // scanning   → nothing ready (all tabs blurred)
  // curating   → site name + community + keyword cloud are ready
  // done       → everything ready
  var readyAfterScan = apiPhase === "curating" || apiPhase === "done";
  const ready = {
    site:       readyAfterScan,
    sentiment:  readyAfterScan,
    engagement: apiPhase === "done",
    blueprint:  apiPhase === "done",
    terminal:   apiPhase === "done"
  };

  // Guard: if the site changed and no longer has the selected community, reset to 0
  var safeIdx = Math.min(communityIdx, site.communities.length - 1);
  const community = site.communities[safeIdx] || site.communities[0];
  const allSites = Object.values(window.SITES_DB);

  useEffectT(() => {
    function onKey(e) {
      if (e.key === "Escape") {setSiteMenuOpen(false);setToneOpen(false);setActionModal(null);setCreditsOpen(false);}
      if (e.key === "0") setViewTab("terminal");
      if (e.key === "1") setViewTab("sentiment");
      if (e.key === "2") setViewTab("engagement");
      if (e.key === "3") setViewTab("blueprint");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loaded = apiPhase === "done";
  const currentStage = STAGES[Math.min(loadIdx, STAGES.length - 1)];
  const siteSub = subFor(0);

  // Map viewTab → ready flag + sub status overlay.
  // Terminal tab is always considered "ready" — each inner panel handles its
  // own loading state so the user can see the three boxes coming in.
  const tabReady = { terminal: true, sentiment: ready.sentiment, engagement: ready.engagement, blueprint: ready.blueprint }[viewTab];
  const tabSubIdx = { terminal: 1, sentiment: 1, engagement: 2, blueprint: 3 }[viewTab];
  const tabSub = !tabReady ? subFor(tabSubIdx) : null;

  function openSettingsWithHighlight(h) {
    setSettingsHighlight(h || null);
    setToneOpen(true);
  }

  return (
    <div style={termStyles.root}>
      {/* TOP BAR */}
      <header style={termStyles.topbar} className="lr-term-topbar">
        <div style={termStyles.topbarLeft} className="lr-term-topbar-left">
          <div style={termStyles.brand} className="lr-term-brand">LegitReach</div>
          <div style={termStyles.sep} className="lr-term-sep" />
          <div style={{ position: "relative" }}>
            <button style={termStyles.hostBtn} onClick={() => setSiteMenuOpen((s) => !s)}>
              <Blurry blur={ready.site ? 0 : 14}>
                <span style={termStyles.hostName} className="lr-term-host-name">{site.name}</span>
              </Blurry>
              {!ready.site && siteSub &&
              <span className="mono lr-term-host-status" style={termStyles.hostStatus}>
                  <Spinner />
                  {siteSub.stage.substages[siteSub.subIdx].msg}…
                </span>
              }
              <span style={termStyles.caret}>{siteMenuOpen ? "▴" : "▾"}</span>
            </button>
            {siteMenuOpen &&
            <>
                <div style={termStyles.menuBackdrop} onClick={() => setSiteMenuOpen(false)} />
                <div style={termStyles.hostMenu}>
                  <div style={termStyles.hostMenuHead} className="mono">CLIENTS · {allSites.length}</div>
                  {allSites.map((s) =>
                <button key={s.name} style={{
                  ...termStyles.hostMenuItem,
                  background: s.name === site.name ? "#0a0a0a" : "transparent"
                }} onClick={() => {setActiveHost(s.name);setSiteMenuOpen(false);setCommunityIdx(0);}}>
                      <span style={termStyles.hostMenuName}>{s.name}</span>
                      <span className="mono" style={termStyles.hostMenuCheck}>{s.name === site.name ? "●" : "→"}</span>
                    </button>
                )}
                  <button style={termStyles.hostMenuAdd} onClick={() => {setSiteMenuOpen(false);onExit && onExit();}}>
                    + new
                  </button>
                </div>
              </>
            }
          </div>
        </div>

        <div style={termStyles.topbarRight} className="lr-term-topbar-right">
          <PipelineIndicator overall={overall} stage={currentStage} loaded={loaded} />
          <button style={termStyles.creditsBtn} className="mono lr-term-credits" onClick={() => setCreditsOpen(true)} title="Credits — click to top up">
            <span style={termStyles.creditsNum}>{credits}</span>
            <span style={termStyles.creditsLabel}>credits</span>
          </button>
          <div style={termStyles.avatar} className="lr-term-avatar" title="manthan@legitreach.com">m</div>
        </div>
      </header>

      {/* COMMUNITY SUB-SELECTOR */}
      <div style={termStyles.communityBar} className="lr-term-community-bar">
        <span className="mono" style={termStyles.communityBarLabel}>Your communities</span>
        <div style={termStyles.communityPills} className="lr-term-community-pills">
          {site.communities.map((c, i) =>
          <button key={c.id} onClick={() => setCommunityIdx(i)} className="lr-term-pill" style={{
            ...termStyles.communityPill,
            background: i === communityIdx ? "rgba(63,156,106,0.18)" : "transparent",
            borderColor: i === communityIdx ? "#3f9c6a" : "#1a1a1a",
            color: i === communityIdx ? "#cfeedd" : "#888",
            boxShadow: i === communityIdx ? "0 0 0 1px rgba(63,156,106,0.25), 0 0 14px rgba(63,156,106,0.15)" : "none"
          }}>
              <Blurry blur={ready.site ? 0 : 10}>
                <span style={termStyles.communityPillName}>{c.name}</span>
              </Blurry>
              <span className="mono" style={termStyles.communityPillMeta}>{Math.round(c.overlap * 100)}%</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW TABS */}
      <div style={termStyles.tabbar} className="lr-term-tabbar">
        {VIEW_TABS.map((t, i) => {
          const isActive = viewTab === t.id;
          const isReady = ready[t.id];
          return (
            <button key={t.id} onClick={() => setViewTab(t.id)} className="lr-term-tab" style={{
              ...termStyles.tab,
              background: isActive ? "#0a0a0a" : "transparent",
              borderBottom: isActive ? "1px solid #fff" : "1px solid transparent",
              color: isActive ? "#fff" : "#666"
            }}>
              {t.num && <span className="mono" style={termStyles.tabIdx}>{t.num}</span>}
              <span style={termStyles.tabName} className="lr-term-tab-name">{t.label}</span>
              {!isReady &&
              <span className="mono" style={termStyles.tabStatusDot} title="loading">
                  <span style={termStyles.tabPulse} />
                </span>
              }
            </button>);

        })}
        <div style={termStyles.tabbarFiller} className="lr-term-tabbar-filler" />
      </div>

      {/* BODY — single panel that switches by tab */}
      <main style={termStyles.body} className="lr-term-body">
        {apiPhase === "error" ? (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:32 }}>
            <div className="mono" style={{ fontSize:10, color:"#e07b7b", letterSpacing:"0.22em" }}>PIPELINE ERROR</div>
            <div style={{ fontSize:15, color:"#fff", fontWeight:600, textAlign:"center", maxWidth:420 }}>
              Could not fetch community data
            </div>
            <div className="mono" style={{ fontSize:11, color:"#555", textAlign:"center", maxWidth:380, lineHeight:1.55 }}>
              {apiError || "An unknown error occurred."}
            </div>
            <button onClick={() => onExit && onExit()} style={{ marginTop:8, background:"transparent", border:"1px solid #2a2a2a", color:"#aaa", padding:"10px 18px", fontSize:11, letterSpacing:"0.12em", cursor:"pointer" }}>
              ← try a different URL
            </button>
          </div>
        ) : (
          <Section ready={tabReady} status={tabSub}>
            {viewTab === "terminal" && <TerminalOverview community={community} ready={ready} subFor={subFor} onJump={setViewTab} personalized={personalized} onPersonalize={() => openSettingsWithHighlight("upload")} streakDays={streakDays} onStreakClick={() => setStreaksOpen(true)} onAction={(kind) => setActionModal({ kind, community })} />}
            {viewTab === "sentiment" && <SentimentView community={community} personalized={personalized} onPersonalize={() => openSettingsWithHighlight("upload")} />}
            {viewTab === "engagement" && <EngagementView community={community} onAction={(kind) => setActionModal({ kind, community })} disabled={!ready.engagement} />}
            {viewTab === "blueprint" && <BlueprintView community={community} onAction={(kind) => setActionModal({ kind, community })} disabled={!ready.blueprint} streakDays={streakDays} onStreakClick={() => setStreaksOpen(true)} />}
          </Section>
        )}
      </main>

      {/* FOOTER */}
      <footer style={termStyles.footbar} className="lr-term-footbar">
        <button style={termStyles.tonePill} className="mono lr-term-tone-pill" onClick={() => setToneOpen(true)}>
          ⚙ settings
        </button>
        <div style={termStyles.footRightWrap} className="lr-term-foot-right">
          <div className="mono" style={termStyles.footRight}>
            {site.name} · {community.name}
          </div>
          <button onClick={() => onExit && onExit()} style={termStyles.createOwn} className="lr-term-create-own"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#4ec18a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#3f9c6a"; e.currentTarget.style.transform = "translateY(0)"; }}>
            Create your own terminal now <span style={{marginLeft:6}}>→</span>
          </button>
        </div>
      </footer>

      {actionModal &&
      <ActionModal modal={actionModal} tone={tone} onClose={() => setActionModal(null)} />
      }
      {toneOpen &&
      <TonePanel tone={tone} setTone={setTone} site={site} highlight={settingsHighlight} upload={upload} setUpload={setUpload} onClose={() => {setToneOpen(false);setSettingsHighlight(null);}} />
      }
      {creditsOpen &&
      <CreditsModal credits={credits} onTopUp={(n) => setCredits((c) => c + n)} onClose={() => setCreditsOpen(false)} />
      }
      {streaksOpen &&
      <StreaksModal days={streakDays} onClose={() => setStreaksOpen(false)} />
      }
    </div>);

}

// ───────── Pipeline indicator (top-right) ─────────

function PipelineIndicator({ overall, stage, loaded }) {
  const border = loaded ? "#3f9c6a" : "#d6a637";
  const dotBg = loaded ? "#5cd197" : "#f0c054";
  const dotGlow = loaded ? "0 0 12px rgba(92,209,151,.55)" : "0 0 12px rgba(240,192,84,.55)";
  return (
    <div style={{ ...pipeStyles.root, borderColor: border, transition: "border-color .6s ease" }} className="mono lr-term-pipe">
      <span style={{ ...pipeStyles.dot, background: dotBg, boxShadow: dotGlow, animation: loaded ? "none" : "lrPulse 1.4s infinite" }} />
      <span style={{ ...pipeStyles.text, color: loaded ? "#cfeedd" : "#e6cd8d" }} className="lr-term-pipe-text">
        {loaded ? "ready" : stage.label}
      </span>
      <div style={pipeStyles.bar} className="lr-term-pipe-bar">
        <div style={{ ...pipeStyles.barFill, width: `${overall * 100}%`, background: loaded ? "#5cd197" : "#f0c054" }} />
      </div>
      <span style={{ ...pipeStyles.pct, color: loaded ? "#3f9c6a" : "#8a6a26" }} className="lr-term-pipe-pct">{Math.round(overall * 100)}%</span>
    </div>);

}

const pipeStyles = {
  root: { display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 14px", border: "1px solid", fontSize: 11, letterSpacing: "0.14em" },
  dot: { width: 7, height: 7, borderRadius: "50%" },
  text: { minWidth: 140, transition: "color .4s ease" },
  bar: { width: 96, height: 2, background: "#1a1a1a", overflow: "hidden" },
  barFill: { height: "100%", transition: "width .12s linear, background .6s ease" },
  pct: { minWidth: 32, textAlign: "right", transition: "color .4s ease", fontVariantNumeric: "tabular-nums" }
};

// ───────── Section wrapper: blur as content loads ─────────

function Section({ ready, status, border, children }) {
  return (
    <div className="lr-term-section" style={{
      ...sectionStyles.root,
      ...(border ? { borderLeft: "1px solid #0e0e0e", borderRight: "1px solid #0e0e0e" } : null)
    }}>
      <BlurFade ready={ready}>
        {children}
      </BlurFade>
      {!ready && status && <SectionStatus status={status} />}
    </div>);

}

function SectionStatus({ status }) {
  if (!status) return null;
  const cur = status.stage.substages[status.subIdx] || status.stage.substages[0];
  const subP = status.subP || 0;
  return (
    <div style={statusStyles.root}>
      <div style={statusStyles.card} className="lr-status-card">
        <div style={statusStyles.head}>
          <Spinner />
          <span className="mono" style={statusStyles.stage}>{status.stage.label}</span>
        </div>
        <div style={statusStyles.msg}>{cur.msg}…</div>
        <div style={statusStyles.counterRow}>
          <span className="mono" style={statusStyles.counter}>
            {status.counterVal.toLocaleString()}
          </span>
          <span className="mono" style={statusStyles.counterLabel}>{cur.counter.label}</span>
        </div>
        <div style={statusStyles.bar}>
          <div style={{ ...statusStyles.barFill, width: `${subP * 100}%` }} />
        </div>
        <div style={statusStyles.dots}>
          {status.stage.substages.map((s, i) =>
          <span key={i} style={{
            ...statusStyles.dot,
            background: i < status.subIdx ? "#fff" : i === status.subIdx ? "#fff" : "#222",
            opacity: i === status.subIdx ? 1 : i < status.subIdx ? 0.6 : 1
          }} />
          )}
        </div>
      </div>
    </div>);

}

function Spinner() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: "inline-block" }}>
      <circle cx="5" cy="5" r="3.5" fill="none" stroke="#333" strokeWidth="1" />
      <path d="M5 1.5 A 3.5 3.5 0 0 1 8.5 5" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 5 5" to="360 5 5" dur="0.9s" repeatCount="indefinite" />
      </path>
    </svg>);

}

function easeOutQuad(t) {return 1 - (1 - t) * (1 - t);}

function BlurFade({ ready, children }) {
  const supportRef = useRefT(null);
  if (supportRef.current === null) {
    let supports = false;
    try {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      supports = !!(ctx && typeof ctx.drawElement === "function");
    } catch {supports = false;}
    supportRef.current = supports;
  }
  return supportRef.current ?
  <CanvasBlur ready={ready}>{children}</CanvasBlur> :
  <CssBlur ready={ready}>{children}</CssBlur>;
}

function CssBlur({ ready, children }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{
        position: "absolute", inset: 0,
        filter: `blur(${ready ? 0 : 20}px) saturate(${ready ? 1 : 0.6})`,
        opacity: ready ? 1 : 0.7,
        transition: "filter 700ms cubic-bezier(.2,.7,.2,1), opacity 700ms",
        pointerEvents: ready ? "auto" : "none"
      }}>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.02), transparent 60%)`,
        opacity: ready ? 0 : 1,
        transition: "opacity 700ms",
        pointerEvents: "none"
      }} />
    </div>);

}

function CanvasBlur({ ready, children }) {
  const srcRef = useRefT(null);
  const cvsRef = useRefT(null);
  const blurRef = useRefT(ready ? 0 : 22);

  useEffectT(() => {
    let raf,cancelled = false;
    const cvs = cvsRef.current,src = srcRef.current;
    if (!cvs || !src) return;
    const ctx = cvs.getContext("2d");
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cvs.getBoundingClientRect();
      cvs.width = Math.max(2, r.width * dpr | 0);
      cvs.height = Math.max(2, r.height * dpr | 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    const ro = new ResizeObserver(size);ro.observe(cvs);
    function paint() {
      if (cancelled) return;
      const target = ready ? 0 : 22;
      blurRef.current += (target - blurRef.current) * 0.12;
      ctx.clearRect(0, 0, cvs.clientWidth, cvs.clientHeight);
      ctx.filter = `blur(${blurRef.current.toFixed(2)}px)`;
      try {ctx.drawElement(src, 0, 0, cvs.clientWidth, cvs.clientHeight);} catch {}
      raf = requestAnimationFrame(paint);
    }
    raf = requestAnimationFrame(paint);
    return () => {cancelled = true;cancelAnimationFrame(raf);ro.disconnect();};
  }, [ready]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={srcRef} style={{
        position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 200ms",
        pointerEvents: ready ? "auto" : "none"
      }}>{children}</div>
      {!ready &&
      <canvas ref={cvsRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      }
    </div>);

}

const sectionStyles = {
  root: { position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }
};

const statusStyles = {
  root: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 5 },
  card: { width: "min(320px, 80%)", background: "rgba(4,4,4,0.92)", border: "1px solid #1a1a1a", padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 10, backdropFilter: "blur(4px)" },
  head: { display: "flex", alignItems: "center", gap: 10 },
  stage: { fontSize: 10, color: "#777", letterSpacing: "0.2em" },
  msg: { fontSize: 13, color: "#fff", lineHeight: 1.4, letterSpacing: "-0.005em", minHeight: 36 },
  counterRow: { display: "flex", alignItems: "baseline", gap: 8 },
  counter: { fontSize: 24, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" },
  counterLabel: { fontSize: 10, color: "#666", letterSpacing: "0.16em" },
  bar: { height: 1, background: "#1a1a1a", overflow: "hidden" },
  barFill: { height: "100%", background: "#fff", transition: "width .15s linear" },
  dots: { display: "flex", gap: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: "50%", transition: "background .2s, opacity .2s" }
};

// ════════════════════════ TERMINAL OVERVIEW ════════════════════════
// First-screen view: condensed sentiment + engagement + blueprint in one
// scroll. Each panel has a "Show more →" button that jumps to that tab.

function TerminalOverview({ community, ready, subFor, onJump, personalized, onPersonalize, streakDays, onStreakClick, onAction }) {
  const sentiment = community.sentiment || [];
  const cloud = (community.cloud || []).slice().sort((a, b) => b.w - a.w);
  const cloudTop = cloud.slice(0, 5);
  const maxW = Math.max(...cloud.map((c) => c.w), 1);

  const posts = (community.posts || []).slice().sort((a, b) => (b.rel ?? 0) - (a.rel ?? 0));
  const postsTop = posts.slice(0, 2);

  const items = (community.blueprint || []).slice(0, 3);

  // Tour highlight that cycles through the 3 panels. User clicks "next" to
  // advance; the highlight on a panel auto-clears once that panel's data has
  // loaded in (so it disappears with the information box).
  const [tourStep, setTourStep] = useStateT(0);
  const allReady = ready.sentiment && ready.engagement && ready.blueprint;
  const panelReady = [ready.sentiment, ready.engagement, ready.blueprint];
  // Auto-advance past panels that are already loaded.
  useEffectT(() => {
    if (allReady) return;
    if (tourStep < 3 && panelReady[tourStep]) {
      setTourStep((s) => Math.min(3, s + 1));
    }
  }, [ready.sentiment, ready.engagement, ready.blueprint, tourStep, allReady]);

  function tourHighlight(idx) {
    // hide highlight on a panel once its data has arrived
    if (panelReady[idx]) return false;
    return tourStep === idx;
  }
  const tourActive = !allReady && tourStep < 3;

  return (
    <div style={overviewStyles.wrap} className="lr-overview-wrap">
      <div style={overviewStyles.head}>
        <div>
          <div style={overviewStyles.title}>Terminal · {community.name}</div>
          <div className="mono" style={overviewStyles.sub}>at-a-glance · open a tab for the full view</div>
        </div>
        {tourActive &&
          <div style={overviewStyles.tourPill} className="mono">
            <span style={overviewStyles.tourPillDot}/>
            tour · {tourStep + 1}/3
          </div>
        }
      </div>

      <div style={overviewStyles.grid} className="lr-overview-grid">

        {/* SENTIMENT PANEL */}
        <div style={{...overviewStyles.panel, ...(tourHighlight(0) ? overviewStyles.panelTour : null)}} className="lr-overview-panel" data-tour-active={tourHighlight(0) || undefined}>
          {ready.sentiment ?
          <>
              <div style={overviewStyles.panelHead}>
                <span className="mono" style={overviewStyles.eyebrow}>01 · sentiment</span>
                <span className="mono" style={overviewStyles.eyebrowMeta}>24h</span>
              </div>
              <div style={overviewStyles.sentimentBody}>
                <SentimentPie data={sentiment} />
                <div style={overviewStyles.miniLegend} className="lr-overview-bulk">
                  {sentiment.map((s) =>
                <div key={s.label} style={overviewStyles.miniLegendRow}>
                      <span style={{ ...overviewStyles.swatch, background: s.color }} />
                      <span style={overviewStyles.miniLegendLabel}>{s.label}</span>
                      <span className="mono" style={overviewStyles.miniLegendVal}>{s.value}%</span>
                    </div>
                )}
                </div>
                <div style={overviewStyles.mobileSummary} className="lr-overview-mobile-summary">
                  <div style={overviewStyles.mobileSummaryLine}>
                    <span style={{...overviewStyles.swatch, background:sentiment[0]?.color}}/>
                    <span style={overviewStyles.mobileSummaryStrong}>{sentiment[0]?.value}% {sentiment[0]?.label}</span>
                  </div>
                  <div style={overviewStyles.mobileSummarySub}>top keyword: <strong style={{color:"#fff"}}>{cloudTop[0]?.t}</strong></div>
                </div>
              </div>
              <div style={overviewStyles.divider} className="lr-overview-bulk" />
              <div style={overviewStyles.miniKeywords} className="lr-overview-bulk">
                <span className="mono" style={overviewStyles.miniLabel}>top keywords</span>
                {cloudTop.map((c, i) =>
              <div key={c.t} style={overviewStyles.kwRow}>
                    <span style={overviewStyles.kwTerm}>{c.t}</span>
                    <div style={overviewStyles.kwTrack}>
                      <div style={{ ...overviewStyles.kwFill, width: `${c.w / maxW * 100}%` }} />
                    </div>
                    <span className="mono" style={overviewStyles.kwVal}>{c.w}</span>
                  </div>
              )}
              </div>
              {!personalized &&
            <button onClick={onPersonalize} style={overviewStyles.personalizeHint} className="lr-personalize-hint lr-overview-bulk"
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(240,166,87,0.10)"; e.currentTarget.style.borderColor = "#564524"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(240,166,87,0.04)"; e.currentTarget.style.borderColor = "#2a2418"; }}>
                  <span className="mono" style={overviewStyles.hintText}>unlock personalized scoring</span>
                  <span style={overviewStyles.hintArrow}>→</span>
                </button>
            }
              <button onClick={() => onJump("sentiment")} style={overviewStyles.showMore} className="mono lr-overview-more">
                show more <span>→</span>
              </button>
            </> :

          <SkeletonPanel title="01 · sentiment" sub={subFor(1)} kind="sentiment" />
          }
          {tourHighlight(0) && <TourHighlight step={0} total={3} onNext={() => setTourStep((s) => s + 1)} onSkip={() => setTourStep(3)} />}
        </div>

        {/* ENGAGEMENT PANEL */}
        <div style={{...overviewStyles.panel, ...(tourHighlight(1) ? overviewStyles.panelTour : null)}} className="lr-overview-panel" data-tour-active={tourHighlight(1) || undefined}>
          {ready.engagement ?
          <>
              <div style={overviewStyles.panelHead}>
                <span className="mono" style={overviewStyles.eyebrow}>02 · engagement</span>
                <span className="mono" style={overviewStyles.eyebrowMeta}>{posts.length} posts</span>
              </div>
              <div style={overviewStyles.mobileSummary} className="lr-overview-mobile-summary">
                <div style={overviewStyles.mobileSummaryLine}>
                  <span style={overviewStyles.mobileSummaryStrong}>{postsTop[0]?.title}</span>
                </div>
                <div style={overviewStyles.mobileSummarySub}>{postsTop[0]?.author} · ▲ {postsTop[0]?.score.toLocaleString()} · {posts.length} posts ranked</div>
              </div>
              <div style={overviewStyles.postList} className="lr-overview-bulk">
                {postsTop.map((p, i) =>
              <button key={p.id} style={overviewStyles.miniPost} disabled={!ready.engagement} onClick={() => onAction && onAction("comment")}
              onMouseEnter={(e) => {e.currentTarget.style.background = "#080808";}}
              onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";}}>
                    <span className="mono" style={overviewStyles.postIdx}>{String(i + 1).padStart(2, "0")}</span>
                    <div style={overviewStyles.postBody}>
                      <div className="mono" style={overviewStyles.postMeta}>
                        <span>{p.author}</span>
                        <span style={{ color: "#333" }}>·</span>
                        <span>{p.age}</span>
                      </div>
                      <div style={overviewStyles.postTitle}>{p.title}</div>
                      <div className="mono" style={overviewStyles.postMetaBot}>
                        ▲ {p.score.toLocaleString()} · {p.comments} comments
                      </div>
                    </div>
                  </button>
              )}
              </div>
              <button onClick={() => onJump("engagement")} style={overviewStyles.showMore} className="mono lr-overview-more">
                show more <span>({posts.length - postsTop.length} more) →</span>
              </button>
            </> :

          <SkeletonPanel title="02 · engagement" sub={subFor(2)} kind="engagement" />
          }
          {tourHighlight(1) && <TourHighlight step={1} total={3} onNext={() => setTourStep((s) => s + 1)} onSkip={() => setTourStep(3)} />}
        </div>

        {/* BLUEPRINT PANEL */}
        <div style={{...overviewStyles.panel, ...(tourHighlight(2) ? overviewStyles.panelTour : null)}} className="lr-overview-panel" data-tour-active={tourHighlight(2) || undefined}>
          {ready.blueprint ?
          <>
              <div style={overviewStyles.panelHead}>
                <span className="mono" style={overviewStyles.eyebrow}>03 · blueprint</span>
                <span className="mono" style={overviewStyles.eyebrowMeta}>3 moves</span>
              </div>
              <div style={overviewStyles.mobileSummary} className="lr-overview-mobile-summary">
                <div style={overviewStyles.mobileSummaryLine}>
                  <span className="mono" style={{...overviewStyles.bpKind, padding:0, border:"none"}}>{items[0]?.kind}</span>
                  <span style={overviewStyles.mobileSummaryStrong}>{items[0]?.title}</span>
                </div>
                <div style={overviewStyles.mobileSummarySub}>3 moves ready in {community.name}</div>
              </div>
              <div style={overviewStyles.bpList} className="lr-overview-bulk">
                {items.map((ins, i) =>
              <div key={i} style={overviewStyles.bpMini}>
                    <span className="mono" style={overviewStyles.bpKind}>{ins.kind}</span>
                    <div style={overviewStyles.bpTitle}>{ins.title}</div>
                  </div>
              )}
              </div>
              <span className="lr-overview-bulk"><StreakBadge days={streakDays} onClick={onStreakClick} /></span>
              <button onClick={() => onJump("blueprint")} style={overviewStyles.showMore} className="mono lr-overview-more">
                show more <span>→</span>
              </button>
            </> :

          <SkeletonPanel title="03 · blueprint" sub={subFor(3)} kind="blueprint" />
          }
          {tourHighlight(2) && <TourHighlight step={2} total={3} onNext={() => setTourStep(3)} onSkip={() => setTourStep(3)} last />}
        </div>

      </div>
    </div>);

}

// Tour overlay rendered inside one panel at a time during loading.
// Click "Next" to advance; the overlay disappears automatically when that
// panel's real data arrives.
function TourHighlight({ step, total, onNext, onSkip, last }) {
  return (
    <div style={tourStyles.frame} className="lr-tour-frame">
      <div style={tourStyles.ring}/>
      <div style={tourStyles.tip} className="lr-tour-tip">
        <span className="mono" style={tourStyles.tipCount}>{step + 1} / {total}</span>
        <div style={tourStyles.tipBtns}>
          {!last && <button onClick={onSkip} style={tourStyles.tipSkip} className="mono">skip</button>}
          <button onClick={onNext} style={tourStyles.tipNext}>
            {last ? "done" : "next"} <span style={{marginLeft:6}}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const tourStyles = {
  frame:{ position:"absolute", inset:-2, pointerEvents:"none", zIndex:4 },
  ring:{ position:"absolute", inset:0, border:"1px solid #3f9c6a", boxShadow:"0 0 0 1px rgba(63,156,106,.35), 0 0 32px rgba(63,156,106,.32), inset 0 0 18px rgba(63,156,106,.10)", animation:"lrTourPulse 1.8s ease-in-out infinite" },
  tip:{ position:"absolute", bottom:-12, right:12, transform:"translateY(100%)", display:"inline-flex", alignItems:"center", gap:12, padding:"8px 12px 8px 14px", background:"#040404", border:"1px solid #3f9c6a", color:"#fff", pointerEvents:"auto", boxShadow:"0 8px 24px rgba(0,0,0,.55)" },
  tipCount:{ fontSize:10, color:"#5cd197", letterSpacing:"0.22em" },
  tipBtns:{ display:"inline-flex", gap:6 },
  tipSkip:{ background:"transparent", border:"none", color:"#666", fontSize:10, letterSpacing:"0.18em", padding:"6px 8px", cursor:"pointer" },
  tipNext:{ background:"#3f9c6a", color:"#000", border:"none", padding:"6px 12px", fontSize:11, fontWeight:600, letterSpacing:"0.04em", cursor:"pointer", display:"inline-flex", alignItems:"center" },
};

function SkeletonPanel({ title, sub, kind }) {
  const msg = sub?.stage?.substages?.[sub.subIdx]?.msg;
  const meta = SKELETON_META[kind] || {};
  return (
    <div style={overviewStyles.skeleton}>
      <div style={overviewStyles.panelHead}>
        <span className="mono" style={overviewStyles.eyebrow}>{title}</span>
        <Spinner />
      </div>
      <div style={overviewStyles.skelExplainTitle}>{meta.title}</div>
      <div style={overviewStyles.skelExplain}>{meta.body}</div>
      <div style={overviewStyles.skelPreviewWrap}>
        <div style={overviewStyles.skelPreviewBlur}>{meta.preview}</div>
      </div>
      <div className="mono" style={overviewStyles.skelMsg}>{msg ? `${msg}…` : "queued…"}</div>
      <div style={overviewStyles.skelLines}>
        {[1, 2, 3].map((i) =>
        <div key={i} style={{ ...overviewStyles.skelBar, width: `${100 - i * 12}%` }} />
        )}
      </div>
    </div>);

}

const SKELETON_META = {
  sentiment: {
    title: "How does your community feel?",
    body: "We score every thread in the last 24h to show whether the room is open, skeptical, or actively asking for what you sell.",
    preview: (
      <div style={{display:"flex", alignItems:"center", gap:12}}>
        <svg width="64" height="64" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#5cd197" strokeWidth="12" strokeDasharray="110 200"/>
          <circle cx="40" cy="40" r="30" fill="none" stroke="#888"    strokeWidth="12" strokeDasharray="55 200"  strokeDashoffset="-110"/>
          <circle cx="40" cy="40" r="30" fill="none" stroke="#f0c054" strokeWidth="12" strokeDasharray="28 200"  strokeDashoffset="-165"/>
        </svg>
        <div style={{display:"flex", flexDirection:"column", gap:6, flex:1}}>
          <div style={{height:8, background:"#2a2a2a", width:"80%"}}/>
          <div style={{height:8, background:"#1a1a1a", width:"60%"}}/>
          <div style={{height:8, background:"#1a1a1a", width:"70%"}}/>
        </div>
      </div>
    ),
  },
  engagement: {
    title: "Which posts should you reply to?",
    body: "We rank live posts by relevance, heat, and reply-window so you spend time where a thoughtful comment actually compounds.",
    preview: (
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {[1,2].map(i => (
          <div key={i} style={{display:"flex", flexDirection:"column", gap:5, paddingBottom:6, borderBottom:"1px solid #1a1a1a"}}>
            <div style={{height:6, background:"#2a2a2a", width:"40%"}}/>
            <div style={{height:10, background:"#333", width:"90%"}}/>
            <div style={{height:6, background:"#1a1a1a", width:"55%"}}/>
          </div>
        ))}
      </div>
    ),
  },
  blueprint: {
    title: "What should you do today?",
    body: "Three concrete moves: one post worth reading, one conversation to join, one way to give back — drafted in your voice.",
    preview: (
      <div style={{display:"flex", flexDirection:"column", gap:8}}>
        {["read","join","give"].map(k => (
          <div key={k} style={{padding:"8px 10px", border:"1px solid #1a1a1a", display:"flex", flexDirection:"column", gap:4}}>
            <div style={{height:6, background:"#2a2a2a", width:30}}/>
            <div style={{height:8, background:"#333", width:"75%"}}/>
          </div>
        ))}
      </div>
    ),
  },
};

const overviewStyles = {
  wrap: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, height: "100%", overflow: "auto" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, flexWrap: "wrap" },
  title: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" },
  sub: { fontSize: 10, color: "#555", letterSpacing: "0.18em", marginTop: 4 },
  tourPill: { display:"inline-flex", alignItems:"center", gap:8, padding:"6px 12px", border:"1px solid #3f9c6a", color:"#5cd197", fontSize:10, letterSpacing:"0.2em", background:"rgba(63,156,106,0.08)" },
  tourPillDot: { width:6, height:6, borderRadius:"50%", background:"#5cd197", boxShadow:"0 0 8px rgba(92,209,151,.6)", animation:"lrPulse 1.4s infinite" },

  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "stretch" },
  panel: { position:"relative", display: "flex", flexDirection: "column", gap: 12, padding: "18px 18px 16px", border: "1px solid #141414", background: "#040404", minHeight: 340 },
  panelTour: { borderColor: "transparent" },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 10, color: "#888", letterSpacing: "0.22em" },
  eyebrowMeta: { fontSize: 10, color: "#444", letterSpacing: "0.16em" },

  sentimentBody: { display: "flex", gap: 14, alignItems: "center" },
  miniLegend: { display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 },
  miniLegendRow: { display: "grid", gridTemplateColumns: "10px 1fr 36px", alignItems: "center", gap: 8 },
  swatch: { width: 8, height: 8 },
  miniLegendLabel: { fontSize: 11, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  miniLegendVal: { fontSize: 10, color: "#fff", textAlign: "right", fontVariantNumeric: "tabular-nums" },

  divider: { height: 1, background: "#0e0e0e" },
  miniKeywords: { display: "flex", flexDirection: "column", gap: 4 },
  miniLabel: { fontSize: 9, color: "#555", letterSpacing: "0.2em", marginBottom: 4 },
  kwRow: { display: "grid", gridTemplateColumns: "1fr 60px 28px", alignItems: "center", gap: 8, padding: "3px 0" },
  kwTerm: { fontSize: 12, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  kwTrack: { width: "100%", height: 2, background: "#111" },
  kwFill: { height: "100%", background: "#fff" },
  kwVal: { fontSize: 10, color: "#666", textAlign: "right", fontVariantNumeric: "tabular-nums" },

  personalizeHint: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", border: "1px dashed #2a2418", background: "rgba(240,166,87,0.04)", marginTop: 4, width:"100%", cursor:"pointer", transition:"all .15s", textAlign:"left", color:"inherit" },
  hintText: { fontSize: 10, color: "#bb9560", letterSpacing: "0.14em" },
  hintArrow: { fontSize: 12, color: "#e6cd8d" },
  hintBtn: { background: "transparent", border: "none", color: "#e6cd8d", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", padding: 0 },

  postList: { display: "flex", flexDirection: "column", gap: 0, flex: 1 },
  miniPost: { display: "grid", gridTemplateColumns: "22px 1fr", gap: 10, padding: "10px 0", borderBottom: "1px solid #0d0d0d", background: "transparent", border: "none", borderBottom: "1px solid #0d0d0d", textAlign: "left", color: "#fff", cursor: "pointer", transition: "background .15s" },
  postIdx: { fontSize: 10, color: "#444", letterSpacing: "0.18em", paddingTop: 3 },
  postBody: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  postMeta: { display: "flex", gap: 6, fontSize: 9, color: "#666", letterSpacing: "0.1em" },
  postTitle: { fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.4, letterSpacing: "-0.005em" },
  postMetaBot: { fontSize: 9, color: "#666", letterSpacing: "0.1em" },

  bpList: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  bpMini: { display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", border: "1px solid #141414" },
  bpKind: { fontSize: 9, color: "#bbb", letterSpacing: "0.22em", textTransform: "uppercase" },
  bpTitle: { fontSize: 13, color: "#fff", fontWeight: 600, letterSpacing: "-0.005em" },

  showMore: { marginTop: "auto", background: "transparent", border: "1px solid #1a1a1a", color: "#ccc", padding: "9px 14px", fontSize: 11, letterSpacing: "0.14em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },

  // Mobile-only summary line — hidden by default, shown on small screens
  mobileSummary: { display:"none", flexDirection:"column", gap:3, flex:1, minWidth:0 },
  mobileSummaryLine: { display:"flex", alignItems:"center", gap:8, minWidth:0 },
  mobileSummaryStrong: { fontSize:13, color:"#fff", fontWeight:600, letterSpacing:"-0.005em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  mobileSummarySub: { fontSize:10, color:"#666", letterSpacing:"0.06em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },

  skeleton: { display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  skelExplainTitle: { fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.005em", marginTop: 4 },
  skelExplain: { fontSize: 12, color: "#888", lineHeight: 1.55, letterSpacing: "-0.005em" },
  skelPreviewWrap: { position: "relative", padding: "12px 12px", border: "1px solid #141414", background: "#060606", overflow: "hidden", marginTop: 4 },
  skelPreviewBlur: { filter: "blur(3px) saturate(0.8)", opacity: 0.55 },
  skelMsg: { fontSize: 10, color: "#777", letterSpacing: "0.16em", marginTop: 4 },
  skelLines: { display: "flex", flexDirection: "column", gap: 6, marginTop: 4 },
  skelBar: { height: 2, background: "#1a1a1a" }
};

// ════════════════════════ STREAKS MODAL ════════════════════════

function StreaksModal({ days, onClose }) {
  const target = 90;
  const pct = Math.min(1, days / target);
  return (
    <div style={streakModalStyles.backdrop} className="lr-modal-backdrop" onClick={onClose}>
      <div style={streakModalStyles.dialog} className="lr-streaks-dialog" onClick={(e) => e.stopPropagation()}>
        <header style={streakModalStyles.header}>
          <div>
            <h3 style={streakModalStyles.title}>Streaks · coming soon</h3>
            <div className="mono" style={streakModalStyles.eyebrow}>show up every day · earn free credits</div>
          </div>
          <button onClick={onClose} style={streakModalStyles.close} className="mono">esc</button>
        </header>
        <div style={streakModalStyles.body}>
          <div style={streakModalStyles.bigRow}>
            <div style={streakModalStyles.bigNum}>{days}</div>
            <div style={streakModalStyles.bigSide}>
              <div style={streakModalStyles.bigLabel}>day streak</div>
              <div className="mono" style={streakModalStyles.bigSub}>{target - days} days to your next reward</div>
            </div>
          </div>
          <div style={streakModalStyles.bar}>
            <div style={{ ...streakModalStyles.barFill, width: `${pct * 100}%` }} />
          </div>
          <div style={streakModalStyles.rewardRow}>
            <span className="mono" style={streakModalStyles.rewardLabel}>90-day reward</span>
            <span style={streakModalStyles.rewardVal}>100 credits</span>
            <span className="mono" style={streakModalStyles.rewardSub}>worth $10</span>
          </div>
          <div style={streakModalStyles.fine}>
            Earn streaks for free credits. A 90-day streak unlocks 100 credits — that's $10 of engagement, on us. Miss a day and the streak resets to zero. We'll roll this out soon.
          </div>
        </div>
        <footer style={streakModalStyles.footer}>
          <span className="mono" style={streakModalStyles.footerMeta}>preview · not yet active</span>
          <button onClick={onClose} style={streakModalStyles.ok}>got it</button>
        </footer>
      </div>
    </div>);

}

const streakModalStyles = {
  backdrop: { position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 },
  dialog: { width: "min(480px, 100%)", background: "#040404", border: "1px solid #1a1a1a", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 22px", borderBottom: "1px solid #111" },
  title: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" },
  eyebrow: { fontSize: 10, color: "#666", letterSpacing: "0.18em", marginTop: 4 },
  close: { background: "transparent", border: "none", color: "#666", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" },
  body: { padding: "22px", display: "flex", flexDirection: "column", gap: 14 },
  bigRow: { display: "flex", alignItems: "center", gap: 18 },
  bigNum: { fontSize: 64, fontWeight: 600, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" },
  bigSide: { display: "flex", flexDirection: "column", gap: 4 },
  bigLabel: { fontSize: 14, color: "#ddd" },
  bigSub: { fontSize: 10, color: "#666", letterSpacing: "0.14em" },
  bar: { height: 3, background: "#1a1a1a", overflow: "hidden" },
  barFill: { height: "100%", background: "#f0a657" },
  rewardRow: { display: "flex", alignItems: "baseline", gap: 10, padding: "10px 12px", border: "1px solid #2a2418", background: "rgba(240,166,87,0.04)" },
  rewardLabel: { fontSize: 10, color: "#bb9560", letterSpacing: "0.18em" },
  rewardVal: { fontSize: 15, fontWeight: 600, color: "#fff" },
  rewardSub: { fontSize: 10, color: "#666", letterSpacing: "0.14em", marginLeft: "auto" },
  fine: { fontSize: 12, color: "#888", lineHeight: 1.55, letterSpacing: "-0.005em" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #111" },
  footerMeta: { fontSize: 10, color: "#555", letterSpacing: "0.16em" },
  ok: { background: "#fff", color: "#000", border: "none", padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }
};

// ════════════════════════ SENTIMENT VIEW ════════════════════════
// Pie chart (community sentiment) + bar chart of trending keywords to engage.

function SentimentView({ community, personalized, onPersonalize }) {
  const sentiment = community.sentiment || [];
  const cloud = (community.cloud || []).slice().sort((a, b) => b.w - a.w).slice(0, 12);
  const maxW = Math.max(...cloud.map((c) => c.w), 1);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <div style={sentimentStyles.wrap} className="lr-sentiment-wrap">
      {/* Pie */}
      <div style={sentimentStyles.panel} className="lr-sentiment-panel">
        <div style={colStyles.eyebrowRow}>
          <span className="mono" style={colStyles.eyebrow}>community sentiment · 24h</span>
          <span className="mono" style={colStyles.eyebrowMeta}>{sentiment.reduce((s, x) => s + x.value, 0)}% sampled</span>
        </div>
        <div style={sentimentStyles.pieRow} className="lr-sentiment-pie-row">
          <SentimentPie data={sentiment} />
          <div style={sentimentStyles.legend}>
            {sentiment.map((s) =>
              <div key={s.label} style={sentimentStyles.legendRow}>
                <span style={{ ...sentimentStyles.swatch, background: s.color }} />
                <span style={sentimentStyles.legendLabel}>{s.label}</span>
                <span className="mono" style={sentimentStyles.legendVal}>{s.value}%</span>
              </div>
              )}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={sentimentStyles.panel} className="lr-sentiment-panel">
        <div style={colStyles.eyebrowRow}>
          <span className="mono" style={colStyles.eyebrow}>trending keywords to engage</span>
          <span className="mono" style={colStyles.eyebrowMeta}>{cloud.length} terms · descending</span>
        </div>
        <div style={chartStyles.list}>
          {cloud.map((c, i) => {
              const rel = c.w / maxW;
              const top = i < 3;
              return (
                <div key={c.t} style={chartStyles.row} className="lr-term-cloud-row"
                onMouseEnter={(e) => {e.currentTarget.style.background = "#080808";}}
                onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";}}>
                <span className="mono" style={{ ...chartStyles.rank, color: top ? "#666" : "#333" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ ...chartStyles.term, color: top ? "#fff" : "#888", fontWeight: top ? 600 : 400 }}>{c.t}</span>
                <div style={chartStyles.track}>
                  <div style={{ ...chartStyles.fill, width: `${rel * 100}%`, background: top ? "#fff" : "#444" }} />
                </div>
                <span className="mono" style={{ ...chartStyles.val, color: top ? "#fff" : "#555" }}>{c.w}</span>
              </div>);

            })}
        </div>
      </div>
    </div>
    {!personalized && <PersonalizeGate onClick={onPersonalize} />}
    </div>);

}

// Overlay shown over sentiment until the user uploads their reddit data.
function PersonalizeGate({ onClick }) {
  return (
    <div style={gateStyles.root} className="lr-personalize-gate">
      <div style={gateStyles.blur} />
      <div style={gateStyles.card} className="lr-personalize-card">
        <span className="mono" style={gateStyles.eyebrow}>locked · until you connect</span>
        <div style={gateStyles.title}>Personalize this view to your voice</div>
        <div style={gateStyles.sub}>
          Sentiment scoring and keyword surfacing improve dramatically once we have your past Reddit comments to anchor on. Processed on-device, never uploaded.
        </div>
        <button style={gateStyles.btn} onClick={onClick} className="lr-personalize-btn">
          Personalize writing style <span style={{ marginLeft: 8 }}>→</span>
        </button>
      </div>
    </div>);

}

const gateStyles = {
  root: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 6 },
  blur: { position: "absolute", inset: 0, backdropFilter: "blur(10px) saturate(0.7)", WebkitBackdropFilter: "blur(10px) saturate(0.7)", background: "rgba(0,0,0,.45)" },
  card: { position: "relative", maxWidth: 480, width: "100%", padding: "28px 28px 24px", background: "#040404", border: "1px solid #1f1f1f", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 30px 60px rgba(0,0,0,.5)" },
  eyebrow: { fontSize: 10, color: "#888", letterSpacing: "0.22em" },
  title: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 },
  sub: { fontSize: 13, color: "#999", lineHeight: 1.55, letterSpacing: "-0.005em" },
  btn: { marginTop: 8, alignSelf: "flex-start", background: "#fff", color: "#000", border: "none", padding: "12px 20px", fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", cursor: "pointer", display: "inline-flex", alignItems: "center" }
};

function SentimentPie({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 78,CX = 90,CY = 90,IR = 50;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const a0 = acc * Math.PI * 2 - Math.PI / 2;
    acc += frac;
    const a1 = acc * Math.PI * 2 - Math.PI / 2;
    const x0o = CX + R * Math.cos(a0),y0o = CY + R * Math.sin(a0);
    const x1o = CX + R * Math.cos(a1),y1o = CY + R * Math.sin(a1);
    const x0i = CX + IR * Math.cos(a1),y0i = CY + IR * Math.sin(a1);
    const x1i = CX + IR * Math.cos(a0),y1i = CY + IR * Math.sin(a0);
    const large = frac > 0.5 ? 1 : 0;
    const path = `M ${x0o} ${y0o} A ${R} ${R} 0 ${large} 1 ${x1o} ${y1o} L ${x0i} ${y0i} A ${IR} ${IR} 0 ${large} 0 ${x1i} ${y1i} Z`;
    return { d: path, color: d.color, key: d.label };
  });
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ flex: "0 0 auto" }}>
      {arcs.map((a) =>
      <path key={a.key} d={a.d} fill={a.color} stroke="#000" strokeWidth="2" />
      )}
      <text x="90" y="86" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="600" fontFamily="Geist, sans-serif" letterSpacing="-0.02em">{data[0]?.value || 0}%</text>
      <text x="90" y="104" textAnchor="middle" fill="#666" fontSize="9" fontFamily="Geist Mono, monospace" letterSpacing="0.16em">{(data[0]?.label || "").toUpperCase()}</text>
    </svg>);

}

const sentimentStyles = {
  wrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, padding: 0, height: "100%", overflow: "hidden" },
  panel: { padding: "24px 28px", borderRight: "1px solid #0e0e0e", display: "flex", flexDirection: "column", overflow: "hidden" },
  pieRow: { display: "flex", alignItems: "center", gap: 32, flex: 1 },
  legend: { display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  legendRow: { display: "grid", gridTemplateColumns: "14px 1fr 48px", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px solid #0d0d0d" },
  swatch: { width: 10, height: 10 },
  legendLabel: { fontSize: 13, color: "#ddd" },
  legendVal: { fontSize: 12, color: "#fff", textAlign: "right", fontVariantNumeric: "tabular-nums" }
};

// ════════════════════════ ENGAGEMENT VIEW ════════════════════════
// Relevant Posts list with sort buttons (Relevance / Hot / Top / New).

const SORTS = [
{ id: "rel", label: "Relevance" },
{ id: "hot", label: "Hot" },
{ id: "top", label: "Top" },
{ id: "new", label: "New" }];


function EngagementView({ community, onAction, disabled }) {
  const [sort, setSort] = useStateT("rel");
  const [showAll, setShowAll] = useStateT(false);
  const posts = useMemoT(() => {
    const arr = (community.posts || []).slice();
    arr.sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));
    return arr;
  }, [community, sort]);
  useEffectT(() => {setShowAll(false);}, [community.id, sort]);

  const visible = showAll ? posts : posts.slice(0, 3);

  return (
    <div style={engStyles.wrap} className="lr-engagement-wrap">
      <div style={engStyles.head}>
        <div>
          <div style={engStyles.title}>Relevant Posts</div>
          <div className="mono" style={engStyles.sub}>{posts.length} posts · sorted by {SORTS.find((s) => s.id === sort).label.toLowerCase()}</div>
        </div>
        <div style={engStyles.sortRow} className="lr-engagement-sort-row">
          {SORTS.map((s) =>
          <button key={s.id} onClick={() => setSort(s.id)} className="lr-engagement-sort" style={{
            ...engStyles.sortBtn,
            background: sort === s.id ? "#fff" : "transparent",
            color: sort === s.id ? "#000" : "#bbb",
            borderColor: sort === s.id ? "#fff" : "#1a1a1a"
          }}>{s.label}</button>
          )}
        </div>
      </div>

      <div style={engStyles.list}>
        {visible.map((p, i) =>
        <button key={p.id} style={engStyles.post} className="lr-engagement-post"
        onMouseEnter={(e) => {e.currentTarget.style.background = "#080808";}}
        onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";}}
        disabled={disabled}
        onClick={() => onAction && onAction("comment")}>
            <span className="mono" style={engStyles.postIdx}>{String(i + 1).padStart(2, "0")}</span>
            <div style={engStyles.postBody}>
              <div style={engStyles.postMetaTop} className="mono">
                <span>{p.author}</span>
                <span style={engStyles.dot}>·</span>
                <span>{p.age}</span>
                <span style={engStyles.dot}>·</span>
                <span style={engStyles.flair}>{p.flair}</span>
              </div>
              <div style={engStyles.postTitle}>{p.title}</div>
              <div style={engStyles.postMetaBot} className="mono">
                <span>▲ {p.score.toLocaleString()}</span>
                <span style={engStyles.dot}>·</span>
                <span>{p.comments} comments</span>
                <span style={engStyles.dot}>·</span>
                <span style={engStyles.relScore}>{sort.toUpperCase()} {(p[sort] * 100).toFixed(0)}</span>
              </div>
            </div>
            <span style={engStyles.postArrow}>→</span>
          </button>
        )}
      </div>

      {posts.length > 3 &&
      <div style={engStyles.moreRow}>
          <button onClick={() => setShowAll((v) => !v)} style={engStyles.moreBtn} className="mono lr-engagement-more">
            {showAll ? `↑ show less` : `↓ show more (${posts.length - 3})`}
          </button>
        </div>
      }
    </div>);

}

const engStyles = {
  wrap: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18, height: "100%", overflow: "auto" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, flexWrap: "wrap" },
  title: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" },
  sub: { fontSize: 10, color: "#555", letterSpacing: "0.18em", marginTop: 4 },
  sortRow: { display: "flex", gap: 6 },
  sortBtn: { padding: "7px 14px", fontSize: 11, letterSpacing: "0.08em", fontWeight: 600, border: "1px solid", cursor: "pointer", transition: "all .15s" },

  list: { display: "flex", flexDirection: "column", gap: 0 },
  post: { display: "grid", gridTemplateColumns: "36px 1fr 22px", gap: 16, padding: "18px 14px", border: "none", borderBottom: "1px solid #0e0e0e", background: "transparent", textAlign: "left", color: "#fff", cursor: "pointer", transition: "background .15s", alignItems: "flex-start" },
  postIdx: { fontSize: 11, color: "#444", letterSpacing: "0.18em", paddingTop: 2 },
  postBody: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
  postMetaTop: { display: "flex", gap: 8, fontSize: 10, color: "#666", letterSpacing: "0.1em", alignItems: "center" },
  postMetaBot: { display: "flex", gap: 8, fontSize: 10, color: "#666", letterSpacing: "0.1em", alignItems: "center" },
  flair: { padding: "1px 6px", border: "1px solid #1a1a1a", color: "#888" },
  postTitle: { fontSize: 15, color: "#fff", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.4 },
  relScore: { color: "#cfeedd" },
  dot: { color: "#333" },
  postArrow: { fontSize: 14, color: "#555", paddingTop: 2 },

  moreRow: { display: "flex", justifyContent: "center", paddingTop: 4 },
  moreBtn: { background: "transparent", border: "1px solid #1a1a1a", color: "#aaa", padding: "9px 22px", fontSize: 11, letterSpacing: "0.14em", cursor: "pointer" }
};

// ════════════════════════ BLUEPRINT VIEW ════════════════════════
// Three card recommendations: read / join / give back.

const BLUEPRINT_ACTIONS = {
  read: { actionKind: "upvote", hint: "open & upvote" },
  join: { actionKind: "comment", hint: "draft a reply" },
  give: { actionKind: "post", hint: "write the answer" }
};

function BlueprintView({ community, onAction, disabled, streakDays, onStreakClick }) {
  const items = community.blueprint || [];
  return (
    <div style={bpStyles.wrap} className="lr-blueprint-wrap">
      <div style={bpStyles.head}>
        <div style={bpStyles.title}>Today's blueprint</div>
        <div className="mono" style={bpStyles.sub}>3 moves to make in {community.name}</div>
      </div>

      <div style={bpStyles.list}>
        {items.map((ins, i) => {
          const cfg = BLUEPRINT_ACTIONS[ins.kind] || BLUEPRINT_ACTIONS.read;
          return (
            <div key={i} style={bpStyles.card} className="lr-blueprint-card">
              <div style={bpStyles.cardLeft}>
                <span className="mono" style={bpStyles.num}>0{i + 1}</span>
                <span className="mono" style={bpStyles.kind}>{ins.kind}</span>
              </div>
              <div style={bpStyles.cardMain}>
                <div style={bpStyles.cardTitle}>{ins.title}</div>
                <div style={bpStyles.cardLine}>{ins.line}</div>
                {ins.postRef &&
                <div style={bpStyles.cardRef} className="mono">
                    <span style={bpStyles.cardRefLabel}>↳ post</span>
                    <span style={bpStyles.cardRefText}>{ins.postRef}</span>
                  </div>
                }
              </div>
              <button style={bpStyles.cardCta} className="lr-blueprint-cta" disabled={disabled}
              onClick={() => onAction && onAction(cfg.actionKind)}>
                <span>{ins.cta}</span>
                <span style={bpStyles.cardCtaArrow}>→</span>
              </button>
            </div>);

        })}
      </div>
      <StreakBadge days={streakDays} onClick={onStreakClick} />
    </div>);

}

// Subtle streak chip surfaced under Today's blueprint.
function StreakBadge({ days, onClick }) {
  if (!days) return null;
  return (
    <button onClick={onClick} style={streakStyles.badge} className="lr-streak-badge"
    onMouseEnter={(e) => {e.currentTarget.style.background = "#0a0a0a";}}
    onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";}}>
      <span style={streakStyles.flame} aria-hidden>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M6 1c.5 2 2.5 2.5 2.5 5.5 0 2-1.5 3.5-2.5 4 .5-1 .5-2-.5-3-.5 1.5-3 2-3 4.5 0 1.7 1.6 3 3.5 3s3.5-1.3 3.5-3c0-3.5-3-5.5-3.5-11Z" stroke="#f0a657" strokeWidth="1" fill="rgba(240,166,87,0.08)" />
        </svg>
      </span>
      <span className="mono" style={streakStyles.label}>streak</span>
      <span style={streakStyles.days}>{days}</span>
      <span className="mono" style={streakStyles.daysLabel}>days</span>
      <span style={streakStyles.arrow}>→</span>
    </button>);

}

const streakStyles = {
  badge: { display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 10, padding: "8px 14px", border: "1px solid #1a1a1a", background: "transparent", color: "#bbb", cursor: "pointer", transition: "background .15s", marginTop: 4 },
  flame: { display: "inline-flex" },
  label: { fontSize: 10, color: "#666", letterSpacing: "0.22em" },
  days: { fontSize: 14, color: "#fff", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  daysLabel: { fontSize: 10, color: "#555", letterSpacing: "0.16em" },
  arrow: { fontSize: 11, color: "#444", marginLeft: 4 }
};

const bpStyles = {
  wrap: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, height: "100%", overflow: "auto" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, flexWrap: "wrap" },
  title: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" },
  sub: { fontSize: 10, color: "#555", letterSpacing: "0.18em" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 24, padding: "20px 22px", border: "1px solid #141414", alignItems: "flex-start" },
  cardLeft: { display: "flex", flexDirection: "column", gap: 8 },
  num: { fontSize: 11, color: "#444", letterSpacing: "0.22em" },
  kind: { fontSize: 10, color: "#bbb", letterSpacing: "0.22em", padding: "3px 8px", border: "1px solid #2a2a2a", alignSelf: "flex-start", textTransform: "uppercase" },
  cardMain: { display: "flex", flexDirection: "column", gap: 10, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" },
  cardLine: { fontSize: 13, color: "#bbb", lineHeight: 1.55, letterSpacing: "-0.005em" },
  cardRef: { display: "flex", gap: 10, fontSize: 10, color: "#666", letterSpacing: "0.06em", alignItems: "baseline", paddingTop: 4, borderTop: "1px solid #0e0e0e", marginTop: 4 },
  cardRefLabel: { color: "#444" },
  cardRefText: { color: "#888", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardCta: { display: "inline-flex", gap: 10, alignItems: "center", background: "#fff", color: "#000", border: "none", padding: "11px 18px", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer", whiteSpace: "nowrap" },
  cardCtaArrow: { fontSize: 13 }
};

// ════════════════════════ CREDITS MODAL ════════════════════════
// Minimal top-up. Three tiers, payment-method row. Built to convince, not overwhelm.

const CREDIT_TIERS = [
{ id: "starter", price: 49, credits: 49, perCredit: 1.00 },
{ id: "growth", price: 99, credits: 100, perCredit: 0.99, popular: true },
{ id: "scale", price: 199, credits: 250, perCredit: 0.80, best: true }];


function CreditsModal({ credits, onTopUp, onClose }) {
  const [selected, setSelected] = useStateT("growth");
  const [stage, setStage] = useStateT("pick"); // pick → paying → done
  const tier = CREDIT_TIERS.find((t) => t.id === selected);

  function pay() {
    setStage("paying");
    setTimeout(() => {
      onTopUp(tier.credits);
      setStage("done");
    }, 1200);
    setTimeout(onClose, 2600);
  }

  return (
    <div style={creditsStyles.backdrop} className="lr-modal-backdrop" onClick={onClose}>
      <div style={creditsStyles.dialog} className="lr-credits-dialog" onClick={(e) => e.stopPropagation()}>
        <header style={creditsStyles.header} className="lr-modal-header">
          <div>
            <h3 style={creditsStyles.title}>Top up credits</h3>
            <div className="mono" style={creditsStyles.balance}>balance · {credits} credits</div>
          </div>
          <button onClick={onClose} style={creditsStyles.close} className="mono">esc</button>
        </header>

        <div style={creditsStyles.body} className="lr-credits-body">
          <div className="mono" style={creditsStyles.fieldLabel}>choose a package</div>
          <div style={creditsStyles.tiers} className="lr-credits-tiers">
            {CREDIT_TIERS.map((t) => {
              const isSelected = selected === t.id;
              return (
                <button key={t.id} onClick={() => setSelected(t.id)} style={{
                  ...creditsStyles.tier,
                  borderColor: isSelected ? "#fff" : "#1a1a1a",
                  background: isSelected ? "#0d0d0d" : "transparent"
                }} className="lr-credits-tier">
                  <div style={creditsStyles.tierTop}>
                    <span style={creditsStyles.tierPrice}>${t.price}</span>
                    {t.popular && <span style={creditsStyles.tierBadgePop} className="mono">popular</span>}
                    {t.best && <span style={creditsStyles.tierBadgeBest} className="mono">best value</span>}
                  </div>
                  <div style={creditsStyles.tierCredits}>{t.credits} credits</div>
                  <div className="mono" style={creditsStyles.tierPer}>${t.perCredit.toFixed(2)} / credit</div>
                  <div style={{ ...creditsStyles.tierCheck, opacity: isSelected ? 1 : 0 }}>●</div>
                </button>);

            })}
          </div>

          <div className="mono" style={creditsStyles.fieldLabel}>pay with</div>
          <div style={creditsStyles.payRow} className="lr-credits-pay-row">
            <PayBadge label="Visa" />
            <PayBadge label="Mastercard" />
            <PayBadge label="Amex" />
            <PayBadge label="Apple Pay" />
            <PayBadge label="Google Pay" />
          </div>

          <div style={creditsStyles.fine} className="mono">
            secure checkout · cards processed by stripe · cancel any time
          </div>
        </div>

        <footer style={creditsStyles.footer} className="lr-modal-footer">
          <span className="mono" style={creditsStyles.footerMeta}>
            {stage === "done" ? `+${tier.credits} added · new balance ${credits + tier.credits}` :
            stage === "paying" ? `charging $${tier.price.toFixed(2)}…` :
            `you'll be charged $${tier.price.toFixed(2)}`}
          </span>
          <button style={{
            ...creditsStyles.pay,
            background: stage === "done" ? "#1a1a1a" : "#fff",
            color: stage === "done" ? "#fff" : "#000"
          }} onClick={pay} disabled={stage !== "pick"} className="lr-credits-pay">
            {stage === "done" ? <>added <span>✓</span></> :
            stage === "paying" ? <>charging…</> :
            <>buy {tier.credits} credits <span>→</span></>}
          </button>
        </footer>
      </div>
    </div>);

}

function PayBadge({ label }) {
  return (
    <span style={{
      padding: "7px 12px", border: "1px solid #1a1a1a", fontSize: 10, color: "#aaa",
      letterSpacing: "0.1em", whiteSpace: "nowrap"
    }}>{label}</span>);

}

const creditsStyles = {
  backdrop: { position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 },
  dialog: { width: "min(640px, 100%)", background: "#040404", border: "1px solid #1a1a1a", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 22px", borderBottom: "1px solid #111" },
  title: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" },
  balance: { fontSize: 10, color: "#666", letterSpacing: "0.18em", marginTop: 4 },
  close: { background: "transparent", border: "none", color: "#666", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" },

  body: { padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 },
  fieldLabel: { fontSize: 10, color: "#555", letterSpacing: "0.2em" },

  tiers: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  tier: { position: "relative", padding: "16px 14px 14px", border: "1px solid", background: "transparent", color: "#fff", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, transition: "all .15s" },
  tierTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 },
  tierPrice: { fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  tierBadgePop: { fontSize: 9, color: "#e6cd8d", border: "1px solid #564524", padding: "2px 6px", letterSpacing: "0.16em" },
  tierBadgeBest: { fontSize: 9, color: "#5cd197", border: "1px solid #244534", padding: "2px 6px", letterSpacing: "0.16em" },
  tierCredits: { fontSize: 13, color: "#ddd", fontWeight: 500 },
  tierPer: { fontSize: 10, color: "#666", letterSpacing: "0.12em" },
  tierCheck: { position: "absolute", top: 8, right: 10, fontSize: 10, color: "#fff", transition: "opacity .15s" },

  payRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  fine: { fontSize: 9, color: "#444", letterSpacing: "0.14em", marginTop: 4 },

  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #111", gap: 12, flexWrap: "wrap" },
  footerMeta: { fontSize: 10, color: "#888", letterSpacing: "0.12em" },
  pay: { background: "#fff", color: "#000", border: "none", padding: "10px 18px", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }
};

// ════════════════════════ ACTION MODAL (unchanged) ════════════════════════

function ActionModal({ modal, tone, onClose }) {
  const { kind, community } = modal;
  const [stage, setStage] = useStateT("review");
  const [draft, setDraft] = useStateT(
    kind === "comment" ? community.suggestedComment :
    kind === "post" ? community.suggestedPost.body : ""
  );
  const [title, setTitle] = useStateT(kind === "post" ? community.suggestedPost.title : "");

  function ship() {
    setStage("sending");
    setTimeout(() => setStage("done"), 900);
    setTimeout(onClose, 2000);
  }

  const labels = {
    upvote: { h: "upvote", cta: ["confirm", "posting", "upvoted"] },
    comment: { h: "comment", cta: ["post", "posting", "posted"] },
    post: { h: "post", cta: ["publish", "publishing", "published"] }
  }[kind];

  const ctaText = stage === "done" ? labels.cta[2] : stage === "sending" ? labels.cta[1] : labels.cta[0];

  return (
    <div style={modalStyles.backdrop} className="lr-modal-backdrop" onClick={onClose}>
      <div style={modalStyles.dialog} className="lr-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <header style={modalStyles.header} className="lr-modal-header">
          <h3 style={modalStyles.title}>{labels.h}</h3>
          <button onClick={onClose} style={modalStyles.close} className="mono">esc</button>
        </header>

        {kind === "upvote" &&
        <div style={modalStyles.body} className="lr-modal-body">
            <div className="mono" style={modalStyles.postMeta}>{community.trending.author} · {community.trending.age} · {community.trending.score} pts</div>
            <div style={modalStyles.postTitle}>{community.trending.title}</div>
          </div>
        }

        {kind === "comment" &&
        <div style={modalStyles.body} className="lr-modal-body">
            <div className="mono" style={modalStyles.postMeta}>↳ {community.trending.title}</div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={modalStyles.textarea} rows={5} />
          </div>
        }

        {kind === "post" &&
        <div style={modalStyles.body} className="lr-modal-body">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={modalStyles.input} />
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={modalStyles.textarea} rows={7} />
          </div>
        }

        <footer style={modalStyles.footer} className="lr-modal-footer">
          <span className="mono" style={modalStyles.footerMeta}>{tone.voice.toLowerCase()} · {community.name}</span>
          <button style={{
            ...modalStyles.ship,
            background: stage === "done" ? "#1a1a1a" : "#fff",
            color: stage === "done" ? "#fff" : "#000"
          }} onClick={ship} disabled={stage !== "review"} className="lr-modal-ship">
            {ctaText} <span>{stage === "done" ? "✓" : "→"}</span>
          </button>
        </footer>
      </div>
    </div>);

}

// ════════════════════════ TONE PANEL ════════════════════════

function TonePanel({ tone, setTone, site, upload, setUpload, highlight, onClose }) {
  function set(k, v) {setTone((t) => ({ ...t, [k]: v }));}
  const fileRef = useRefT(null);
  const uploadRef = useRefT(null);

  function handleFile(f) {
    if (!f) return;
    const isZip = /\.zip$/i.test(f.name) || f.type === "application/zip";
    setUpload({ name: f.name, size: f.size, stage: "processing", isZip });
    setTimeout(() => setUpload((u) => u ? { ...u, stage: "ready" } : null), 1400);
  }
  function onPick(e) {handleFile(e.target.files && e.target.files[0]);}
  function onDrop(e) {e.preventDefault();handleFile(e.dataTransfer.files && e.dataTransfer.files[0]);}

  // Auto-scroll the upload card into view + pulse when settings was opened
  // with highlight="upload".
  useEffectT(() => {
    if (highlight === "upload" && uploadRef.current) {
      try {uploadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });} catch {}
    }
  }, [highlight]);

  return (
    <div style={tonePanelStyles.backdrop} onClick={onClose}>
      <div style={tonePanelStyles.sheet} className="lr-settings-sheet" onClick={(e) => e.stopPropagation()}>
        <header style={tonePanelStyles.head} className="lr-settings-head">
          <h3 style={tonePanelStyles.title}>settings</h3>
          <button onClick={onClose} style={tonePanelStyles.close} className="mono">esc</button>
        </header>

        <div style={tonePanelStyles.body} className="lr-settings-body">
          <div style={tonePanelStyles.col} className="lr-settings-col">
            <div className="mono" style={tonePanelStyles.fieldLabel}>Digital Identity</div>
            <textarea value={tone.bio} onChange={(e) => set("bio", e.target.value)} style={tonePanelStyles.bioBox} rows={4} />

            <div ref={uploadRef} style={highlight === "upload" ? tonePanelStyles.highlightWrap : null} className={highlight === "upload" ? "lr-settings-highlight" : ""}>
              <div className="mono" style={{ ...tonePanelStyles.fieldLabel, color: highlight === "upload" ? "#e6cd8d" : tonePanelStyles.fieldLabel.color }}>
                fine-tune from your reddit data{highlight === "upload" && <span style={tonePanelStyles.highlightTag}>← start here</span>}
              </div>
              <RedditUpload upload={upload} onPick={onPick} onDrop={onDrop} fileRef={fileRef} onClear={() => setUpload(null)} highlighted={highlight === "upload"} />
            </div>
          </div>
        </div>

        <footer style={tonePanelStyles.foot} className="lr-settings-foot">
          <span className="mono" style={tonePanelStyles.footMeta}>{site.name}</span>
          <button style={tonePanelStyles.save} className="lr-settings-save" onClick={onClose}>save →</button>
        </footer>
      </div>
    </div>);

}

function RedditUpload({ upload, onPick, onDrop, fileRef, onClear, highlighted }) {
  const [drag, setDrag] = useStateT(false);
  return (
    <div style={uploadStyles.wrap}>
      <label
        onDragOver={(e) => {e.preventDefault();setDrag(true);}}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {setDrag(false);onDrop(e);}}
        style={{
          ...uploadStyles.dropzone,
          borderColor: drag ? "#d6a637" : upload?.stage === "ready" ? "#3f9c6a" : highlighted ? "#d6a637" : "#1a1a1a",
          background: drag ? "#0a0907" : highlighted && !upload ? "rgba(214,166,55,0.05)" : "transparent",
          boxShadow: highlighted && !upload ? "0 0 0 1px rgba(214,166,55,0.18), 0 0 24px rgba(214,166,55,0.12)" : "none"
        }}>
        
        <input ref={fileRef} type="file" accept=".zip,application/zip" onChange={onPick} style={{ display: "none" }} />
        {!upload &&
        <>
            <div style={uploadStyles.icon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.4">
                <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
                <path d="M4 18v2h16v-2" />
              </svg>
            </div>
            <div style={uploadStyles.main}>upload your reddit data export</div>
            <div style={uploadStyles.sub}>drop a <span className="mono">.zip</span> or click to browse · from <span className="mono">reddit.com/settings/data-request</span></div>
          </>
        }
        {upload && upload.stage === "processing" &&
        <div style={uploadStyles.row}>
            <Spinner />
            <div style={uploadStyles.fileMeta}>
              <div style={uploadStyles.fileName}>{upload.name}</div>
              <div className="mono" style={uploadStyles.fileSub}>processing locally…</div>
            </div>
          </div>
        }
        {upload && upload.stage === "ready" &&
        <div style={uploadStyles.row}>
            <span style={uploadStyles.checkOk}>✓</span>
            <div style={uploadStyles.fileMeta}>
              <div style={uploadStyles.fileName}>{upload.name}</div>
              <div className="mono" style={uploadStyles.fileSub}>
                {Math.max(1, Math.round((upload.size || 0) / 1024)).toLocaleString()} kB · voice model updated
              </div>
            </div>
            <button onClick={(e) => {e.preventDefault();onClear();}} style={uploadStyles.clear} className="mono">remove</button>
          </div>
        }
      </label>

      <div style={uploadStyles.gdpr} className="mono lr-upload-gdpr">
        <span style={uploadStyles.gdprBadge}>Compliance standard</span>
        <span style={uploadStyles.gdprText}>processed on-device · never uploaded · art. 6(1)(a) consent · deletable any time</span>
      </div>
    </div>);

}

function Slider({ label, value, onChange, max = 100 }) {
  return (
    <label style={sliderStyles.row}>
      <div style={sliderStyles.top}>
        <span style={sliderStyles.label}>{label}</span>
        <span className="mono" style={sliderStyles.value}>{value}</span>
      </div>
      <input type="range" min={0} max={max} value={value}
      onChange={(e) => onChange(Number(e.target.value))} style={sliderStyles.input} />
    </label>);

}

function previewSample(tone) {
  const open = tone.voice === "Founder" ? "we ran into the same wall a year ago." :
  tone.voice === "Analyst" ? "the data here is clearer than most realise:" :
  tone.voice === "Casual" ? "okay this is so real —" :
  "a few things worth flagging.";
  const mid = tone.formality > 60 ? " one could argue " : " the part nobody mentions is ";
  const body = tone.technicality > 60 ? "signal-to-noise compounds super-linearly past a 12-week window." :
  "compounding shows up in months four through six, not month one.";
  const close = tone.enthusiasm > 60 ? " worth digging into." : " happy to share what we tracked.";
  return open + mid + body + close;
}

// ────── Blurry inline ──────

function Blurry({ blur, children }) {
  return <span style={{
    display: "inline-block",
    filter: `blur(${blur}px)`,
    transition: "filter 600ms cubic-bezier(.2,.7,.2,1)"
  }}>{children}</span>;
}

// ════════════════════════ Styles ════════════════════════

const termStyles = {
  root: { position: "absolute", inset: 0, background: "#000", color: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" },

  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #0e0e0e" },
  topbarLeft: { display: "flex", alignItems: "center", gap: 14 },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" },
  sep: { width: 1, height: 16, background: "#1a1a1a" },

  hostBtn: { background: "transparent", border: "none", padding: "6px 0", display: "inline-flex", alignItems: "center", gap: 10, color: "#fff", cursor: "pointer" },
  hostName: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" },
  hostStatus: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#888", letterSpacing: "0.14em", marginLeft: 4 },
  caret: { fontSize: 10, color: "#666" },

  menuBackdrop: { position: "fixed", inset: 0, zIndex: 9 },
  hostMenu: { position: "absolute", top: "calc(100% + 8px)", left: 0, width: 260, background: "#050505", border: "1px solid #1a1a1a", zIndex: 10 },
  hostMenuHead: { padding: "10px 14px", fontSize: 10, color: "#555", letterSpacing: "0.2em", borderBottom: "1px solid #111" },
  hostMenuItem: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "none", borderBottom: "1px solid #0d0d0d", color: "#fff", textAlign: "left", cursor: "pointer" },
  hostMenuName: { fontSize: 13 },
  hostMenuCheck: { fontSize: 11, color: "#666" },
  hostMenuAdd: { width: "100%", padding: "12px 14px", background: "transparent", border: "none", color: "#666", fontSize: 12, textAlign: "left", cursor: "pointer" },

  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  creditsBtn: { display: "inline-flex", alignItems: "baseline", gap: 6, padding: "7px 12px", border: "1px solid #1a1a1a", background: "transparent", color: "#fff", cursor: "pointer", transition: "all .15s" },
  creditsNum: { fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" },
  creditsLabel: { fontSize: 10, color: "#666", letterSpacing: "0.16em" },
  avatar: { width: 28, height: 28, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#aaa" },

  communityBar: { display: "flex", alignItems: "center", gap: 18, padding: "10px 24px", borderBottom: "1px solid #0e0e0e", background: "#040404" },
  communityBarLabel: { fontSize: 10, color: "#444", letterSpacing: "0.22em", whiteSpace: "nowrap" },
  communityPills: { display: "flex", gap: 6, flexWrap: "wrap" },
  communityPill: { display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 12px", border: "1px solid", background: "transparent", cursor: "pointer", transition: "all .15s" },
  communityPillName: { fontSize: 12, fontWeight: 500 },
  communityPillMeta: { fontSize: 10, color: "inherit", opacity: 0.55, letterSpacing: "0.06em" },
  communityMeta: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#555", letterSpacing: "0.14em" },
  communityMetaDot: { color: "#222" },

  tabbar: { display: "flex", borderBottom: "1px solid #0e0e0e" },
  tab: { position: "relative", display: "inline-flex", gap: 12, alignItems: "baseline", padding: "14px 22px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background .15s, color .15s" },
  tabIdx: { fontSize: 10, opacity: .5, letterSpacing: "0.2em" },
  tabName: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" },
  tabStatusDot: { display: "inline-flex", alignItems: "center" },
  tabPulse: { width: 6, height: 6, borderRadius: "50%", background: "#f0c054", boxShadow: "0 0 8px rgba(240,192,84,.55)", animation: "lrPulse 1.4s infinite" },
  tabbarFiller: { flex: 1, borderBottom: "1px solid #0e0e0e", marginLeft: "-1px" },

  body: { flex: 1, position: "relative", overflow: "hidden" },

  footbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", borderTop: "1px solid #0e0e0e", gap:14 },
  tonePill: { background: "transparent", border: "1px solid #1a1a1a", color: "#bbb", padding: "7px 12px", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer" },
  toneVal: { color: "#fff" },
  footRightWrap: { display:"flex", alignItems:"center", gap:18, marginLeft:"auto" },
  footRight: { fontSize: 10, color: "#555", letterSpacing: "0.16em" },
  createOwn: { background:"#3f9c6a", color:"#000", border:"none", padding:"9px 16px", fontSize:12, fontWeight:600, letterSpacing:"0.01em", cursor:"pointer", boxShadow:"0 0 0 1px rgba(92,209,151,.25), 0 0 18px rgba(63,156,106,.25)", transition:"all .15s", display:"inline-flex", alignItems:"center" }
};

const colStyles = {
  col: { display: "flex", flexDirection: "column", padding: "24px 24px", height: "100%", overflow: "hidden" },
  eyebrow: { fontSize: 10, color: "#555", letterSpacing: "0.22em", whiteSpace: "nowrap" },
  eyebrowRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 12 },
  eyebrowMeta: { fontSize: 10, color: "#333", letterSpacing: "0.16em", whiteSpace: "nowrap" }
};

const chartStyles = {
  list: { flex: 1, display: "flex", flexDirection: "column", gap: 0, overflow: "auto" },
  row: { display: "grid", gridTemplateColumns: "24px 1fr 100px 36px", gap: 14, alignItems: "center", padding: "8px 8px", borderBottom: "1px solid #0d0d0d", transition: "background .15s", cursor: "default" },
  rank: { fontSize: 10, letterSpacing: "0.16em" },
  term: { fontSize: 13, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  track: { width: "100%", height: 2, background: "#111", overflow: "hidden" },
  fill: { height: "100%", transition: "width .4s ease" },
  val: { fontSize: 11, textAlign: "right", fontVariantNumeric: "tabular-nums" }
};

const modalStyles = {
  backdrop: { position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 },
  dialog: { width: "min(560px, 100%)", background: "#040404", border: "1px solid #1a1a1a", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #111" },
  title: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" },
  close: { background: "transparent", border: "none", color: "#666", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" },

  body: { padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 },
  postMeta: { fontSize: 10, color: "#666", letterSpacing: "0.14em" },
  postTitle: { fontSize: 17, fontWeight: 600, lineHeight: 1.35 },

  input: { background: "transparent", color: "#fff", border: "none", borderBottom: "1px solid #1a1a1a", padding: "10px 0", fontSize: 15, fontWeight: 600, fontFamily: "inherit", outline: "none" },
  textarea: { background: "#070707", color: "#fff", border: "1px solid #1a1a1a", padding: "12px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.55 },

  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #111" },
  footerMeta: { fontSize: 10, color: "#555", letterSpacing: "0.16em" },
  ship: { background: "#fff", color: "#000", border: "none", padding: "10px 18px", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }
};

const tonePanelStyles = {
  backdrop: { position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", zIndex: 25, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { width: "100%", maxWidth: 1100, background: "#040404", border: "1px solid #1a1a1a", borderBottom: "none", display: "flex", flexDirection: "column", maxHeight: "75vh" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid #111" },
  title: { fontSize: 18, fontWeight: 600 },
  close: { background: "transparent", border: "none", color: "#666", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" },

  body: { display: "grid", gridTemplateColumns: "1fr", flex: 1, overflow: "auto" },
  col: { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, borderRight: "none" },

  fieldLabel: { fontSize: 10, color: "#555", letterSpacing: "0.2em" },
  highlightWrap: { display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", margin: "4px -8px", border: "1px dashed #564524", background: "rgba(214,166,55,0.04)", animation: "lrPulseSoft 1.8s ease-in-out infinite" },
  highlightTag: { marginLeft: 10, fontSize: 9, color: "#e6cd8d", letterSpacing: "0.18em", textTransform: "none" },
  voiceRow: { display: "flex", border: "1px solid #1a1a1a" },
  voiceBtn: { flex: 1, padding: "10px 8px", background: "transparent", border: "none", borderRight: "1px solid #1a1a1a", color: "#aaa", fontSize: 12, cursor: "pointer" },

  bioBox: { background: "#070707", color: "#eee", border: "1px solid #1a1a1a", padding: "12px 14px", fontSize: 13, lineHeight: 1.55, resize: "vertical", outline: "none", fontFamily: "inherit" },
  preview: { border: "1px solid #1a1a1a", padding: "14px 16px", background: "#070707", fontSize: 13, color: "#bbb", lineHeight: 1.6, fontStyle: "italic" },

  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #111" },
  footMeta: { fontSize: 10, color: "#555", letterSpacing: "0.16em" },
  save: { background: "#fff", color: "#000", border: "none", padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }
};

const sliderStyles = {
  row: { display: "flex", flexDirection: "column", gap: 6, marginTop: 6 },
  top: { display: "flex", justifyContent: "space-between" },
  label: { fontSize: 13, color: "#ddd" },
  value: { fontSize: 11, color: "#666" },
  input: { WebkitAppearance: "none", appearance: "none", width: "100%", height: 2, background: "#1a1a1a", outline: "none" }
};

const uploadStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: 8 },
  dropzone: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", padding: "16px 16px", border: "1px dashed #1a1a1a", cursor: "pointer", transition: "border-color .2s, background .2s", minHeight: 78, justifyContent: "center" },
  icon: { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "1px solid #1a1a1a" },
  main: { fontSize: 14, color: "#eee", letterSpacing: "-0.005em" },
  sub: { fontSize: 11, color: "#666", lineHeight: 1.5 },
  row: { display: "flex", alignItems: "center", gap: 14, width: "100%" },
  fileMeta: { display: "flex", flexDirection: "column", gap: 3, flex: 1, overflow: "hidden" },
  fileName: { fontSize: 13, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  fileSub: { fontSize: 10, color: "#888", letterSpacing: "0.12em" },
  checkOk: { width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#3f9c6a", color: "#000", fontSize: 11, borderRadius: "50%" },
  clear: { background: "transparent", border: "1px solid #1a1a1a", color: "#888", padding: "5px 10px", fontSize: 10, letterSpacing: "0.16em", cursor: "pointer" },

  gdpr: { display: "flex", alignItems: "center", gap: 10, fontSize: 10, color: "#666", letterSpacing: "0.12em" },
  gdprBadge: { padding: "3px 8px", border: "1px solid #2a3f2e", color: "#7fb892", background: "#0a120c", letterSpacing: "0.18em" },
  gdprText: { color: "#555" }
};

Object.assign(window, { Terminal });