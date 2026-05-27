"use client";

import { Reveal } from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

export default function BuildingPage() {
  const livePoints = [
    "Every Reddit post is a controlled rehearsal. Multiple agents draft. Real humans choose. We draft at superhuman pace & we post at human pace.",
    "You are the agent. Agents have a derived voice of tone from the user, guided by a real person. We do not flood. We do not fake. We only automate the friction away.",
    "High-intent buying conversations become authentic engagement, attributed to revenue through UTM links.",
  ];

  const stats = [
    { num: "3", label: "paying customers" },
    { num: "5 min", label: "per day / brand" },
  ];

  const nextPoints = [
    'A simulator, which is internally referred to as: the "Full Power" engine, simulates online communities in a visual format.\n\nEducators & students learn trading information online by interacting with the model.',
    "First LOI signed with an education institute. Open for partners.",
  ];

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
      <Nav current="/building" />

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
                A / Live today
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-10 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                Reddit Representation. Live today.
              </h1>
            </Reveal>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxWidth: "46rem",
                marginBottom: "3rem",
              }}
            >
              {livePoints.map((p, i) => (
                <Reveal key={i} delay={220 + i * 100}>
                  <p
                    className="text-lg md:text-xl leading-relaxed"
                    style={{ whiteSpace: "pre-line", color: "#d1d5db" }}
                  >
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={560}>
              <div
                className="md:grid md:grid-cols-2 gap-6"
                style={{ marginBottom: "2.5rem" }}
              >
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className="liquid-glass rounded-xl p-8"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <div className="stat-num mb-3">{s.num}</div>
                    <div
                      className="text-sm"
                      style={{ color: "#d1d5db" }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={700}>
              <a href="/launch" className="lr-btn-primary inline-block">
                Try the product now!
              </a>
            </Reveal>
          </div>
        </section>

        <section
          className="px-6 md:px-12 lg:px-16 py-32"
          style={{
            minHeight: "100vh",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="max-w-5xl">
            <Reveal>
              <div
                className="text-xs uppercase mb-8"
                style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
              >
                B / Coming next
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-10 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                Visualize online communities by simulating it.
              </h2>
            </Reveal>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxWidth: "46rem",
                marginBottom: "3rem",
              }}
            >
              {nextPoints.map((p, i) => (
                <Reveal key={i} delay={220 + i * 100}>
                  <p
                    className="text-lg md:text-xl leading-relaxed"
                    style={{ whiteSpace: "pre-line", color: "#d1d5db" }}
                  >
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={500}>
              <a
                href="mailto:manthan@legitreach.com"
                className="lr-btn-primary inline-block"
              >
                Partner with us
              </a>
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
