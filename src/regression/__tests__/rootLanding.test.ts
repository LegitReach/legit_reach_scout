import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("root landing preservation", () => {
  const landing = readFileSync(join(process.cwd(), "public", "landing.html"), "utf8");

  it("links the primary CTA to LegitBot", () => {
    expect(landing).toContain('<a href=\\"/legitbot\\"');
    expect(landing).toContain('>LEGITBOT<\\u002Fa>');
    expect(landing).not.toContain('>PROTOTYPE<\\u002Fa>');
  });

  it("keeps KNOW MORE wired to the pitch deck", () => {
    expect(landing).toContain('sc-camel-on-click=\\"{{ openDeck }}\\"');
    expect(landing).toContain('>KNOW MORE<\\u002Fa>');
    expect(landing).toContain('data-screen-label=\\"Pitch Deck Modal\\"');
  });

  it("retains the internal MiniReach prototype implementation", () => {
    expect(landing).toContain('data-screen-label=\\"Project MiniReach Modal\\"');
    expect(landing).toContain('>PROJECT MINIREACH<\\u002Fspan>');
    expect(landing).toContain("MiniReach replicates it at small scale");
    expect(landing).toContain(
      'openModal: (e) => { e.preventDefault(); this.setState({ modalOpen: true }); }',
    );
  });
});
