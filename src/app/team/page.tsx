"use client";

import { Reveal } from "@/components/lr-design/visuals";
import Nav from "@/components/lr-design/Nav";

type Member = {
  role: string;
  name: string;
  body: string;
  link?: { label: string; href: string };
};

const MEMBERS: Member[] = [
  {
    role: "Founder + CEO",
    name: "Manthan Admane",
    body: "Software developer turned marketing manager at Applied Materials. 2x D2C founder. Owns the product stack, leads fundraising & customer development.",
    link: { label: "LinkedIn", href: "https://linkedin.com/in/manthanadmane" },
  },
  {
    role: "Founding Engineer",
    name: "Manas Kalangan",
    body: "Builds the data pipeline, the inference layer, and the Chrome extension that powers the world model.",
  },
  {
    role: "Research Advisor",
    name: "Computer Department, MIT-WPU",
    body: "Co-authored research on AI in marketing. Advises on model architecture and academic validation.",
  },
];

function ScrollSection({
  eyebrow,
  heading,
  body,
}: {
  eyebrow: string;
  heading: string;
  body: string[];
}) {
  return (
    <section className="px-6 md:px-12 lg:px-16 py-32">
      <div className="max-w-5xl">
        <Reveal>
          <div
            className="text-xs uppercase mb-8"
            style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
          >
            {eyebrow}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-normal mb-10 leading-tight"
            style={{ letterSpacing: "-0.04em", whiteSpace: "pre-line" }}
          >
            {heading}
          </h2>
        </Reveal>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            maxWidth: "46rem",
          }}
        >
          {body.map((p, i) => (
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
      </div>
    </section>
  );
}

export default function TeamPage() {
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
      <Nav current="/team" />

      <main style={{ flex: 1, paddingTop: "6rem" }}>
        <section
          className="px-6 md:px-12 lg:px-16 py-32"
          style={{ minHeight: "100vh" }}
        >
          <div className="max-w-7xl mx-auto" style={{ paddingTop: "4rem" }}>
            <Reveal>
              <div
                className="text-xs uppercase mb-8"
                style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
              >
                Team
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-normal mb-16 leading-tight"
                style={{ letterSpacing: "-0.04em" }}
              >
                The people behind the model.
              </h1>
            </Reveal>

            <div
              className="md:grid md:grid-cols-3 gap-6"
              style={{ marginBottom: "5rem" }}
            >
              {MEMBERS.map((m, i) => (
                <Reveal key={i} delay={220 + i * 120}>
                  <div
                    className="liquid-glass rounded-xl p-8"
                    style={{
                      height: "100%",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <div
                      className="text-xs uppercase mb-6"
                      style={{ letterSpacing: "0.15em", color: "#9ca3af" }}
                    >
                      {m.role}
                    </div>
                    <h3
                      className="text-2xl md:text-3xl font-normal mb-5"
                      style={{ letterSpacing: "-0.03em" }}
                    >
                      {m.name}
                    </h3>
                    <p
                      className="text-base leading-relaxed mb-6"
                      style={{ color: "#d1d5db" }}
                    >
                      {m.body}
                    </p>
                    {m.link && (
                      <a
                        href={m.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm"
                        style={{
                          color: "#fff",
                          borderBottom: "1px solid rgba(255,255,255,0.3)",
                          paddingBottom: "2px",
                          transition: "color 200ms ease",
                        }}
                      >
                        {m.link.label}
                      </a>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={600}>
              <div className="text-center">
                <p
                  className="text-2xl md:text-3xl font-light mb-4"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Long term games with long term people.
                </p>
                <a
                  href="mailto:manthan@legitreach.com"
                  className="text-base md:text-lg"
                  style={{ color: "#d1d5db", transition: "color 200ms ease" }}
                >
                  manthan@legitreach.com
                </a>
              </div>
            </Reveal>
          </div>

          {/* Founder philosophy */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              marginTop: "6rem",
            }}
          >
            <ScrollSection
              eyebrow="01 / Obsession"
              heading={"I want to draw\ncapitalism with math."}
              body={[
                "I am Manthan. Software developer turned marketer. 2x D2C founder.",
                "Online interaction is the most valuable function on the internet. Nobody is modeling it from first principles. I am.",
                "LegitReach is the simulator for online interactions. A sandbox to rehearse the deal before the deal.",
              ]}
            />

            <ScrollSection
              eyebrow="02 / Thesis"
              heading={"AI made content infinite.\nAttention stayed finite."}
              body={[
                "Most companies use AI to make more slop. We use AI to test and predict slop before it ships @ scale.",
                "Online communities are a platform for trading information (buyer-seller match for data).",
                "The model knows what gets ignored. The model knows what gets answered. We make the difference measurable.",
              ]}
            />

            <ScrollSection
              eyebrow="03 / The hunting dog"
              heading={"AI is the hunting dog.\nNot the hunter."}
              body={[
                "A dog on a duck hunt does not decide what to shoot. The dog flushes the ducks. The dog retrieves the catch. The hunter holds the gun. The hunter decides when to fire.",
                "Our agents flush conversations. Our agents draft replies. Our agents predict outcomes. The human approves. Legit tone of voice conversion to post-worthy content. The human owns the relationship.",
                "Humans always in the loop.",
              ]}
            />
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
