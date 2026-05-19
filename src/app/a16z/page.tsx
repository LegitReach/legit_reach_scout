"use client";

import React, { useState } from "react";
import { Backdrop } from "@/components/lr-design/visuals";
import { TopBar } from "./_chrome";
import { Step1Persona, Step2Website, Step3Agent } from "./_steps";
import { Step4Dashboard } from "./_dashboard";
import type { AgentStats } from "./_agents";
import type { ScanResult, CurationResult } from "./_steps";

export default function A16zOnboarding() {
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState("business");
  const [website, setWebsite] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [agentId, setAgentId] = useState("classic");
  const [custom, setCustom] = useState<AgentStats | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [curationResult, setCurationResult] = useState<CurationResult | null>(null);

  const total = 3;

  return (
    <div
      className="lr-design"
      style={{ minHeight: "100vh", background: "#000" }}
    >
      <Backdrop />
      <TopBar
        step={step}
        total={total}
        onBack={() => setStep((s) => Math.max(1, s - 1))}
      />
      <main style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        {step === 1 && (
          <Step1Persona
            value={persona}
            setValue={setPersona}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Website
            website={website}
            setWebsite={setWebsite}
            manualDesc={manualDesc}
            setManualDesc={setManualDesc}
            onScanComplete={setScanResult}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3Agent
            agentId={agentId}
            setAgentId={setAgentId}
            custom={custom}
            setCustom={setCustom}
            scanResult={scanResult}
            onCurationComplete={setCurationResult}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4Dashboard
            agentId={agentId}
            setAgentId={setAgentId}
            curationResult={curationResult}
            businessDescription={scanResult?.businessDescription ?? ""}
          />
        )}
      </main>
      <footer
        className="px-6 md:px-12 lg:px-16 py-6"
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="flex justify-between"
          style={{
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          <div>LegitReach. The world model for online communities.</div>
          <a
            href="mailto:manthan@legitreach.com"
            style={{ transition: "color 200ms ease" }}
          >
            Contact for bugs: manthan@legitreach.com
          </a>
        </div>
      </footer>
    </div>
  );
}
