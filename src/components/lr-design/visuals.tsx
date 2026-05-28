"use client";

import React, { useEffect, useRef, useState } from "react";

export function FadeIn({
  delay = 0,
  duration = 1000,
  children,
  className = "",
  style = {},
}: {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedHeading({
  text,
  className = "",
  style = {},
  highlights = [],
  highlightColor = "rgba(74, 222, 128, 0.55)",
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** Words to underline (case-insensitive, punctuation ignored). */
  highlights?: string[];
  /** Underline color for highlighted words. */
  highlightColor?: string;
}) {
  const [start, setStart] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStart(true), 200);
    return () => clearTimeout(t);
  }, [text]);
  const lines = text.split("\n");
  const charDelay = 30;
  const norm = (w: string) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const hlSet = new Set(highlights.map(norm));
  let gi = 0;
  return (
    <h1 className={className} style={{ letterSpacing: "-0.04em", ...style }}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {line.split(/(\s+)/).map((tok, ti) => {
            if (tok === "") return null;
            if (/^\s+$/.test(tok)) return <span key={ti}> </span>;
            const isHl = hlSet.has(norm(tok));
            return (
              <span
                key={ti}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  ...(isHl
                    ? {
                        borderBottom: `2px solid ${highlightColor}`,
                        paddingBottom: "0.04em",
                      }
                    : {}),
                }}
              >
                {Array.from(tok).map((ch, ci) => {
                  const d = gi * charDelay;
                  gi += 1;
                  return (
                    <span
                      key={ci}
                      style={{
                        display: "inline-block",
                        opacity: start ? 1 : 0,
                        transform: start ? "translateX(0)" : "translateX(-18px)",
                        transition: `opacity 500ms ease ${d}ms, transform 500ms ease ${d}ms`,
                        whiteSpace: "pre",
                      }}
                    >
                {ch === " " ? " " : ch}
              </span>
                  );
                })}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVis(true), delay);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      className={`reveal ${vis ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function DataPackets() {
  const packets = Array.from({ length: 18 }).map((_, i) => {
    const startX = (10 + i * 53) % 90;
    const startY = (55 + i * 17) % 35;
    const dx = (i % 2 === 0 ? 1 : -1) * (10 + (i * 7) % 25);
    const dy = -(8 + (i * 11) % 20);
    const dur = 5 + (i % 6);
    const delay = (i * 0.6) % 8;
    return { startX, startY, dx, dy, dur, delay, i };
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {packets.map((p) => (
        <div
          key={p.i}
          style={{
            position: "absolute",
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            width: 4,
            height: 4,
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
            ["--dx" as string]: `${p.dx}vw`,
            ["--dy" as string]: `${p.dy}vh`,
            animation: `lr-pulse-dot ${p.dur}s ease-in-out ${p.delay}s infinite`,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function DigitalDowntown() {
  return (
    <div className="scene">
      <div className="scene-bg" />
      <div className="scene-stars" />
      <div className="scene-floor" />
      <div className="scene-haze" />

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="lr-building" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0d0d" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <linearGradient id="lr-buildingFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#161616" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>

        <g opacity="0.45">
          {(
            [
              [0, 540, 90, 160], [90, 500, 60, 200], [150, 520, 80, 180],
              [230, 480, 70, 220], [300, 530, 100, 170], [400, 470, 60, 230],
              [460, 510, 90, 190], [550, 460, 70, 240], [620, 500, 80, 200],
              [700, 490, 70, 210], [770, 520, 110, 180], [880, 470, 80, 230],
              [960, 510, 70, 190], [1030, 480, 90, 220], [1120, 520, 80, 180],
              [1200, 470, 100, 230], [1300, 500, 70, 200], [1370, 530, 90, 170],
              [1460, 490, 80, 210], [1540, 520, 60, 180],
            ] as Array<[number, number, number, number]>
          ).map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="url(#lr-building)" />
          ))}
        </g>

        <g opacity="0.85">
          {(
            [
              [-20, 470, 110, 240], [90, 430, 80, 280], [170, 460, 130, 250],
              [300, 410, 90, 300], [390, 450, 110, 260], [500, 400, 80, 310],
              [580, 440, 120, 270], [700, 420, 90, 290], [790, 460, 110, 250],
              [900, 410, 100, 300], [1000, 440, 130, 270], [1130, 420, 90, 290],
              [1220, 460, 110, 250], [1330, 410, 100, 300], [1430, 440, 90, 270],
              [1520, 470, 110, 240],
            ] as Array<[number, number, number, number]>
          ).map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="url(#lr-building)" />
          ))}
          {Array.from({ length: 220 }).map((_, i) => {
            const x = 20 + (i * 73) % 1560;
            const y = 470 + (i * 37) % 240;
            const op = 0.15 + ((i * 13) % 70) / 100;
            return <rect key={i} x={x} y={y} width={3} height={3} fill="#ffffff" opacity={op} />;
          })}
        </g>

        {/* central hero building */}
        <g>
          <rect x={720} y={300} width={180} height={500} fill="url(#lr-buildingFront)" />
          <rect x={720} y={300} width={180} height={4} fill="#fff" opacity="0.25" />
          <rect x={805} y={230} width={10} height={70} fill="url(#lr-buildingFront)" />
          <rect x={808} y={210} width={4} height={20} fill="#fff" opacity="0.4" />
          {Array.from({ length: 14 }).map((_, r) =>
            Array.from({ length: 7 }).map((__, c) => {
              const x = 735 + c * 22;
              const y = 320 + r * 32;
              const seed = r * 7 + c;
              const on = seed % 5 === 0 || seed % 7 === 0;
              const flicker = seed % 13 === 0;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={x}
                  y={y}
                  width={10}
                  height={14}
                  fill="#ffffff"
                  opacity={on ? 0.55 : 0.08}
                  className={flicker ? `blink blink-${(seed % 4) + 1}` : ""}
                />
              );
            })
          )}
        </g>

        <g>
          <rect x={520} y={360} width={130} height={440} fill="url(#lr-buildingFront)" />
          <rect x={520} y={360} width={130} height={3} fill="#fff" opacity="0.18" />
          {Array.from({ length: 12 }).map((_, r) =>
            Array.from({ length: 5 }).map((__, c) => {
              const x = 535 + c * 22;
              const y = 380 + r * 32;
              const seed = r * 5 + c + 99;
              const on = seed % 4 === 0;
              const flicker = seed % 11 === 0;
              return (
                <rect
                  key={`b-${r}-${c}`}
                  x={x}
                  y={y}
                  width={10}
                  height={14}
                  fill="#fff"
                  opacity={on ? 0.5 : 0.08}
                  className={flicker ? `blink blink-${(seed % 4) + 1}` : ""}
                />
              );
            })
          )}
        </g>

        <g>
          <rect x={950} y={380} width={150} height={420} fill="url(#lr-buildingFront)" />
          <rect x={950} y={380} width={150} height={3} fill="#fff" opacity="0.18" />
          {Array.from({ length: 12 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => {
              const x = 965 + c * 22;
              const y = 400 + r * 30;
              const seed = r * 6 + c + 211;
              const on = seed % 4 === 0;
              const flicker = seed % 9 === 0;
              return (
                <rect
                  key={`c-${r}-${c}`}
                  x={x}
                  y={y}
                  width={10}
                  height={14}
                  fill="#fff"
                  opacity={on ? 0.55 : 0.08}
                  className={flicker ? `blink blink-${(seed % 4) + 1}` : ""}
                />
              );
            })
          )}
        </g>

        <g>
          <rect x={350} y={500} width={120} height={300} fill="url(#lr-buildingFront)" />
          <rect x={1140} y={490} width={120} height={310} fill="url(#lr-buildingFront)" />
          <rect x={1280} y={520} width={100} height={280} fill="url(#lr-buildingFront)" />
          <rect x={200} y={520} width={110} height={280} fill="url(#lr-buildingFront)" />
        </g>

        <rect x="0" y="540" width="1600" height="2" fill="#fff" opacity="0.12" />

        <g opacity="0.18">
          <line x1="810" y1="210" x2="810" y2="0" stroke="#fff" strokeWidth="1" />
          <line x1="585" y1="360" x2="585" y2="0" stroke="#fff" strokeWidth="0.7" />
          <line x1="1025" y1="380" x2="1025" y2="0" stroke="#fff" strokeWidth="0.7" />
        </g>
      </svg>

      <DataPackets />
    </div>
  );
}

export function Backdrop() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 95%, #0c0c0c 0%, #000 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "55%",
          background: `
            linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.75) 80%, #000 100%),
            repeating-linear-gradient(to right, rgba(255,255,255,0.05) 0 1px, transparent 1px 70px),
            repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px 70px)`,
          transform: "perspective(900px) rotateX(64deg)",
          transformOrigin: "bottom",
          opacity: 0.7,
        }}
      />
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.5,
        }}
      >
        <defs>
          <linearGradient id="lr-bld" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e0e0e" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>
        {(
          [
            [0, 640, 110, 200], [110, 600, 70, 240], [180, 620, 120, 220], [300, 580, 80, 260],
            [380, 610, 110, 230], [490, 570, 90, 270], [580, 600, 130, 240], [710, 580, 80, 260],
            [790, 620, 110, 220], [900, 580, 90, 260], [990, 610, 130, 230], [1120, 590, 80, 250],
            [1200, 620, 110, 220], [1310, 580, 90, 260], [1400, 610, 130, 230], [1530, 640, 90, 200],
          ] as Array<[number, number, number, number]>
        ).map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="url(#lr-bld)" />
        ))}
        {Array.from({ length: 120 }).map((_, i) => {
          const x = 20 + (i * 97) % 1560;
          const y = 600 + (i * 37) % 240;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={2}
              height={2}
              fill="#fff"
              opacity={0.2 + (i % 5) * 0.07}
            />
          );
        })}
        <rect x="0" y="640" width="1600" height="1" fill="#fff" opacity="0.08" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
