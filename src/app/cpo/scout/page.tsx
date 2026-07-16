"use client";

import { useEffect, useRef } from "react";

// Photon Landing — handed off from Claude Design.
// Act I: hello human -> breathe -> welcome
// Act II: you are a photon; steer it to discover the links.
// App connections:
//   Tools  node -> /tools   (the community-manager landing page, as it exists)
//   Vision node -> /invest  (the pitch deck / invest page)
//   Models popup cards -> subtle "coming soon" toast (no nav)

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (s: string) => document.querySelector(s) as HTMLElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ============ ACT I — intro state machine ============ */
    const intro = $("#intro");
    const phases = [$("#ph1"), $("#ph2"), $("#ph3")];
    const bcue = $("#bcue");
    let timers: ReturnType<typeof setTimeout>[] = [];
    let step = -1;
    let introDone = false;

    function after(ms: number, fn: () => void) {
      timers.push(setTimeout(fn, ms));
    }
    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function setCue(text: string) {
      bcue.classList.add("swap");
      after(420, function () {
        bcue.textContent = text;
        bcue.classList.remove("swap");
      });
    }

    function goPhase(n: number) {
      if (introDone) return;
      clearTimers();
      if (step >= 0 && phases[step]) {
        phases[step].classList.remove("on");
        phases[step].classList.add("out");
      }
      step = n;
      if (n >= phases.length) {
        endIntro();
        return;
      }
      const ph = phases[n];
      after(step === 0 ? 0 : 350, function () {
        ph.classList.add("on");
      });

      if (n === 0) {
        /* Hello, human. — quick to arrive, slow to smudge away */
        after(reduced ? 1800 : 2900, function () {
          goPhase(1);
        });
      } else if (n === 1) {
        if (reduced) {
          after(1600, function () {
            goPhase(2);
          });
          return;
        }
        /* one full breath: in → hold → out, cues synced to the 9s keyframes */
        const IN = 3420,
          HOLD = 2160,
          OUT = 3420;
        after(350, function () {
          setCue("breathe in");
        });
        after(350 + IN, function () {
          setCue("hold");
        });
        after(350 + IN + HOLD, function () {
          setCue("breathe out");
        });
        after(350 + IN + HOLD + OUT + 350, function () {
          goPhase(2);
        });
      } else if (n === 2) {
        after(reduced ? 1800 : 2900, function () {
          goPhase(3);
        });
      }
    }

    function endIntro() {
      if (introDone) return;
      introDone = true;
      try { localStorage.setItem("lr-intro-seen", "1"); } catch (_) {}
      clearTimers();
      intro.classList.add("gone");
      field.classList.add("on");
      after(2300, function () {
        intro.remove();
      });
      startField();
    }

    intro.addEventListener("pointerdown", function () {
      goPhase(step + 1);
    });
    after(2400, function () {
      intro.classList.add("show-skip");
    });

    /* ============ ACT II — the photon field ============ */
    const field = $("#field");
    const world = $("#world");
    const card = $("#card");
    const cardTitle = card.querySelector(".c-title") as HTMLElement;
    const cardSub = card.querySelector(".c-sub") as HTMLElement;
    const cardBtn = card.querySelector(".c-btn") as HTMLAnchorElement;
    const hint = $("#hint");
    const hinttext = $("#hinttext");

    type Node = {
      x: number;
      y: number;
      title: string;
      bare?: boolean;
      sub?: string;
      href?: string;
      cta?: string;
      action?: string;
      el?: HTMLElement;
    };

    const NODES: Node[] = [
      { x: 0, y: -2, title: "Tools", bare: true, href: "/cpo/tools", cta: "Explore Tools" },
      { x: 2, y: 0, title: "Vision", sub: "Becoming one with the photon.", href: "/cpo/invest", cta: "Open the Pitch Deck" },
      { x: -2, y: 0, title: "Models", action: "models", cta: "Explore" },
    ];
    const BOUND = 3; /* photon can roam ±3 cells */
    const WORLD_CELLS = 9; /* rendered grid extent */

    /* clear any nodes/ghosts from a prior (strict-mode) run before rebuilding */
    world.querySelectorAll(".node, .ghost").forEach((n) => n.remove());

    let CELL = 100;
    function computeCell() {
      const m = Math.min(window.innerWidth, window.innerHeight);
      CELL = Math.max(58, Math.min(150, Math.floor(m / 5.4)));
      const size = WORLD_CELLS * CELL;
      world.style.width = size + "px";
      world.style.height = size + "px";
      world.style.margin = -size / 2 + "px 0 0 " + -size / 2 + "px";
      world.style.backgroundSize = CELL + "px " + CELL + "px";
      NODES.forEach(function (n) {
        if (n.el) n.el.style.transform = "translate3d(" + n.x * CELL + "px," + n.y * CELL + "px,0)";
      });
    }

    /* build nodes */
    NODES.forEach(function (n) {
      const el = document.createElement("div");
      el.className = "node";
      el.innerHTML = '<div class="ring"></div><div class="lbl">' + n.title + "</div>";
      el.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        target.x = n.x;
        target.y = n.y;
        wake();
        dismissHint();
      });
      world.appendChild(el);
      n.el = el;
    });
    computeCell();
    window.addEventListener("resize", computeCell);

    /* photon position in cell coords */
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf: number | null = null;
    let last = 0;
    let activeNode: Node | null = null;
    let fieldLive = false;

    function nodeAt(x: number, y: number) {
      for (let i = 0; i < NODES.length; i++) {
        if (NODES[i].x === x && NODES[i].y === y) return NODES[i];
      }
      return null;
    }

    function showCard(n: Node) {
      card.classList.toggle("bare", !!n.bare);
      if (n.bare) {
        cardTitle.hidden = true;
      } else {
        cardTitle.hidden = false;
        cardTitle.textContent = n.title;
      }
      if (n.sub) {
        cardSub.hidden = false;
        cardSub.textContent = n.sub;
      } else {
        cardSub.hidden = true;
      }
      if (n.cta) {
        cardBtn.hidden = false;
        cardBtn.textContent = n.cta;
        if (n.action) {
          cardBtn.setAttribute("href", "#");
          cardBtn.dataset.action = n.action;
        } else {
          cardBtn.setAttribute("href", n.href || "#");
          delete cardBtn.dataset.action;
        }
      } else {
        cardBtn.hidden = true;
      }
      card.classList.add("on");
    }
    function hideCard() {
      card.classList.remove("on");
    }

    function settle() {
      const n = nodeAt(target.x, target.y);
      if (n) {
        if (activeNode !== n) {
          activeNode = n;
          n.el!.classList.add("active", "visited");
          showCard(n);
        }
      }
    }
    function unsettle() {
      if (activeNode) {
        activeNode.el!.classList.remove("active");
        activeNode = null;
      }
      hideCard();
    }

    function spawnGhost(cx: number, cy: number) {
      if (reduced) return;
      const g = document.createElement("div");
      g.className = "ghost";
      g.style.transform = "translate3d(" + cx * CELL + "px," + cy * CELL + "px,0)";
      world.appendChild(g);
      setTimeout(function () {
        g.remove();
      }, 1100);
    }

    /* frame-rate independent smoothing: identical feel at 60Hz and 120Hz */
    const SMOOTH = reduced ? 30 : 7.5;
    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt * SMOOTH);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;

      world.style.transform = "translate3d(" + -pos.x * CELL + "px," + -pos.y * CELL + "px,0)";

      const dx = Math.abs(target.x - pos.x),
        dy = Math.abs(target.y - pos.y);
      if (dx + dy < 0.004) {
        pos.x = target.x;
        pos.y = target.y;
        world.style.transform = "translate3d(" + -pos.x * CELL + "px," + -pos.y * CELL + "px,0)";
        settle();
        raf = null;
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    function wake() {
      unsettle();
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    function move(dx: number, dy: number) {
      const nx = Math.max(-BOUND, Math.min(BOUND, target.x + dx));
      const ny = Math.max(-BOUND, Math.min(BOUND, target.y + dy));
      if (nx === target.x && ny === target.y) {
        edgeFlash(dx, dy);
        dismissHint();
        return;
      }
      spawnGhost(target.x, target.y);
      target.x = nx;
      target.y = ny;
      wake();
      dismissHint();
    }

    /* out-of-bounds feedback: red wash on the blocked edge + photon flush */
    const photonEl = $("#photon");
    let edgeTimer: ReturnType<typeof setTimeout> | null = null;
    function edgeFlash(dx: number, dy: number) {
      const sel = dx > 0 ? ".edge-r" : dx < 0 ? ".edge-l" : dy > 0 ? ".edge-b" : ".edge-t";
      const el = $(sel);
      if (!el) return;
      el.classList.add("on");
      photonEl.classList.add("bump");
      if (edgeTimer) clearTimeout(edgeTimer);
      edgeTimer = setTimeout(function () {
        document.querySelectorAll(".edge.on").forEach(function (e) {
          e.classList.remove("on");
        });
        photonEl.classList.remove("bump");
      }, 420);
    }

    /* hint + first-landing arrows */
    let hintDismissed = false;
    let dirhint: HTMLElement | null = $("#dirhint");
    function dismissHint() {
      if (hintDismissed) return;
      hintDismissed = true;
      hint.classList.add("gone");
      if (dirhint) {
        dirhint.classList.add("gone");
        setTimeout(function () {
          if (dirhint) {
            dirhint.remove();
            dirhint = null;
          }
        }, 1400);
      }
    }

    function startField() {
      fieldLive = true;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      hinttext.textContent = fine ? "arrow keys to guide the photon" : "swipe to guide the photon";
      /* arrows bloom around the photon, then smudge away on first move */
      setTimeout(function () {
        if (dirhint && !hintDismissed) dirhint.classList.add("on");
      }, 1100);
    }

    /* keyboard */
    function onKeyDown(e: KeyboardEvent) {
      if (!fieldLive) return;
      if (modelsPanel.classList.contains("on")) {
        if (e.key === "Escape") toggleModels(false);
        return;
      }
      if ($("#indexPanel").classList.contains("on") && e.key === "Escape") {
        toggleIndex(false);
        return;
      }
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          move(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          move(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          move(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          move(1, 0);
          break;
        case "Enter":
          if (activeNode && activeNode.action === "models") toggleModels(true);
          else if (activeNode && activeNode.href) window.location.href = activeNode.href;
          break;
        case "Escape":
          target.x = 0;
          target.y = 0;
          wake();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);

    /* swipe — works anywhere on the field */
    let ts: { x: number; y: number; t: number } | null = null;
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) ts = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
    }
    function onTouchEnd(e: TouchEvent) {
      if (!ts) return;
      const dx = e.changedTouches[0].clientX - ts.x;
      const dy = e.changedTouches[0].clientY - ts.y;
      ts = null;
      const adx = Math.abs(dx),
        ady = Math.abs(dy);
      if (Math.max(adx, ady) < 24) return;
      if (adx > ady) move(dx > 0 ? 1 : -1, 0);
      else move(0, dy > 0 ? 1 : -1);
    }
    field.addEventListener("touchstart", onTouchStart, { passive: true });
    field.addEventListener("touchmove", onTouchMove, { passive: false });
    field.addEventListener("touchend", onTouchEnd);

    /* desktop: click empty field nudges photon one cell toward the click */
    function onFieldPointerDown(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      const t = e.target as HTMLElement;
      if (t.closest(".node") || t.closest("#card") || t.closest(".corner")) return;
      const cx = window.innerWidth / 2,
        cy = window.innerHeight / 2;
      const dx = e.clientX - cx,
        dy = e.clientY - cy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < CELL * 0.4) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
      else move(0, dy > 0 ? 1 : -1);
    }
    field.addEventListener("pointerdown", onFieldPointerDown as EventListener);

    /* brand click → photon home */
    function onBrandClick(e: Event) {
      e.preventDefault();
      target.x = 0;
      target.y = 0;
      wake();
    }
    $("#brand").addEventListener("click", onBrandClick);

    /* index overlay */
    const indexPanel = $("#indexPanel");
    function toggleIndex(force?: boolean) {
      const on = typeof force === "boolean" ? force : !indexPanel.classList.contains("on");
      indexPanel.classList.toggle("on", on);
    }
    function onIndexBtn(e: Event) {
      e.stopPropagation();
      toggleIndex();
    }
    $("#indexBtn").addEventListener("click", onIndexBtn);
    function onIndexPanelClick(e: Event) {
      if (e.target === indexPanel || e.target === indexPanel.firstElementChild) toggleIndex(false);
    }
    indexPanel.addEventListener("click", onIndexPanelClick);

    /* models preview overlay */
    const modelsPanel = $("#modelsPanel");
    function toggleModels(force?: boolean) {
      const on = typeof force === "boolean" ? force : !modelsPanel.classList.contains("on");
      modelsPanel.classList.toggle("on", on);
    }
    function onModelsClose(e: Event) {
      e.stopPropagation();
      toggleModels(false);
    }
    $("#modelsClose").addEventListener("click", onModelsClose);
    function onModelsPanelClick(e: Event) {
      if (e.target === modelsPanel) toggleModels(false);
    }
    modelsPanel.addEventListener("click", onModelsPanelClick);
    function onIndexModels(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      toggleIndex(false);
      toggleModels(true);
    }
    $("#indexModels").addEventListener("click", onIndexModels);
    function onCardBtn(e: Event) {
      if (cardBtn.dataset.action === "models") {
        e.preventDefault();
        e.stopPropagation();
        toggleModels(true);
      }
    }
    cardBtn.addEventListener("click", onCardBtn);

    /* each model in the popup is a teaser — gently tell the user it's coming */
    const toast = $("#toast");
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    function showToast(msg: string) {
      toast.textContent = msg;
      toast.classList.add("on");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("on");
      }, 2800);
    }
    const modelEls = Array.from(modelsPanel.querySelectorAll<HTMLElement>(".model"));
    function onModelClick(e: Event) {
      e.stopPropagation();
      showToast("playground for world models coming soon for public-testing");
    }
    modelEls.forEach(function (m) {
      m.addEventListener("click", onModelClick);
    });

    const seenIntro = (() => { try { return !!localStorage.getItem("lr-intro-seen"); } catch (_) { return false; } })();
    if (seenIntro) {
      introDone = true;
      intro.style.display = "none";
      field.style.transition = "none";
      field.classList.add("on");
      setTimeout(function () { field.style.transition = ""; }, 50);
      startField();
    } else {
      goPhase(0);
    }

    return function cleanup() {
      clearTimers();
      if (raf) cancelAnimationFrame(raf);
      if (edgeTimer) clearTimeout(edgeTimer);
      if (toastTimer) clearTimeout(toastTimer);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", computeCell);
      field.removeEventListener("touchstart", onTouchStart);
      field.removeEventListener("touchmove", onTouchMove);
      field.removeEventListener("touchend", onTouchEnd);
      field.removeEventListener("pointerdown", onFieldPointerDown as EventListener);
    };
  }, []);

  return (
    <div ref={rootRef} className="photon-landing">
      <style>{PHOTON_CSS}</style>

      {/* ================= ACT I ================= */}
      <div id="intro" data-screen-label="Intro">
        <div className="phase" id="ph1">
          <h1 className="greet">Hello, human.</h1>
        </div>
        <div className="phase" id="ph2">
          <div className="breathwrap">
            <svg className="breathring" viewBox="0 0 200 200" aria-hidden="true">
              <circle className="br-track" cx="100" cy="100" r="99"></circle>
              <circle className="br-mark" cx="199" cy="100" r="2.2"></circle>
              <circle className="br-mark" cx="27.8" cy="167.7" r="2.2"></circle>
              <circle className="br-mark" cx="27.8" cy="32.3" r="2.2"></circle>
              <circle className="br-prog" cx="100" cy="100" r="99"></circle>
            </svg>
            <div className="breathglow"></div>
            <svg className="breathlogo" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <mask id="lr-cut-breath">
                  <rect width="1024" height="1024" fill="white"></rect>
                  <line x1="-50" y1="420" x2="1074" y2="820" stroke="black" strokeWidth="58"></line>
                </mask>
              </defs>
              <polygon points="512,176 120,848 904,848" fill="#ffffff" mask="url(#lr-cut-breath)"></polygon>
            </svg>
          </div>
          <p className="bcue" id="bcue">
            &nbsp;
          </p>
        </div>
        <div className="phase" id="ph3">
          <h1 className="greet">Welcome to LegitReach.</h1>
        </div>
        <div id="tapskip">tap to continue</div>
      </div>

      {/* ================= ACT II ================= */}
      <div id="field" data-screen-label="Photon Field">
        <div id="world"></div>
        <div id="photon">
          <div className="halo"></div>
        </div>
        <div id="dirhint" aria-hidden="true">
          <span className="da da-u">↑</span>
          <span className="da da-r">→</span>
          <span className="da da-d">↓</span>
          <span className="da da-l">←</span>
        </div>
        <div className="edge edge-t" aria-hidden="true"></div>
        <div className="edge edge-b" aria-hidden="true"></div>
        <div className="edge edge-l" aria-hidden="true"></div>
        <div className="edge edge-r" aria-hidden="true"></div>

        <a className="corner" id="brand" href="#" aria-label="LegitReach">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <mask id="lr-cut">
                <rect width="1024" height="1024" fill="white"></rect>
                <line x1="-50" y1="420" x2="1074" y2="820" stroke="black" strokeWidth="58"></line>
              </mask>
            </defs>
            <polygon points="512,176 120,848 904,848" fill="currentColor" mask="url(#lr-cut)"></polygon>
          </svg>
          <span className="word">LegitReach</span>
        </a>

        <button className="corner" id="indexBtn" type="button">
          Index
        </button>

        <div id="hint">
          <span className="arrows">←↑↓→</span>
          <span id="hinttext">swipe to guide the photon</span>
        </div>

        <div id="card">
          <div className="c-title"></div>
          <div className="c-sub"></div>
          <a className="c-btn" hidden></a>
        </div>
      </div>

      <div id="indexPanel">
        <nav>
          <a href="/cpo/tools">Tools</a>
          <a href="/cpo/invest">Vision</a>
          <a href="#" id="indexModels">
            Models
          </a>
        </nav>
      </div>

      {/* Models preview: two simulations, coming soon */}
      <div id="modelsPanel" data-screen-label="Models Preview">
        <button id="modelsClose" type="button" aria-label="Close">
          ×
        </button>
        <div className="models-inner">
          <div className="model">
            <div className="viz" aria-hidden="true">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <g stroke="rgba(255,255,255,.16)" strokeWidth="1">
                  <line x1="150" y1="100" x2="66" y2="58"></line>
                  <line x1="150" y1="100" x2="128" y2="38"></line>
                  <line x1="150" y1="100" x2="212" y2="52"></line>
                  <line x1="150" y1="100" x2="244" y2="118"></line>
                  <line x1="150" y1="100" x2="196" y2="158"></line>
                  <line x1="150" y1="100" x2="108" y2="162"></line>
                  <line x1="150" y1="100" x2="56" y2="126"></line>
                  <line x1="66" y1="58" x2="128" y2="38"></line>
                  <line x1="212" y1="52" x2="244" y2="118"></line>
                  <line x1="196" y1="158" x2="108" y2="162"></line>
                  <line x1="56" y1="126" x2="66" y2="58"></line>
                  <line x1="128" y1="38" x2="212" y2="52"></line>
                </g>
                <g fill="#ffffff">
                  <circle className="gnode" cx="66" cy="58" r="3"></circle>
                  <circle className="gnode" cx="128" cy="38" r="2.4"></circle>
                  <circle className="gnode" cx="212" cy="52" r="3.2"></circle>
                  <circle className="gnode" cx="244" cy="118" r="2.4"></circle>
                  <circle className="gnode" cx="196" cy="158" r="3"></circle>
                  <circle className="gnode" cx="108" cy="162" r="2.6"></circle>
                  <circle className="gnode" cx="56" cy="126" r="2.4"></circle>
                </g>
                <circle cx="150" cy="100" r="4.5" fill="#109C6B"></circle>
              </svg>
            </div>
            <h3>Communal Graph</h3>
            <p>Online communities, mapped</p>
          </div>

          <div className="model">
            <div className="viz" aria-hidden="true">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <g stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none">
                  <rect x="22" y="16" width="256" height="168" rx="3"></rect>
                  <line x1="150" y1="16" x2="150" y2="184"></line>
                  <circle cx="150" cy="100" r="26"></circle>
                  <rect x="22" y="62" width="34" height="76"></rect>
                  <rect x="244" y="62" width="34" height="76"></rect>
                </g>
                <circle className="ball" cx="0" cy="0" r="4" fill="#ffffff"></circle>
              </svg>
            </div>
            <h3>FIFA World Cup 2026</h3>
            <p>Match simulation</p>
          </div>
        </div>
      </div>

      {/* subtle coming-soon notice for the model teasers */}
      <div id="toast" aria-live="polite"></div>

      <noscript>
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0F0F15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              textAlign: "center",
              fontFamily: "Georgia, serif",
              fontSize: 28,
            }}
          >
            <a href="/cpo/tools" style={{ color: "#fff" }}>
              Tools
            </a>
            <a href="/cpo/invest" style={{ color: "#fff" }}>
              Vision
            </a>
          </nav>
        </div>
      </noscript>
    </div>
  );
}

const PHOTON_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');

.photon-landing {
  --ink: #0F0F15;
  --black: #08080c;
  --line: #26262f;
  --text: #ffffff;
  --dim: #9a9aa3;
  --faint: #55555e;
  --green: #109C6B;
  --green-soft: rgba(16, 156, 107, .45);
  --serif: 'Instrument Serif', Georgia, serif;
  --sans: 'Geist', -apple-system, sans-serif;
  --mono: 'Geist Mono', monospace;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);

  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--black);
  color: var(--text);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}
.photon-landing * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.photon-landing a { color: inherit; text-decoration: none; }
.photon-landing ::selection { background: var(--green); color: var(--black); }

/* ================= ACT I — INTRO ================= */
.photon-landing #intro {
  position: fixed; inset: 0;
  z-index: 100;
  background: var(--black);
  touch-action: none;
  transition: opacity 2.2s var(--ease);
}
.photon-landing #intro.gone { opacity: 0; pointer-events: none; }

.photon-landing .phase {
  position: absolute; inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 34px;
  opacity: 0;
  pointer-events: none;
}
.photon-landing .phase.on { opacity: 1; }

.photon-landing .greet {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(42px, 9.5vw, 92px);
  letter-spacing: 0.01em;
  line-height: 1.05;
  margin: 0;
  text-align: center;
  padding: 0 24px;
  opacity: 0;
  filter: blur(14px);
  transform: scale(.985);
}
.photon-landing .phase.on .greet {
  animation: emerge 1.15s var(--ease) forwards;
}
.photon-landing .phase.out { opacity: 1; }
.photon-landing .phase.out .greet {
  animation: smudge 2.5s cubic-bezier(.45,.05,.55,.95) forwards;
}
@keyframes emerge {
  from { opacity: 0; filter: blur(16px); transform: scale(.975); }
  55%  { opacity: 1; }
  to   { opacity: 1; filter: blur(0px);  transform: scale(1); }
}
@keyframes smudge {
  0%   { opacity: 1;   filter: blur(0px);  transform: scale(1); }
  30%  { opacity: .96; filter: blur(5px);  transform: scale(1.012); }
  100% { opacity: 0;   filter: blur(30px); transform: scale(1.06); }
}

.photon-landing .breathwrap {
  position: relative;
  width: 200px; height: 200px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  filter: blur(12px);
  transition: opacity 1.2s var(--ease), filter 1.5s var(--ease);
}
.photon-landing .phase.on .breathwrap { opacity: 1; filter: blur(0); }
.photon-landing .phase.out .breathwrap,
.photon-landing .phase.out .bcue { animation: smudge 1.8s cubic-bezier(.45,.05,.55,.95) forwards; }
.photon-landing .breathring {
  position: absolute;
  inset: -3px;
  width: calc(100% + 6px);
  height: calc(100% + 6px);
  transform: rotate(-90deg);
}
.photon-landing .breathring .br-track { fill: none; stroke: rgba(255,255,255,.12); stroke-width: 1.5; }
.photon-landing .breathring .br-mark { fill: rgba(255,255,255,.30); }
.photon-landing .breathring .br-prog {
  fill: none;
  stroke: #109C6B;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 622;
  stroke-dashoffset: 622;
  opacity: .9;
}
.photon-landing .phase.on .br-prog { animation: ringsweep 9s linear .35s forwards; }
@keyframes ringsweep {
  0%   { stroke-dashoffset: 622; stroke: #109C6B; }
  38%  { stroke: #109C6B; }
  50%  { stroke: #F9DC5C; }
  62%  { stroke: #F9DC5C; }
  82%  { stroke: #D64538; }
  100% { stroke-dashoffset: 0; stroke: #D64538; }
}
.photon-landing .breathglow {
  position: absolute; inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--green-soft), transparent 70%);
  opacity: .3;
  transform: scale(.45);
}
.photon-landing .breathlogo {
  position: absolute; inset: 16%;
  transform: scale(.45);
}
.photon-landing .phase.on .breathlogo,
.photon-landing .phase.on .breathglow { animation: breathecycle 9s cubic-bezier(.45,.05,.55,.95) 1 forwards; }
@keyframes breathecycle {
  0%   { transform: scale(.45); }
  38%  { transform: scale(1); }
  62%  { transform: scale(1); }
  100% { transform: scale(.45); }
}
.photon-landing .bcue {
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--dim);
  margin: 0;
  min-height: 18px;
  transition: opacity .7s var(--ease);
}
.photon-landing .bcue.swap { opacity: 0; }

.photon-landing #tapskip {
  position: absolute;
  bottom: max(34px, env(safe-area-inset-bottom, 0px) + 22px);
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--faint);
  opacity: 0;
  transition: opacity 1s var(--ease);
}
.photon-landing #intro.show-skip #tapskip { opacity: 1; }

/* ================= ACT II — PHOTON FIELD ================= */
.photon-landing #field {
  position: fixed; inset: 0;
  background:
    radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.5) 100%),
    var(--ink);
  touch-action: none;
  opacity: 0;
  transition: opacity 1.6s var(--ease);
}
.photon-landing #field.on { opacity: 1; }

.photon-landing #world {
  position: absolute;
  left: 50%; top: 50%;
  will-change: transform;
  background-image: radial-gradient(circle, rgba(255,255,255,.10) 1px, transparent 1.6px);
}

.photon-landing .node {
  position: absolute;
  left: 50%; top: 50%;
  width: 0; height: 0;
  cursor: pointer;
}
.photon-landing .node .ring {
  position: absolute;
  left: -7px; top: -7px;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,.45);
  transition: transform .6s var(--ease), border-color .6s var(--ease), background .6s var(--ease), box-shadow .6s var(--ease);
}
.photon-landing .node .lbl {
  position: absolute;
  top: 16px; left: 50%;
  transform: translateX(-50%);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--faint);
  white-space: nowrap;
  transition: color .6s var(--ease);
}
.photon-landing .node.visited .ring { border-color: var(--green); background: rgba(16,156,107,.18); }
.photon-landing .node.visited .lbl { color: var(--dim); }
.photon-landing .node.active .ring {
  transform: scale(2.1);
  border-color: var(--green);
  background: rgba(16,156,107,.10);
  box-shadow: 0 0 30px 4px rgba(16,156,107,.25);
}
.photon-landing .node.active .lbl { color: var(--text); }

.photon-landing .ghost {
  position: absolute;
  left: -3px; top: -3px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.55);
  pointer-events: none;
  animation: ghostfade 1s var(--ease) forwards;
}
@keyframes ghostfade {
  from { opacity: .7; transform: scale(1); }
  to   { opacity: 0;  transform: scale(.2); }
}

.photon-landing #photon {
  position: absolute;
  left: 50%; top: 50%;
  width: 12px; height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 0 10px 2px rgba(255,255,255,.85),
    0 0 38px 10px var(--green-soft);
  pointer-events: none;
  transition: box-shadow .35s var(--ease);
}
.photon-landing #photon.bump {
  box-shadow:
    0 0 10px 2px rgba(255,255,255,.85),
    0 0 38px 12px rgba(214,69,56,.55);
}
.photon-landing #photon .halo {
  position: absolute;
  left: 50%; top: 50%;
  width: 44px; height: 44px;
  margin: -22px 0 0 -22px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.22);
  animation: halo 3.2s ease-in-out infinite;
}
@keyframes halo {
  0%, 100% { transform: scale(.78); opacity: .55; }
  50%      { transform: scale(1.12); opacity: .18; }
}

.photon-landing .edge {
  position: absolute;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity .55s var(--ease);
}
.photon-landing .edge.on { opacity: 1; transition: opacity .1s ease-out; }
.photon-landing .edge-t { top: 0; left: 0; right: 0; height: 110px; background: linear-gradient(180deg, rgba(214,69,56,.26), transparent); }
.photon-landing .edge-b { bottom: 0; left: 0; right: 0; height: 110px; background: linear-gradient(0deg, rgba(214,69,56,.26), transparent); }
.photon-landing .edge-l { top: 0; bottom: 0; left: 0; width: 110px; background: linear-gradient(90deg, rgba(214,69,56,.26), transparent); }
.photon-landing .edge-r { top: 0; bottom: 0; right: 0; width: 110px; background: linear-gradient(270deg, rgba(214,69,56,.26), transparent); }

.photon-landing #dirhint {
  position: absolute;
  left: 50%; top: 50%;
  pointer-events: none;
  z-index: 6;
}
.photon-landing #dirhint .da {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: var(--mono);
  font-size: 17px;
  color: rgba(255,255,255,.65);
  opacity: 0;
  filter: blur(8px);
}
.photon-landing #dirhint .da-u { left: 0; top: -54px; }
.photon-landing #dirhint .da-d { left: 0; top: 54px; }
.photon-landing #dirhint .da-l { left: -54px; top: 0; }
.photon-landing #dirhint .da-r { left: 54px; top: 0; }
.photon-landing #dirhint.on .da { animation: da-in 1.1s var(--ease) forwards; }
.photon-landing #dirhint.on .da-u { animation-delay: .05s; }
.photon-landing #dirhint.on .da-r { animation-delay: .2s; }
.photon-landing #dirhint.on .da-d { animation-delay: .35s; }
.photon-landing #dirhint.on .da-l { animation-delay: .5s; }
.photon-landing #dirhint.gone .da { animation: da-out 1.2s cubic-bezier(.45,.05,.55,.95) forwards; }
@keyframes da-in  { to { opacity: 1; filter: blur(0); } }
@keyframes da-out { from { opacity: 1; filter: blur(0); } to { opacity: 0; filter: blur(10px); } }

.photon-landing .corner {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
}
.photon-landing #brand {
  top: max(20px, env(safe-area-inset-top, 0px) + 12px);
  left: 22px;
  gap: 9px;
  opacity: .85;
}
.photon-landing #brand svg { width: 18px; height: 18px; display: block; }
.photon-landing #brand .word { font-size: 14px; font-weight: 600; letter-spacing: -0.02em; }

.photon-landing #indexBtn {
  top: max(20px, env(safe-area-inset-top, 0px) + 12px);
  right: 22px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--dim);
  background: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  transition: color .2s var(--ease), border-color .2s var(--ease);
}
.photon-landing #indexBtn:hover { color: var(--text); border-color: #3a3a45; }

.photon-landing #hint {
  position: absolute;
  bottom: max(36px, env(safe-area-inset-bottom, 0px) + 26px);
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--faint);
  text-align: center;
  transition: opacity 1s var(--ease), filter 1s var(--ease);
  pointer-events: none;
  white-space: nowrap;
}
.photon-landing #hint.gone { opacity: 0; filter: blur(8px); }
.photon-landing #hint .arrows { color: var(--dim); letter-spacing: .35em; margin-right: 10px; }

.photon-landing #card {
  position: absolute;
  bottom: max(30px, env(safe-area-inset-bottom, 0px) + 20px);
  left: 50%;
  transform: translate(-50%, 16px);
  width: min(340px, calc(100vw - 40px));
  background: rgba(22, 22, 30, .92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px 20px;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .45s var(--ease), transform .45s var(--ease);
}
.photon-landing #card.on { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.photon-landing #card .c-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.photon-landing #card .c-sub { font-size: 13px; color: var(--dim); line-height: 1.5; margin-top: 5px; }
.photon-landing #card.bare .c-btn { margin-top: 0; }
.photon-landing #card .c-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
  height: 40px;
  padding: 0 22px;
  border-radius: 9px;
  background: var(--green);
  color: var(--black);
  font-size: 14px;
  font-weight: 600;
  transition: background .2s var(--ease);
}
.photon-landing #card .c-btn:hover { background: #15b884; }

/* ===== Models preview overlay ===== */
.photon-landing #modelsPanel {
  position: fixed; inset: 0;
  z-index: 70;
  background: rgba(8, 8, 12, .9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .45s var(--ease);
}
.photon-landing #modelsPanel.on { opacity: 1; pointer-events: auto; }
.photon-landing .models-inner {
  display: flex;
  gap: clamp(28px, 6vw, 72px);
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 24px;
  max-height: 100%;
  overflow: auto;
  filter: blur(12px);
  transition: filter .55s var(--ease);
}
.photon-landing #modelsPanel.on .models-inner { filter: blur(0); }
.photon-landing .model {
  width: min(320px, 84vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  cursor: pointer;
}
.photon-landing .model .viz {
  width: 100%;
  aspect-ratio: 3 / 2;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--ink);
  overflow: hidden;
  margin-bottom: 14px;
  transition: border-color .3s var(--ease);
}
.photon-landing .model:hover .viz { border-color: #3a3a45; }
.photon-landing .model .viz svg { width: 100%; height: 100%; display: block; }
.photon-landing .model h3 { font-family: var(--serif); font-weight: 400; font-size: 26px; margin: 0; letter-spacing: .01em; }
.photon-landing .model p { font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); margin: 0; }
.photon-landing #modelsClose {
  position: absolute;
  top: max(18px, env(safe-area-inset-top, 0px) + 10px);
  right: 20px;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: none;
  border: 1px solid var(--line);
  color: var(--dim);
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  transition: color .2s var(--ease), border-color .2s var(--ease);
}
.photon-landing #modelsClose:hover { color: var(--text); border-color: #3a3a45; }

.photon-landing .gnode { animation: gpulse 4.5s ease-in-out infinite; }
.photon-landing .gnode:nth-of-type(2n) { animation-delay: 1.1s; }
.photon-landing .gnode:nth-of-type(3n) { animation-delay: 2.3s; }
@keyframes gpulse {
  0%, 100% { opacity: .45; }
  50%      { opacity: 1; }
}
.photon-landing .ball { animation: ballpath 14s ease-in-out infinite; }
@keyframes ballpath {
  0%   { transform: translate(82px, 100px); }
  11%  { transform: translate(140px, 62px); }
  20%  { transform: translate(140px, 62px); }
  31%  { transform: translate(212px, 92px); }
  40%  { transform: translate(212px, 92px); }
  52%  { transform: translate(168px, 148px); }
  61%  { transform: translate(168px, 148px); }
  73%  { transform: translate(92px, 138px); }
  82%  { transform: translate(92px, 138px); }
  94%  { transform: translate(82px, 100px); }
  100% { transform: translate(82px, 100px); }
}

/* Index overlay */
.photon-landing #indexPanel {
  position: fixed; inset: 0;
  z-index: 60;
  background: rgba(8, 8, 12, .88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .4s var(--ease);
}
.photon-landing #indexPanel.on { opacity: 1; pointer-events: auto; }
.photon-landing #indexPanel nav { display: flex; flex-direction: column; gap: 6px; text-align: center; filter: blur(12px); transition: filter .55s var(--ease); }
.photon-landing #indexPanel.on nav { filter: blur(0); }
.photon-landing #indexPanel a {
  font-family: var(--serif);
  font-size: clamp(30px, 6.4vw, 46px);
  line-height: 1.3;
  color: var(--text);
  transition: color .2s var(--ease);
}
.photon-landing #indexPanel a:hover { color: var(--green); }

/* ===== Coming-soon toast ===== */
.photon-landing #toast {
  position: fixed;
  z-index: 90;
  left: 50%;
  bottom: max(30px, env(safe-area-inset-bottom, 0px) + 22px);
  transform: translate(-50%, 14px);
  width: max-content;
  max-width: calc(100vw - 32px);
  background: rgba(22, 22, 30, .96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 12px 22px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: .06em;
  color: var(--text);
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .4s var(--ease), transform .4s var(--ease);
}
.photon-landing #toast.on { opacity: 1; transform: translate(-50%, 0); }

@media (prefers-reduced-motion: reduce) {
  .photon-landing .phase.on .greet, .photon-landing .phase.out .greet { animation: none; opacity: 1; filter: none; transform: none; }
  .photon-landing .phase.out .greet { opacity: 0; }
  .photon-landing .phase.on .breathlogo, .photon-landing .phase.on .breathglow { animation: none; transform: scale(.8); }
  .photon-landing .phase.on .br-prog { animation: none; stroke-dashoffset: 0; }
  .photon-landing .breathwrap { filter: none; transition: opacity .3s; }
  .photon-landing .phase.out .breathwrap, .photon-landing .phase.out .bcue { animation: none; opacity: 0; }
  .photon-landing #photon .halo { animation: none; opacity: .35; }
  .photon-landing #dirhint.on .da { animation: none; opacity: 1; filter: none; }
  .photon-landing #dirhint.gone .da { animation: none; opacity: 0; }
  .photon-landing .ball, .photon-landing .gnode { animation: none; }
}

@media (max-width: 480px) {
  .photon-landing #brand .word { font-size: 12px; }
  .photon-landing .greet { font-size: clamp(38px, 11vw, 64px); }
  .photon-landing #toast { white-space: normal; border-radius: 16px; }
  .photon-landing .breathwrap { width: min(200px, 52vmin); height: min(200px, 52vmin); }
  .photon-landing .breathring { inset: -2px; width: calc(100% + 4px); height: calc(100% + 4px); }
}
`;
