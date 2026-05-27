"use client";

import { Reveal } from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

type Plan = {
  name: string;
  price: string;
  unit?: string;
  forWho: string;
  desc: string;
};

const PLANS: Plan[] = [
  {
    name: "Monthly",
    price: "$29",
    unit: "/30 days",
    forWho: "Brand owners and solopreneurs",
    desc: "The full tool. Signal detection and AI-assisted drafting, billed monthly.",
  },
  {
    name: "Quarterly",
    price: "$79",
    unit: "/90 days",
    forWho: "Best value — three months up front",
    desc: "Everything in Monthly for 90 days. Save versus paying month to month.",
  },
];

export default function PricingPage() {
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
      <Nav current="/pricing" />

      <main style={{ flex: 1, paddingTop: "6rem" }}>
        <section
          className="px-6 md:px-12 lg:px-16 py-32"
          style={{ minHeight: "100vh" }}
        >
          <div className="max-w-5xl" style={{ paddingTop: "4rem" }}>
            <Reveal>
              <div
                className="text-xs uppercase mb-8"
                style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
              >
                Pricing
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-10 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                Simple pricing. Zero ad spend.
              </h1>
            </Reveal>
            <Reveal delay={220}>
              <p
                className="text-lg md:text-xl mb-16 leading-relaxed"
                style={{ maxWidth: "46rem", color: "#d1d5db" }}
              >
                Compound your brand voice without a single dollar in paid media.
              </p>
            </Reveal>

            <div
              className="md:grid md:grid-cols-2 gap-6"
              style={{ marginBottom: "1.5rem" }}
            >
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={300 + i * 100}>
                  <div
                    className="liquid-glass rounded-xl p-8"
                    style={{
                      height: "100%",
                      border: "1px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      className="text-xs uppercase mb-6"
                      style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
                    >
                      {p.name}
                    </div>
                    <div
                      className="font-normal mb-2"
                      style={{
                        fontSize: "3rem",
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {p.price}
                      {p.unit && (
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: 300,
                            color: "#9ca3af",
                          }}
                        >
                          {p.unit}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs uppercase mb-8"
                      style={{ letterSpacing: "0.08em", color: "#6b7280" }}
                    >
                      {p.forWho}
                    </div>
                    <p
                      className="text-base md:text-lg leading-relaxed"
                      style={{ color: "#d1d5db", marginTop: "auto" }}
                    >
                      {p.desc}
                    </p>
                    <a
                      href="/launch"
                      className="lr-btn-primary inline-block"
                      style={{ marginTop: "1.75rem", alignSelf: "flex-start" }}
                    >
                      Get started
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Enterprise */}
            <Reveal delay={520}>
              <div
                className="liquid-glass rounded-xl p-10 md:flex md:items-center"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  gap: "3.5rem",
                }}
              >
                <div style={{ minWidth: "16rem", marginBottom: "1.5rem" }}>
                  <div
                    className="text-xs uppercase mb-4"
                    style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
                  >
                    Enterprise
                  </div>
                  <div
                    className="font-normal mb-2"
                    style={{ fontSize: "2.25rem", letterSpacing: "-0.03em" }}
                  >
                    Get in touch
                  </div>
                  <div
                    className="text-xs uppercase"
                    style={{ letterSpacing: "0.08em", color: "#6b7280" }}
                  >
                    Research orgs and large brands
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    className="text-base md:text-lg leading-relaxed mb-6"
                    style={{ color: "#d1d5db" }}
                  >
                    Listening Tool + AI Automations. World model for custom
                    simulation & backtesting.
                  </p>
                  <a
                    href="mailto:direct@legitreach.com"
                    className="lr-btn-primary inline-block"
                  >
                    Contact us
                  </a>
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
