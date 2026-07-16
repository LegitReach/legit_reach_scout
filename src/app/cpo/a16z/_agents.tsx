"use client";

import React from "react";

export type AgentStats = {
  warmth: number;
  wit: number;
  formality: number;
  brevity: number;
  assertiveness: number;
};

export type Agent = {
  id: string;
  name: string;
  tagline: string;
  vehicle: "tanker" | "coupe" | "drone" | "jet";
  stats: AgentStats;
  sample: string;
  accent: string;
};

export const AGENTS: Agent[] = [
  {
    id: "precision",
    name: "The Precision",
    tagline: "Research-grade. Cites sources.",
    vehicle: "tanker",
    stats: { warmth: 35, wit: 25, formality: 85, brevity: 60, assertiveness: 70 },
    sample:
      '"That claim usually holds, but only above 2% retinol. Source: 2024 Cosmetic Sci. review."',
    accent: "#cfd8e3",
  },
  {
    id: "classic",
    name: "The Classic",
    tagline: "Friendly expert. The default.",
    vehicle: "coupe",
    stats: { warmth: 70, wit: 50, formality: 55, brevity: 65, assertiveness: 55 },
    sample:
      '"Totally fair concern. Here is what we did in our last batch and why."',
    accent: "#e9e9e9",
  },
  {
    id: "street",
    name: "The Street",
    tagline: "Casual. Comment-section native.",
    vehicle: "drone",
    stats: { warmth: 80, wit: 85, formality: 20, brevity: 80, assertiveness: 60 },
    sample:
      "\"honestly same. tried it for 3 weeks. didn't love. swapped to X, way better imo.\"",
    accent: "#f3e5c8",
  },
  {
    id: "turbo",
    name: "The Turbo",
    tagline: "High-energy. Founder-style.",
    vehicle: "jet",
    stats: { warmth: 65, wit: 70, formality: 40, brevity: 50, assertiveness: 90 },
    sample:
      '"We rebuilt the whole formula because of feedback like this. Drop is Friday. AMA."',
    accent: "#ffd6c2",
  },
];

export function AgentSilhouette({
  accent,
  active,
  vehicle = "coupe",
}: {
  accent: string;
  active?: boolean;
  vehicle?: Agent["vehicle"];
}) {
  const stroke = active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)";
  const subtle = "rgba(255,255,255,0.15)";
  const wheelStroke = "rgba(255,255,255,0.3)";
  const gradId = `lr-bodyG-${vehicle}-${accent.replace(/[^a-z0-9]/gi, "")}`;
  const fill = `url(#${gradId})`;
  const glass = `url(#${gradId}-glass)`;
  const accentOp = active ? 0.9 : 0.5;

  return (
    <svg
      viewBox="0 0 200 70"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1c1c" />
          <stop offset="100%" stopColor="#070707" />
        </linearGradient>
        <linearGradient id={`${gradId}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="64" rx="80" ry="3" fill="#000" opacity="0.6" />

      {vehicle === "tanker" && (
        <g>
          <rect x="10" y="30" width="110" height="28" rx="6" fill={fill} stroke={stroke} strokeWidth="1" />
          <line x1="45" y1="30" x2="45" y2="58" stroke={subtle} strokeWidth="0.8" />
          <line x1="80" y1="30" x2="80" y2="58" stroke={subtle} strokeWidth="0.8" />
          <rect x="55" y="24" width="14" height="6" rx="1.5" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <path d="M125,58 L125,38 L150,32 L168,42 L186,42 L186,58 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M152,40 L165,42 L165,48 L152,48 Z" fill={glass} stroke={subtle} strokeWidth="0.6" />
          <rect x="10" y="46" width="110" height="1.5" fill={accent} opacity={accentOp} />
          {[28, 50, 95, 138, 172].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy="60" r="6" fill="#000" stroke={wheelStroke} strokeWidth="1" />
              <circle cx={cx} cy="60" r="2" fill={accent} opacity="0.7" />
            </g>
          ))}
        </g>
      )}

      {vehicle === "coupe" && (
        <g>
          <path
            d="M10,55 L30,40 L65,28 L130,28 L165,40 L190,55 L190,60 L10,60 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1"
          />
          <path d="M45,40 L70,32 L125,32 L150,40 Z" fill={glass} stroke={subtle} strokeWidth="0.7" />
          <line x1="30" y1="50" x2="170" y2="50" stroke={subtle} strokeWidth="0.6" />
          <rect x="30" y="48" width="140" height="1.5" fill={accent} opacity={accentOp} />
          <circle cx="185" cy="50" r="1.6" fill={accent} opacity="0.8" />
          <circle cx="15" cy="50" r="1.6" fill="#fff" opacity="0.4" />
          <circle cx="50" cy="60" r="8" fill="#000" stroke={wheelStroke} strokeWidth="1" />
          <circle cx="150" cy="60" r="8" fill="#000" stroke={wheelStroke} strokeWidth="1" />
          <circle cx="50" cy="60" r="3" fill={accent} opacity="0.7" />
          <circle cx="150" cy="60" r="3" fill={accent} opacity="0.7" />
        </g>
      )}

      {vehicle === "drone" && (
        <g>
          <line x1="40" y1="30" x2="160" y2="58" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="58" x2="160" y2="30" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <rect x="82" y="36" width="36" height="16" rx="4" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="100" cy="54" r="3" fill="#000" stroke={subtle} strokeWidth="0.8" />
          <circle cx="100" cy="54" r="1.2" fill={accent} opacity="0.9" />
          {(
            [
              [40, 30],
              [160, 30],
              [40, 58],
              [160, 58],
            ] as Array<[number, number]>
          ).map(([cx, cy], i) => (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx="14" ry="2" fill="#fff" opacity={active ? 0.18 : 0.1} />
              <ellipse cx={cx} cy={cy} rx="2" ry="14" fill="#fff" opacity={active ? 0.18 : 0.1} />
              <circle cx={cx} cy={cy} r="3" fill={fill} stroke={stroke} strokeWidth="0.8" />
              <circle cx={cx} cy={cy} r="1" fill={accent} opacity={accentOp} />
            </g>
          ))}
          <rect x="90" y="40" width="20" height="1.5" fill={accent} opacity={accentOp} />
        </g>
      )}

      {vehicle === "jet" && (
        <g>
          <rect x="4" y="42" width="22" height="3" rx="1.5" fill={accent} opacity={active ? 0.7 : 0.35} />
          <rect x="-2" y="43.5" width="14" height="1" fill="#fff" opacity={active ? 0.6 : 0.25} />
          <path d="M20,42 L150,38 L188,43.5 L150,49 L20,46 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M70,46 L130,46 L110,58 L60,58 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M80,42 L120,42 L138,30 L100,30 Z" fill={fill} stroke={stroke} strokeWidth="1" opacity="0.9" />
          <path d="M40,42 L60,28 L72,42 Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M130,40 L155,40.5 L168,43.5 L155,46 L130,45 Z" fill={glass} stroke={subtle} strokeWidth="0.6" />
          <line x1="100" y1="30" x2="138" y2="30" stroke={accent} strokeWidth="1.2" opacity={accentOp} />
          <line x1="60" y1="58" x2="110" y2="58" stroke={accent} strokeWidth="1.2" opacity={accentOp} />
          <circle cx="186" cy="43.5" r="1.4" fill={accent} opacity="0.9" />
        </g>
      )}
    </svg>
  );
}
