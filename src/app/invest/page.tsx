"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AnimatedHeading,
  DigitalDowntown,
  FadeIn,
  Reveal,
} from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

function PitchDeckOverlay({ onClose }: { onClose: () => void }) {
  const handleDownload = () => {
    const iframe = document.getElementById(
      "pitch-deck-iframe"
    ) as HTMLIFrameElement | null;
    try {
      iframe?.contentWindow?.print();
    } catch {
      window.open("/pitch-deck.html", "_blank", "noopener");
    }
  };

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={close}
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.03em" }}
          >
            LegitReach
          </div>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
          <span
            className="text-xs uppercase"
            style={{ letterSpacing: "0.12em", color: "#d1d5db" }}
          >
            Pitch deck
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={handleDownload}
            className="lr-btn-nav"
            style={{ cursor: "pointer" }}
          >
            Download PDF
          </button>
          <button
            onClick={close}
            aria-label="Close"
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              width: 36,
              height: 36,
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
      >
        <iframe
          id="pitch-deck-iframe"
          src="/pitch-deck.html"
          title="LegitReach pitch deck"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
            background: "#000",
          }}
        />
      </div>
    </div>
  );
}

export default function InvestPage() {
  const [showDeck, setShowDeck] = useState(false);
  return (
    <div
      className="lr-design"
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav current="/invest" />

      <main style={{ flex: 1 }}>
        {/* Vision section */}
        <section
          className="relative w-full"
          style={{ minHeight: "100vh", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <DigitalDowntown />
          </div>
          <div
            className="px-6 md:px-12 lg:px-16 lg:pb-16 pb-12"
            style={{
              position: "relative",
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              zIndex: 20,
            }}
          >
            <div style={{ maxWidth: "56rem" }} className="text-shadow-soft">
              <FadeIn delay={100} duration={800}>
                <div
                  className="text-xs uppercase mb-6"
                  style={{
                    letterSpacing: "0.15em",
                    color: "#d1d5db",
                  }}
                >
                  Vision
                </div>
              </FadeIn>
              <AnimatedHeading
                text={"Creating a world model\nfor online commerce."}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-6"
              />
              <FadeIn delay={1200} duration={1000}>
                <p
                  className="text-base md:text-lg mb-8"
                  style={{
                    maxWidth: "40rem",
                    color: "#d1d5db",
                  }}
                >
                  Simulator where online buyers & sellers rehearse negotiations
                  before it actually happens.
                </p>
              </FadeIn>
              <FadeIn delay={1500} duration={1000}>
                <a
                  href="mailto:manthan@legitreach.com"
                  className="lr-btn-primary"
                >
                  Start a Chat
                </a>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Invest section */}
        <section
          className="px-6 md:px-12 lg:px-16 py-32"
          style={{
            minHeight: "100vh",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="max-w-5xl" style={{ paddingTop: "4rem" }}>
            <Reveal>
              <div
                className="text-xs uppercase mb-8"
                style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
              >
                Invest
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-10 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                Invest in the model for simulating online commerce.
              </h1>
            </Reveal>
            <Reveal delay={220}>
              <p
                className="text-lg md:text-xl mb-10 leading-relaxed"
                style={{ maxWidth: "46rem", color: "#d1d5db" }}
              >
                Starting with simulators for online communities.
              </p>
            </Reveal>

            <div
              className="md:grid md:grid-cols-2 gap-8"
              style={{ marginBottom: "4rem" }}
            >
              <Reveal delay={300}>
                <div
                  className="liquid-glass rounded-xl p-8"
                  style={{
                    height: "100%",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <div
                    className="text-xs uppercase mb-4"
                    style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
                  >
                    Today
                  </div>
                  <p
                    className="text-lg md:text-xl leading-relaxed"
                    style={{ color: "#f3f4f6" }}
                  >
                    Authentic Reddit representation for 3 consumer electronics
                    e-commerce brands. Paying customers charged $200 per seat.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={400}>
                <div
                  className="liquid-glass rounded-xl p-8"
                  style={{
                    height: "100%",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <div
                    className="text-xs uppercase mb-4"
                    style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
                  >
                    Planned
                  </div>
                  <p
                    className="text-lg md:text-xl leading-relaxed"
                    style={{ color: "#f3f4f6" }}
                  >
                    Every post on every community becomes labeled training
                    data. The reinforcement flywheel ships in 6 months.
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={500}>
              <div
                className="liquid-glass rounded-xl p-10"
                style={{
                  maxWidth: "38rem",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <div
                  className="text-xs uppercase mb-4"
                  style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
                >
                  The round
                </div>
                <h3
                  className="text-4xl md:text-5xl font-normal mb-3"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  Actively raising pre-seed
                </h3>
                <p
                  className="text-base md:text-lg mb-2"
                  style={{ color: "#d1d5db" }}
                >
                  YC-style SAFE.
                </p>
                <p
                  className="text-base md:text-lg mb-8"
                  style={{ color: "#d1d5db" }}
                >
                  Closing 06/06/2026.
                </p>
                <div className="flex flex-wrap" style={{ gap: "0.75rem" }}>
                  <a
                    href="mailto:manthan@legitreach.com"
                    className="lr-btn-primary inline-block"
                  >
                    Invest now
                  </a>
                  <button
                    onClick={() => setShowDeck(true)}
                    className="lr-btn-ghost liquid-glass inline-block"
                    style={{ cursor: "pointer" }}
                  >
                    Pitch deck
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer
        className="px-6 md:px-12 lg:px-16 py-6 flex justify-between"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.10)",
          color: "#d1d5db",
          fontSize: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>LegitReach. Manage real online presence with ease.</div>
        <a
          href="mailto:manthan@legitreach.com"
          style={{ transition: "color 200ms ease" }}
        >
          Report Bugs: manthan@legitreach.com
        </a>
      </footer>

      {showDeck && <PitchDeckOverlay onClose={() => setShowDeck(false)} />}
    </div>
  );
}
