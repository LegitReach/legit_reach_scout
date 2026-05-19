"use client";

import React, { useState, useEffect } from "react";
import { FadeIn, AnimatedHeading } from "@/components/lr-design/visuals";
import { Modal, BackgroundIndexer } from "./_chrome";
import { AGENTS, Agent, AgentSilhouette, AgentStats } from "./_agents";

// ─── Step 1: Persona ─────────────────────────────────────────
export function Step1Persona({
  onNext,
  value,
  setValue,
}: {
  onNext: () => void;
  value: string;
  setValue: (v: string) => void;
}) {
  const [showSoon, setShowSoon] = useState(false);
  return (
    <div
      className="px-6 md:px-12 lg:px-16"
      style={{ paddingTop: "8rem", paddingBottom: "5rem" }}
    >
      <div className="max-w-6xl mx-auto">
        <FadeIn duration={700}>
          <div
            className="text-xs uppercase tracking-widest mb-6"
            style={{ color: "#9ca3af" }}
          >
            Step 01 / Persona type
          </div>
        </FadeIn>
        <AnimatedHeading
          text="Create a digital clone for?"
          className="text-3xl md:text-5xl lg:text-6xl font-normal mb-4"
        />
        <FadeIn delay={400} duration={700}>
          <p
            className="text-base md:text-lg mb-12"
            style={{ maxWidth: "44rem", color: "#d1d5db" }}
          >
            Who is the agent going to represent? You can add more later.
          </p>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            alignItems: "stretch",
          }}
        >
          <PersonaCard
            primary
            tag="Available now"
            title="Business"
            body="An agent that learns your brand, products, and audiences. Joins conversations where buyers already are."
            kind="business"
            value={value}
            setValue={setValue}
          />
          <PersonaCard
            disabled
            tag="Coming soon"
            title="Personal brand"
            body="A digital twin for a creator, founder, or operator. Speaks in your voice across communities."
            kind="personal"
            value={value}
            setValue={setValue}
            onDisabledClick={() => setShowSoon(true)}
          />
        </div>

        <FadeIn delay={600} duration={700}>
          <div
            className="mt-12 flex flex-wrap items-center"
            style={{ gap: "1rem" }}
          >
            <button
              onClick={onNext}
              disabled={value !== "business"}
              className="lr-btn-primary"
              style={{
                opacity: value === "business" ? 1 : 0.4,
                cursor: value === "business" ? "pointer" : "not-allowed",
              }}
            >
              Continue
            </button>
          </div>
        </FadeIn>
      </div>

      {showSoon && (
        <Modal
          onClose={() => setShowSoon(false)}
          title="Personal brand. Coming soon!"
        >
          <p
            className="text-base leading-relaxed mb-2"
            style={{ color: "#e5e7eb" }}
          >
            Individual online representation @ scale
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#9ca3af" }}
          >
            We are tuning the LegitReach model so a single voice scales across
            communities without losing nuance.
          </p>
          <div className="flex justify-end mt-6" style={{ gap: "0.75rem" }}>
            <button onClick={() => setShowSoon(false)} className="lr-btn-nav">
              Got it
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PersonaCard({
  disabled,
  primary,
  tag,
  title,
  body,
  kind,
  value,
  setValue,
  onDisabledClick,
}: {
  disabled?: boolean;
  primary?: boolean;
  tag: string;
  title: string;
  body: string;
  kind: string;
  value: string;
  setValue: (v: string) => void;
  onDisabledClick?: () => void;
}) {
  const selected = value === kind;
  const borderColor = disabled
    ? "rgba(255,255,255,0.10)"
    : selected
    ? "rgba(255,255,255,0.75)"
    : primary
    ? "rgba(255,255,255,0.35)"
    : "rgba(255,255,255,0.18)";
  return (
    <button
      onClick={() => {
        if (disabled) {
          if (onDisabledClick) onDisabledClick();
          return;
        }
        setValue(kind);
      }}
      className="liquid-glass rounded-2xl text-left"
      style={{
        padding: "2rem",
        border: `1px solid ${borderColor}`,
        boxShadow:
          primary && !disabled
            ? "0 30px 60px -30px rgba(255,255,255,0.18)"
            : "none",
        opacity: disabled ? 0.55 : 1,
        cursor: "pointer",
        transition: "border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease",
        transform: selected ? "translateY(-2px)" : "none",
        minHeight: "17rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "inherit",
        position: "relative",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <div
            className="text-xs uppercase tracking-widest"
            style={{ color: primary ? "#d1d5db" : "#9ca3af" }}
          >
            {tag}
          </div>
        </div>
        <h3
          className="font-normal mb-4"
          style={{
            letterSpacing: "-0.03em",
            fontSize: "2.25rem",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h3>
        <p
          className="leading-relaxed"
          style={{ fontSize: "0.975rem", color: primary ? "#e5e7eb" : "#9ca3af" }}
        >
          {body}
        </p>
      </div>
    </button>
  );
}

// ─── Shared types ─────────────────────────────────────────────
export interface ScanResult {
  tagline: string;
  businessDescription: string;
  targetAudience: string;
  productCategories: string[];
  keywords: string[];
  subreddits: string[];
  brandName: string;
  storeUrl: string;
  ogImage: string;
}

export interface CurationResult {
  posts: Record<string, unknown>[];
  curated_posts: Array<{
    id: string;
    ai_relevance_score: number;
    ai_opportunity_score: number;
    ai_reasoning: string;
    recommended_action: "engage" | "monitor" | "skip";
  }>;
  summary: string;
  total_analyzed: number;
}

// ─── Step 2: Website / Description ─────────────────────────────
export function Step2Website({
  onNext,
  website,
  setWebsite,
  manualDesc,
  setManualDesc,
  onScanComplete,
}: {
  onNext: () => void;
  website: string;
  setWebsite: (v: string) => void;
  manualDesc: string;
  setManualDesc: (v: string) => void;
  onScanComplete: (result: ScanResult) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(manualDesc);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const canContinue =
    website.trim().length > 4 || manualDesc.trim().length >= 150;

  async function handleContinue() {
    if (website.trim().length > 4) {
      setScanning(true);
      setScanError("");
      try {
        const res = await fetch("/api/onboarding/magic-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: website.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Scan failed");
        onScanComplete(data as ScanResult);
        onNext();
      } catch (err) {
        setScanError(err instanceof Error ? err.message : "Could not scan site. Try manual description.");
      } finally {
        setScanning(false);
      }
    } else {
      onNext();
    }
  }

  return (
    <div
      className="px-6 md:px-12 lg:px-16"
      style={{ paddingTop: "8rem", paddingBottom: "5rem" }}
    >
      <div className="max-w-4xl mx-auto">
        <FadeIn duration={700}>
          <div
            className="text-xs uppercase tracking-widest mb-6"
            style={{ color: "#9ca3af" }}
          >
            Step 02 / Source of truth
          </div>
        </FadeIn>
        <AnimatedHeading
          text="Where can we read about you?"
          className="text-3xl md:text-5xl lg:text-6xl font-normal mb-4"
        />
        <FadeIn delay={400} duration={700}>
          <p
            className="text-base md:text-lg mb-12"
            style={{ maxWidth: "44rem", color: "#d1d5db" }}
          >
            We crawl your site to learn products, audience, and voice. Takes
            about ninety seconds.
          </p>
        </FadeIn>

        <FadeIn delay={500} duration={700}>
          <div
            className="liquid-glass rounded-2xl p-2 mb-4"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <div className="flex items-center" style={{ gap: 0 }}>
              <div
                className="px-4 text-sm"
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                  color: "#9ca3af",
                }}
              >
                https://
              </div>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="yourbrand.com"
                className="flex-1"
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                  padding: "1rem",
                  fontSize: "1.125rem",
                  fontFamily: "inherit",
                }}
              />
              {website && (
                <div className="px-3 text-xs" style={{ color: "#9ca3af" }}>
                  URL detected
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={600} duration={700}>
          <button
            onClick={() => {
              setDraft(manualDesc);
              setShowModal(true);
            }}
            style={{
              background: "transparent",
              color: "#d1d5db",
              fontSize: "0.95rem",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          >
            No website? Describe your business instead →
          </button>
        </FadeIn>

        {manualDesc && (
          <FadeIn delay={300} duration={700}>
            <div
              className="liquid-glass rounded-xl p-4 mt-6"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <div
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "#9ca3af" }}
              >
                Manual description
              </div>
              <p
                className="text-sm"
                style={{ whiteSpace: "pre-wrap", color: "#f3f4f6" }}
              >
                {manualDesc}
              </p>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={700} duration={700}>
          <div
            className="mt-12 flex flex-wrap items-center"
            style={{ gap: "1rem" }}
          >
            <button
              onClick={handleContinue}
              disabled={!canContinue || scanning}
              className="lr-btn-primary"
              style={{
                opacity: canContinue && !scanning ? 1 : 0.4,
                cursor: canContinue && !scanning ? "pointer" : "not-allowed",
              }}
            >
              {scanning ? "Scanning…" : "Continue"}
            </button>
            {scanError ? (
              <span className="text-sm" style={{ color: "#f87171" }}>{scanError}</span>
            ) : (
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                We never post or change anything on your site.
              </span>
            )}
          </div>
        </FadeIn>
      </div>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title="Tell us about your business"
        >
          <p className="text-sm mb-4" style={{ color: "#d1d5db" }}>
            A few sentences. What you sell, who buys, and how you sound.
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder={
              "E.g. We sell minimalist skincare for sensitive skin. Customers are millennials in the US who care about ingredients. Friendly, science-led tone."
            }
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "1rem",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
            }}
          />
          <div className="text-xs mt-2 text-right" style={{ color: draft.length >= 150 ? "#9ca3af" : "#f87171" }}>
            {draft.length < 150 ? "Atleast 150 characters required" : ""}
          </div>
          <div className="flex justify-end mt-4" style={{ gap: "0.75rem" }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: "transparent",
                color: "#d1d5db",
                padding: "0.5rem 1rem",
                fontSize: 14,
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setManualDesc(draft);
                setShowModal(false);
              }}
              disabled={draft.length < 150}
              className="lr-btn-nav"
              style={{ opacity: draft.length < 150 ? 0.4 : 1, cursor: draft.length < 150 ? "not-allowed" : "pointer" }}
            >
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Step 3: Agent ─────────────────────────────────────────
export function Step3Agent({
  onNext,
  agentId,
  setAgentId,
  custom,
  setCustom,
  scanResult,
  onCurationComplete,
}: {
  onNext: () => void;
  agentId: string;
  setAgentId: (id: string) => void;
  custom: AgentStats | null;
  setCustom: (s: AgentStats) => void;
  scanResult: ScanResult | null;
  onCurationComplete: (r: CurationResult) => void;
}) {
  const agent: Agent = AGENTS.find((a) => a.id === agentId) || AGENTS[1];
  const view: AgentStats = custom ?? agent.stats;
  const update = (patch: Partial<AgentStats>) =>
    setCustom({ ...view, ...patch });

  useEffect(() => {
    if (!scanResult?.subreddits?.length || !scanResult?.keywords?.length) return;
    fetch("/api/a16z/curate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subreddits: scanResult.subreddits,
        keywords: scanResult.keywords,
        businessDescription: scanResult.businessDescription,
      }),
    })
      .then((r) => r.json())
      .then((data) => onCurationComplete(data as CurationResult))
      .catch((err) => console.error("Curation failed:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="px-6 md:px-12 lg:px-16"
      style={{ paddingTop: "8rem", paddingBottom: "5rem" }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="flex items-center justify-between mb-6"
          style={{ flexWrap: "wrap", gap: "0.75rem" }}
        >
          <FadeIn duration={700}>
            <div
              className="text-xs uppercase tracking-widest"
              style={{ color: "#9ca3af" }}
            >
              Step 03 / Tone of voice
            </div>
          </FadeIn>
          <FadeIn delay={200} duration={700}>
            <BackgroundIndexer />
          </FadeIn>
        </div>
        <AnimatedHeading
          text="Pick your agent."
          className="text-3xl md:text-5xl lg:text-6xl font-normal mb-4"
        />
        <FadeIn delay={300} duration={700}>
          <p
            className="text-base md:text-lg mb-10"
            style={{ maxWidth: "44rem", color: "#d1d5db" }}
          >
            Each one drafts differently. You can tweak the stats. The agent
            learns your real voice from approved posts.
          </p>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)",
          }}
        >
          <div
            className="liquid-glass rounded-2xl p-6"
            style={{ border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: "#9ca3af" }}
            >
              Garage
            </div>
            <div
              className="grid grid-cols-2"
              style={{ gap: "0.75rem", display: "grid" }}
            >
              {AGENTS.map((a) => {
                const sel = a.id === agentId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAgentId(a.id)}
                    className="rounded-xl"
                    style={{
                      background: sel
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.02)",
                      border: sel
                        ? "1px solid rgba(255,255,255,0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                      padding: "1rem",
                      textAlign: "left",
                      color: "inherit",
                      transition: "all 180ms ease",
                      cursor: "pointer",
                    }}
                  >
                    <AgentSilhouette accent={a.accent} active={sel} vehicle={a.vehicle} />
                    <div className="mt-3 text-base font-medium">{a.name}</div>
                    <div className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                      {a.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="liquid-glass rounded-2xl p-8"
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div>
              <div
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "#9ca3af" }}
              >
                Selected
              </div>
              <h3
                className="text-3xl md:text-4xl font-normal"
                style={{ letterSpacing: "-0.03em" }}
              >
                {agent.name}
              </h3>
              <div className="text-sm mt-1" style={{ color: "#d1d5db" }}>
                {agent.tagline}
              </div>
            </div>

            {(
              ["warmth", "wit", "formality", "brevity", "assertiveness"] as Array<
                keyof AgentStats
              >
            ).map((k) => (
              <StatRow
                key={k}
                label={k[0].toUpperCase() + k.slice(1)}
                value={view[k]}
                onChange={(v) => update({ [k]: v } as Partial<AgentStats>)}
              />
            ))}

            <div>
              <div
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: "#9ca3af" }}
              >
                Sample reply
              </div>
              <div
                className="text-sm leading-relaxed"
                style={{
                  fontStyle: "italic",
                  borderLeft: "2px solid rgba(255,255,255,0.3)",
                  paddingLeft: "0.75rem",
                  color: "#f3f4f6",
                }}
              >
                {agent.sample}
              </div>
            </div>
          </div>
        </div>

        <FadeIn delay={400} duration={700}>
          <div
            className="mt-12 flex flex-wrap items-center"
            style={{ gap: "1rem" }}
          >
            <button onClick={onNext} className="lr-btn-primary">
              Take it for a spin
            </button>
            <span className="text-sm" style={{ color: "#9ca3af" }}>
              You can change agents and stats any time.
            </span>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        className="flex justify-between text-xs uppercase tracking-widest mb-2"
        style={{ color: "#9ca3af" }}
      >
        <span>{label}</span>
        <span style={{ color: "#fff" }}>{value}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${value}%`,
            background: "#fff",
            borderRadius: 999,
          }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
