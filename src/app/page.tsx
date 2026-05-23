"use client";

import Link from "next/link";
import {
  AnimatedHeading,
  DigitalDowntown,
  FadeIn,
  Reveal,
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
                text={"Search engine for\ncommunity managers."}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-6"
              />
              <FadeIn delay={1000} duration={1000}>
                <p
                  className="text-base md:text-lg mb-8"
                  style={{
                    maxWidth: "40rem",
                    color: "#d1d5db",
                  }}
                >
                  Everything a community manager needs to run a brand online.
                  Listen, research, draft & post: One platform.
                  <br />
                  <br />
                  Compound your brand voice without a single dollar in paid
                  media.
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

        {/* Problem section */}
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
                Problem
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-10 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                Online community management is broken.
              </h2>
            </Reveal>
            <Reveal delay={220}>
              <p
                className="text-lg md:text-xl mb-10 leading-relaxed"
                style={{ maxWidth: "46rem", color: "#d1d5db" }}
              >
                It takes consistency, time, effort, and taste. Most brands are
                struggling to show up legitimately online. They go silent,
                outsource badly, default to ads or worse: use bot armies for
                posting.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div
                className="flex flex-wrap"
                style={{ gap: "0.625rem" }}
              >
                {[
                  "Consistency",
                  "Time",
                  "Effort",
                  "Taste",
                  "Legitimacy",
                ].map((t) => (
                  <div
                    key={t}
                    className="text-sm"
                    style={{
                      border: "1px solid rgba(255,255,255,0.14)",
                      padding: "0.5rem 1rem",
                      color: "#9ca3af",
                    }}
                  >
                    {t}
                  </div>
                ))}
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
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <span>LegitReach. Manage real online presence with ease.</span>
          <Link href="/policy" style={{ transition: "color 200ms ease" }}>
            Policy
          </Link>
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
