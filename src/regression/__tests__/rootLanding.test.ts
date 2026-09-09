import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("root landing preservation", () => {
  const landing = readFileSync(join(process.cwd(), "public", "landing.html"), "utf8");

  it("points the primary CTA at a prefilled waitlist email", () => {
    expect(landing).toContain(
      '<a href=\\"mailto:manthan@legitreach.com?subject=LegitBot%20waitlist&body=',
    );
    expect(landing).toContain("My%20WhatsApp%20number%3A%20%2B1%20555%20000%200000");
    expect(landing).toContain('>LEGITBOT<\\u002Fa>');
    expect(landing).not.toContain('<a href=\\"/legitbot\\"');
    expect(landing).not.toContain('>PROTOTYPE<\\u002Fa>');
  });

  it("removes KNOW MORE while keeping the pitch deck implementation", () => {
    expect(landing).toContain(
      "openDeck: (e) => { e.preventDefault(); this.setState({ deckOpen: true }); }",
    );
    expect(landing).not.toContain('>KNOW MORE<\\u002Fa>');
    expect(landing).toContain('data-screen-label=\\"Pitch Deck Modal\\"');
  });

  it("uses the current homepage line", () => {
    expect(landing).toContain("AI for Boomers");
    expect(landing).toContain(
      "Message us three things, we get them done for you without you ever leaving WhatsApp",
    );
    expect(landing).not.toContain("Yellowpages for Deep-Space");
    expect(landing).not.toContain("Deep space communication using photons");
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
