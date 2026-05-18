"use client";

import Link from "next/link";
import {
  AnimatedHeading,
  DigitalDowntown,
  FadeIn,
} from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

export default function Home() {
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
      <Nav />

      <main style={{ flex: 1 }}>
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
            <div style={{ maxWidth: "52rem" }} className="text-shadow-soft">
              <AnimatedHeading
                text={"Build your authentic\ndigital outreach clone."}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-6"
              />
              <FadeIn delay={1000} duration={1000}>
                <p
                  className="text-base md:text-lg mb-8"
                  style={{
                    maxWidth: "38rem",
                    color: "#d1d5db",
                  }}
                >
                  Your conversations & identity stitched into one calm system
                  that runs while you sleep.
                </p>
              </FadeIn>
              <FadeIn delay={1400} duration={1000}>
                <div
                  className="flex flex-wrap"
                  style={{ gap: "1rem", marginBottom: "1rem" }}
                >
                  <Link href="/a16z" className="lr-btn-primary">
                    Create now!
                  </Link>
                </div>
              </FadeIn>
              <FadeIn delay={1700} duration={1000}>
                <p
                  className="text-sm"
                  style={{
                    color: "#9ca3af",
                    letterSpacing: "0.02em",
                  }}
                >
                  Demo Workflow, beta sign-up in the end.
                </p>
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
        <div>LegitReach. Manage real online presence with ease.</div>
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
