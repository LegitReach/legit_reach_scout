"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// New seed landing: Signal -> Wisdom pipeline (Dune-inspired theme).
// Link connections into the existing app:
//   Explore Tools  -> /tools    (the full existing main experience, preserved)
//   Know More      -> /building
//   Pitch Deck     -> /invest

const STREAM_WORD = "legitreach";
const STREAM_REPS = 40;

export default function Home() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canHover = useRef(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // (pointer: fine) excludes touch screens and hybrid tablets that report hover: hover
    canHover.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      // Don't close if the click originated inside the nav
      if (navRef.current?.contains(e.target as Node)) return;
      setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleEnter = (menu: string) => {
    if (!canHover.current) return;
    clearClose();
    setOpenMenu(menu);
  };

  const handleLeave = () => {
    if (!canHover.current) return;
    clearClose();
    // give the user time to travel into the menu before it closes
    closeTimer.current = setTimeout(() => setOpenMenu(null), 380);
  };

  const handleTrigger = (e: React.MouseEvent, menu: string) => {
    e.stopPropagation();
    clearClose();
    setOpenMenu((cur) => (cur === menu ? null : menu));
  };

  // Two identical halves so translate(-50%) loops seamlessly.
  const streamSpans = Array.from({ length: STREAM_REPS * 2 }, (_, i) => (
    <span key={i}>{STREAM_WORD}</span>
  ));

  return (
    <div className="lr-seed">
      <style>{SEED_CSS}</style>

      {/* ===== Top bar ===== */}
      <header className="topbar">
        <div className="wrap">
          <Link className="logo" href="/" aria-label="LegitReach home">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <mask id="lr-cut">
                  <rect width="1024" height="1024" fill="white" />
                  <line x1="-50" y1="420" x2="1074" y2="820" stroke="black" strokeWidth="58" />
                </mask>
              </defs>
              <polygon points="512,176 120,848 904,848" fill="currentColor" mask="url(#lr-cut)" />
            </svg>
            <span className="word"><b>LegitReach</b></span>
          </Link>

          <nav className="nav" ref={navRef}>
            <div
              className={`nav-item${openMenu === "products" ? " open" : ""}`}
              onMouseEnter={() => handleEnter("products")}
              onMouseLeave={handleLeave}
            >
              <button className="nav-trigger" type="button" onClick={(e) => handleTrigger(e, "products")}>
                Products
                <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                <Link className="drop-link" href="/tools">
                  <span className="dl-main"><span className="dl-title">Tools</span><span className="dl-sub">Signal intelligence, deployed</span></span>
                  <span className="tag live">Live</span>
                </Link>
                <span className="drop-link disabled" aria-disabled="true">
                  <span className="dl-main"><span className="dl-title">Models</span><span className="dl-sub">World model for Communal Intelligence</span></span>
                  <span className="tag soon">Soon</span>
                </span>
                <span className="drop-link disabled" aria-disabled="true">
                  <span className="dl-main"><span className="dl-title">Chips</span><span className="dl-sub">Photonics for interposing intent</span></span>
                  <span className="tag soon">Soon</span>
                </span>
              </div>
            </div>

            <div
              className={`nav-item${openMenu === "invest" ? " open" : ""}`}
              onMouseEnter={() => handleEnter("invest")}
              onMouseLeave={handleLeave}
            >
              <button className="nav-trigger" type="button" onClick={(e) => handleTrigger(e, "invest")}>
                Invest
                <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                <Link className="drop-link" href="/invest">
                  <span className="dl-main"><span className="dl-title">Pitch Deck</span><span className="dl-sub">The thesis, in full</span></span>
                  <span className="tag live">View</span>
                </Link>
                <span className="drop-link disabled" aria-disabled="true">
                  <span className="dl-main"><span className="dl-title">Monthly Updates</span><span className="dl-sub">What changed, every month</span></span>
                  <span className="tag soon">Soon</span>
                </span>
              </div>
            </div>
          </nav>


        </div>
      </header>

      {/* ===== Hero ===== */}
      <main className="wrap">
        <section className="hero">
          <p className="eyebrow"><span className="dot" />The signal pipeline</p>

          <div className="pipeline">
            <span className="term signal">Signal</span>
            <div className="channel" aria-hidden="true">
              <div className="stream">{streamSpans}</div>
            </div>
            <span className="term wisdom">Wisdom</span>
          </div>

          <p className="subline">LegitReach converts raw internet <b>signals</b> into <b>agentic-actions</b>. One quiet, continuous &amp; durable pipeline to your audience.</p>

          <div className="cta">
            <Link className="btn btn-solid btn-lg" href="/tools">Explore Tools</Link>
            <Link className="btn btn-ghost btn-lg" href="/building">Know More</Link>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="footer">
        <div className="wrap">
          <span className="muted">LegitReach: Frictionless creation &amp; capture of intent</span>
          <div className="links">
            <Link href="/tools">Tools</Link>
            <Link href="/invest">Pitch Deck</Link>
            <Link href="/">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const SEED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

.lr-seed {
  --ink:        #0F0F15;
  --ink-soft:   #16161e;
  --ink-line:   #26262f;
  --paper:      #FFFFFF;
  --text:       #FFFFFF;
  --text-dim:   #9a9aa3;
  --text-faint: #5a5a63;
  --orange:     #109C6B;
  --yellow:     #F9DC5C;
  --blue:       #446BCE;
  --green:      #109C6B;
  --radius:     10px;
  --maxw:       1180px;
  --ease:       cubic-bezier(0.22, 1, 0.36, 1);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--ink);
  color: var(--text);
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.lr-seed *, .lr-seed *::before, .lr-seed *::after { box-sizing: border-box; }
.lr-seed a { color: inherit; text-decoration: none; }
.lr-seed ::selection { background: var(--orange); color: var(--ink); }

.lr-seed .wrap {
  width: 100%;
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 32px;
}

.lr-seed .topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--ink) 78%, transparent);
  backdrop-filter: saturate(140%) blur(14px);
  -webkit-backdrop-filter: saturate(140%) blur(14px);
  border-bottom: 1px solid var(--ink-line);
}
.lr-seed .topbar .wrap {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lr-seed .logo { display: flex; align-items: center; gap: 11px; color: var(--text); }
.lr-seed .logo svg { display: block; width: 22px; height: 22px; }
.lr-seed .logo .word { font-weight: 600; font-size: 16px; letter-spacing: -0.02em; }
.lr-seed .logo .word b { font-weight: 600; }

.lr-seed .nav { display: flex; align-items: center; gap: 4px; }
.lr-seed .nav-item { position: relative; }
.lr-seed .nav-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dim);
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: color .18s var(--ease), background .18s var(--ease);
}
.lr-seed .nav-trigger:hover { color: var(--text); background: var(--ink-soft); }
.lr-seed .nav-trigger svg { width: 11px; height: 11px; opacity: .7; transition: transform .2s var(--ease); }
.lr-seed .nav-item.open .nav-trigger { color: var(--text); background: var(--ink-soft); }
.lr-seed .nav-item.open .nav-trigger svg { transform: rotate(180deg); }

.lr-seed .dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 230px;
  background: var(--ink-soft);
  border: 1px solid var(--ink-line);
  border-radius: 12px;
  padding: 6px;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity .2s var(--ease), transform .2s var(--ease);
  box-shadow: 0 18px 50px rgba(0,0,0,.55);
}
.lr-seed .nav-item.open .dropdown { opacity: 1; transform: translateY(0); pointer-events: auto; }
.lr-seed .dropdown::before { content: ""; position: absolute; top: -12px; left: 0; right: 0; height: 12px; }
.lr-seed .nav-item:last-of-type .dropdown { left: auto; right: 0; }

.lr-seed .drop-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 12px;
  border-radius: 8px;
  transition: background .15s var(--ease);
}
.lr-seed .drop-link:hover { background: var(--ink-line); }
.lr-seed .drop-link .dl-main { display: flex; flex-direction: column; gap: 2px; }
.lr-seed .drop-link .dl-title { font-size: 14px; font-weight: 500; color: var(--text); }
.lr-seed .drop-link .dl-sub { font-size: 12px; color: var(--text-faint); }
.lr-seed .drop-link.disabled { cursor: default; }
.lr-seed .drop-link.disabled:hover { background: transparent; }
.lr-seed .drop-link.disabled .dl-title { color: var(--text-faint); }

.lr-seed .tag {
  font-family: 'Geist Mono', monospace;
  font-size: 10px;
  letter-spacing: .04em;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 5px;
  white-space: nowrap;
}
.lr-seed .tag.soon { color: var(--yellow); border: 1px solid color-mix(in srgb, var(--yellow) 40%, transparent); }
.lr-seed .tag.live { color: var(--green); border: 1px solid color-mix(in srgb, var(--green) 40%, transparent); }

.lr-seed .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform .15s var(--ease), background .18s var(--ease), border-color .18s var(--ease), color .18s var(--ease);
  white-space: nowrap;
}
.lr-seed .btn:active { transform: translateY(1px); }
.lr-seed .btn-ghost { color: var(--text); border-color: var(--ink-line); background: transparent; }
.lr-seed .btn-ghost:hover { background: var(--ink-soft); border-color: #3a3a45; }
.lr-seed .btn-solid { background: var(--orange); color: var(--ink); font-weight: 600; }
.lr-seed .btn-solid:hover { background: #15b884; }
.lr-seed .btn-lg { height: 48px; padding: 0 26px; font-size: 15px; }

.lr-seed .footer { border-top: 1px solid var(--ink-line); margin-top: 120px; }
.lr-seed .footer .wrap { height: 78px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.lr-seed .footer .muted { color: var(--text-faint); font-size: 13px; }
.lr-seed .footer .links { display: flex; gap: 22px; }
.lr-seed .footer .links a { color: var(--text-dim); font-size: 13px; transition: color .15s var(--ease); }
.lr-seed .footer .links a:hover { color: var(--text); }

/* ---- Hero ---- */
.lr-seed .hero {
  flex: 1;
  min-height: calc(100vh - 68px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 0 90px;
}
.lr-seed .eyebrow {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 54px;
  opacity: 0;
  animation: lrsRise .9s var(--ease) .05s forwards;
}
.lr-seed .eyebrow .dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--orange);
  margin-right: 9px;
  vertical-align: middle;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--orange) 70%, transparent);
  animation: lrsPulse 2.6s ease-out infinite;
}

.lr-seed .pipeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(18px, 4vw, 46px);
  width: 100%;
  max-width: 1000px;
}
.lr-seed .term {
  font-size: clamp(46px, 9vw, 112px);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: .95;
  white-space: nowrap;
  opacity: 0;
}
.lr-seed .term.signal { color: var(--text); animation: lrsRise 1s var(--ease) .15s forwards; }
.lr-seed .term.wisdom { color: var(--text); animation: lrsRise 1s var(--ease) .45s forwards; position: relative; }
.lr-seed .term.wisdom::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -14px;
  height: 3px;
  background: var(--orange);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: left;
  animation: lrsGrow 1.1s var(--ease) 1.1s forwards;
}

.lr-seed .channel {
  position: relative;
  flex: 1 1 auto;
  min-width: 120px;
  max-width: 460px;
  height: 46px;
  overflow: hidden;
  opacity: 0;
  animation: lrsFade 1.2s var(--ease) .7s forwards;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%);
}
.lr-seed .stream {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  display: flex;
  white-space: nowrap;
  will-change: transform;
  animation: lrsFlow 18s linear infinite;
}
.lr-seed .stream span {
  font-family: 'Geist Mono', monospace;
  font-size: 15px;
  letter-spacing: .02em;
  color: var(--text-faint);
  padding-right: 4px;
}
.lr-seed .stream span:nth-child(3n+1) { color: var(--text-dim); }
.lr-seed .stream span:nth-child(7n+2) { color: var(--orange); }

.lr-seed .channel::before {
  content: "";
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 1px;
  background: var(--ink-line);
  transform: translateY(11px);
}

.lr-seed .cta {
  display: flex;
  gap: 14px;
  margin-top: 66px;
  opacity: 0;
  animation: lrsRise 1s var(--ease) 1s forwards;
}
.lr-seed .subline {
  margin-top: 30px;
  color: var(--text-dim);
  font-size: 15px;
  max-width: 460px;
  line-height: 1.6;
  opacity: 0;
  animation: lrsRise 1s var(--ease) 1.25s forwards;
}
.lr-seed .subline b { color: var(--text); font-weight: 500; }

@keyframes lrsFlow { from { transform: translate(-50%, -50%); } to { transform: translate(0, -50%); } }
@keyframes lrsRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lrsFade { to { opacity: 1; } }
@keyframes lrsGrow { to { transform: scaleX(1); } }
@keyframes lrsPulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--orange) 65%, transparent); }
  70%  { box-shadow: 0 0 0 9px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .lr-seed .eyebrow, .lr-seed .term, .lr-seed .channel, .lr-seed .cta, .lr-seed .subline, .lr-seed .term.wisdom::after { opacity: 1 !important; transform: none !important; animation: none !important; }
  .lr-seed .term.wisdom::after { transform: scaleX(1) !important; }
  .lr-seed .stream { animation: none; }
}

@media (max-width: 720px) {
  .lr-seed .wrap { padding: 0 18px; }
  .lr-seed .footer .wrap { flex-direction: column; height: auto; padding-top: 24px; padding-bottom: 24px; align-items: flex-start; gap: 16px; }
}

@media (max-width: 640px) {
  .lr-seed .hero { min-height: calc(100vh - 58px); padding: 32px 0 64px; }
  .lr-seed .eyebrow { margin-bottom: 38px; font-size: 11px; letter-spacing: .14em; }
  .lr-seed .pipeline { flex-direction: column; gap: 14px; }
  .lr-seed .term { font-size: clamp(52px, 17vw, 84px); }
  .lr-seed .channel { width: 100%; max-width: 280px; height: 58px; flex: none;
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
            mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%); }
  .lr-seed .stream { flex-direction: column; left: 50%; top: 0; transform: translateX(-50%); white-space: normal; text-align: center; animation: lrsFlowV 13s linear infinite; }
  .lr-seed .stream span { padding: 1.5px 0; font-size: 14px; }
  .lr-seed .channel::before { display: none; }
  @keyframes lrsFlowV { from { transform: translate(-50%, -50%); } to { transform: translate(-50%, 0); } }
  .lr-seed .term.wisdom::after { left: 50%; right: auto; transform: translateX(-50%) scaleX(0); width: 44px; bottom: -10px; transform-origin: center; }
  .lr-seed .subline { margin-top: 26px; font-size: 15px; padding: 0 4px; }
  .lr-seed .cta { margin-top: 44px; flex-direction: column; width: 100%; max-width: 320px; gap: 11px; }
  .lr-seed .cta .btn { width: 100%; }
}
@media (max-width: 640px) and (prefers-reduced-motion: no-preference) {
  .lr-seed .term.wisdom::after { animation: lrsGrowC 1.1s var(--ease) 1.1s forwards; }
  @keyframes lrsGrowC { to { transform: translateX(-50%) scaleX(1); } }
}

@media (max-width: 560px) {
  .lr-seed .wrap { padding: 0 16px; }
  .lr-seed .topbar .wrap { height: 58px; }
  .lr-seed .logo svg { width: 19px; height: 19px; }
  .lr-seed .logo .word { font-size: 15px; }
  .lr-seed .logo { gap: 9px; }
  .lr-seed .nav { gap: 0; }
  .lr-seed .nav-trigger { height: 34px; padding: 0 9px; font-size: 13px; gap: 4px; }
  .lr-seed .nav-trigger svg { width: 10px; height: 10px; }
  .lr-seed .btn { height: 34px; padding: 0 13px; font-size: 13px; }
  .lr-seed .btn-lg { height: 46px; padding: 0 22px; font-size: 15px; }
  .lr-seed .dropdown { position: fixed; top: 58px; left: 8px; right: 8px; min-width: 0; border-radius: 14px; padding: 7px; }
  .lr-seed .nav-item:last-of-type .dropdown { left: 8px; right: 8px; }
  .lr-seed .drop-link { padding: 13px 12px; }
  .lr-seed .drop-link .dl-title { font-size: 15px; }
  .lr-seed .footer { margin-top: 72px; }
  .lr-seed .footer .links { gap: 18px; flex-wrap: wrap; }
}

@media (max-width: 380px) {
  .lr-seed .nav-trigger { padding: 0 7px; font-size: 12px; }
  .lr-seed .btn-ghost { padding: 0 11px; }
  .lr-seed .logo .word { font-size: 14px; }
}
`;
