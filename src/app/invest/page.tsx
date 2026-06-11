"use client";

import {
  AnimatedHeading,
  DigitalDowntown,
  FadeIn,
} from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

export default function InvestPage() {
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
        {/* Ask section */}
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
                  className="inline-block text-xs uppercase mb-6"
                  style={{
                    letterSpacing: "0.12em",
                    color: "#d1d5db",
                    border: "1px solid rgba(255,255,255,0.16)",
                    padding: "0.5rem 1.125rem",
                  }}
                >
                  Pre-Seed · SAFE · Closing 23 Jun 2026
                </div>
              </FadeIn>
              <AnimatedHeading
                text={"Mapping Curiosity to Content creation loop."}
                highlights={["Curiosity", "Content"]}
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
                  GTM and customer acquisition. R&D for the swarm intelligence
                  world models. Reaching $25k+ MRR before Dec 2026.
                </p>
              </FadeIn>
              <FadeIn delay={1500} duration={1000}>
                <a
                  href="/pitch-deck.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lr-btn-primary"
                >
                  Pitch Deck
                </a>
              </FadeIn>
            </div>
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
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <span>LegitReach. Manage real online presence with ease.</span>
          <a href="/policy" style={{ transition: "color 200ms ease" }}>
            Policy
          </a>
        </div>
        <a
          href="mailto:manthan@legitreach.com"
          style={{ transition: "color 200ms ease" }}
        >
          Report Bugs: manthan@legitreach.com
        </a>
      </footer>
    </div>
  );
}
