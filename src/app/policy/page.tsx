"use client";

import { Reveal } from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

type Section = {
  num: string;
  title: string;
  body: string[];
};

const SECTIONS: Section[] = [
  {
    num: "01",
    title: "LegitReach is a tool, not an agent of record",
    body: [
      "LegitReach is software that helps community managers listen, research, respond, and report. It magnifies your brand voice through automations. It does not act on its own behalf and it does not assume ownership of the accounts, content, or relationships you operate.",
      "Every meaningful action carries a mandatory human in the loop. Multiple agents may draft at superhuman pace, but a real person reviews and chooses what goes live, and posting happens at human pace. You remain the author and the responsible party for everything published through your accounts.",
    ],
  },
  {
    num: "02",
    title: "Account bans and platform actions",
    body: [
      "We are not responsible for account bans, suspensions, rate limits, shadow-bans, content removals, or any other enforcement action taken by a third-party platform (including but not limited to Reddit, X, LinkedIn, Discord, and any other community or social network).",
      "LegitReach simply magnifies your brand voice via automations. You are solely responsible for ensuring that the way you use those automations complies with the terms of service, community rules, and applicable policies of every platform you operate on. Using LegitReach does not transfer that responsibility to us.",
      "If a platform changes its rules, APIs, or policies, your access or results may change. We build to outlast platform API and policy changes, but we cannot guarantee any specific platform outcome.",
    ],
  },
  {
    num: "03",
    title: "Acceptable use",
    body: [
      "We do not flood. We do not fake. We only automate the friction away. You agree to use LegitReach for authentic, legitimate community participation that reflects a real brand voice.",
      "You will not use LegitReach to operate bot armies, run coordinated inauthentic behavior, impersonate others, spread spam, harass, or post unlawful, deceptive, or harmful content. These uses run directly against the purpose of the product and are prohibited.",
    ],
  },
  {
    num: "04",
    title: "Human in the loop",
    body: [
      "Emotions intact. Process automated. Humans stay at every milestone that matters; machines handle the rest. Our agents flush conversations, draft replies, and predict outcomes. The human approves. The human owns the relationship.",
      "Because you review and approve content before it is published, you are responsible for the accuracy, tone, and compliance of the final posts. AI-assisted drafts are suggestions, not guarantees.",
    ],
  },
  {
    num: "05",
    title: "AI, authenticity, and data",
    body: [
      "We use AI to fight AI slop, not to manufacture it. Our intelligence layer is designed to detect artificial noise and surface what is real, including bot detection through community simulation.",
      "We aim to handle personal data lawfully and operate GDPR-aligned detection tooling. We process community signal to provide listening, research, and reporting. You are responsible for ensuring you have the rights and permissions needed for any data you connect or import.",
    ],
  },
  {
    num: "06",
    title: "No guarantee of results",
    body: [
      "LegitReach surfaces signal and helps you act on it. We do not guarantee revenue, reach, engagement, conversions, ranking, or any specific business outcome. Organic compounding takes consistency over time.",
      "Predictions, simulations, and backtests are estimates based on historical and observed behavior. They are decision-support, not promises.",
    ],
  },
  {
    num: "07",
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, LegitReach is provided on an \"as is\" and \"as available\" basis. We are not liable for indirect, incidental, or consequential damages, lost profits, lost data, or platform enforcement actions arising from your use of the product.",
      "Your use of LegitReach is at your own discretion and risk, and within the bounds of every platform policy that applies to you.",
    ],
  },
  {
    num: "08",
    title: "Changes to this policy",
    body: [
      "We may update this policy as the product and the platforms it works with evolve. Continued use after an update means you accept the revised policy.",
    ],
  },
];

export default function PolicyPage() {
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
      <Nav current="/policy" />

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
                Policy
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-normal mb-10 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                A tool that magnifies your brand voice.
              </h1>
            </Reveal>
            <Reveal delay={220}>
              <p
                className="text-lg md:text-xl mb-20 leading-relaxed"
                style={{ maxWidth: "46rem", color: "#d1d5db" }}
              >
                LegitReach is software that automates the friction of community
                management. It is not responsible for account bans. You stay in
                control, in the loop, and responsible for what you publish.
              </p>
            </Reveal>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {SECTIONS.map((s, i) => (
                <Reveal key={s.num} delay={300 + i * 60}>
                  <div
                    className="md:grid"
                    style={{
                      gridTemplateColumns: "64px 1fr",
                      gap: "2rem",
                      padding: "2rem 0",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      alignItems: "start",
                    }}
                  >
                    <div
                      className="font-normal mb-4 md:mb-0"
                      style={{
                        fontSize: "1.5rem",
                        letterSpacing: "-0.03em",
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      {s.num}
                    </div>
                    <div style={{ maxWidth: "46rem" }}>
                      <h2
                        className="text-xl md:text-2xl font-normal mb-5"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {s.title}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                        }}
                      >
                        {s.body.map((p, j) => (
                          <p
                            key={j}
                            className="text-base md:text-lg leading-relaxed"
                            style={{ color: "#d1d5db" }}
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={900}>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  marginTop: "1rem",
                  paddingTop: "2.5rem",
                }}
              >
                <p
                  className="text-base md:text-lg mb-2"
                  style={{ color: "#9ca3af" }}
                >
                  Questions about this policy?
                </p>
                <a
                  href="mailto:manthan@legitreach.com"
                  className="text-lg md:text-xl"
                  style={{
                    color: "#fff",
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                    paddingBottom: "2px",
                  }}
                >
                  manthan@legitreach.com
                </a>
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
    </div>
  );
}
