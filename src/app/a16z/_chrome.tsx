"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export function TopBar({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack: () => void;
}) {
  const onDashboard = step > total;
  return (
    <div
      className="px-6 md:px-12 lg:px-16 pt-6"
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <div className="liquid-glass rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center" style={{ gap: "1rem" }}>
          <Link href="/" className="text-xl font-semibold" style={{ letterSpacing: "-0.03em" }}>
            LegitReach
          </Link>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
          <span className="text-xs uppercase tracking-widest" style={{ color: "#d1d5db" }}>
            CREATE AUTHENTIC CONTENT FOR COMMUNITY
          </span>
        </div>
        {!onDashboard && <Steps step={step} total={total} />}
        <div className="flex items-center" style={{ gap: "0.75rem" }}>
          {step > 1 && !onDashboard && (
            <button
              onClick={onBack}
              className="text-sm"
              style={{
                background: "transparent",
                color: "#d1d5db",
                transition: "color 200ms ease",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          )}
          <Link
            href={onDashboard ? "/beta" : "/"}
            className="text-sm"
            style={{ color: "#d1d5db", transition: "color 200ms ease" }}
          >
            {onDashboard ? "Sign out" : "Exit"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Steps({ step, total }: { step: number; total: number }) {
  return (
    <div className="hidden md:flex items-center" style={{ gap: "0.75rem" }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={i} className="flex items-center" style={{ gap: "0.5rem" }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.25)",
                background: done ? "#fff" : active ? "rgba(255,255,255,0.12)" : "transparent",
                color: done ? "#000" : active ? "#fff" : "rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {done ? "✓" : n}
            </div>
            {i < total - 1 && (
              <div
                style={{
                  width: 28,
                  height: 1,
                  background: done
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(255,255,255,0.15)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass rounded-2xl p-8"
        style={{
          border: "1px solid rgba(255,255,255,0.2)",
          width: "100%",
          maxWidth: "36rem",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-normal" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              fontSize: 20,
              lineHeight: 1,
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BackgroundIndexer({ compact = false }: { compact?: boolean }) {
  const [n, setN] = useState(3208451);
  useEffect(() => {
    const id = setInterval(
      () => setN((v) => v + Math.floor(Math.random() * 60) + 10),
      700
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="flex items-center liquid-glass rounded-full"
      style={{
        gap: "0.55rem",
        padding: "0.35rem 0.85rem",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#a5f3fc",
          boxShadow: "0 0 8px #a5f3fc",
          animation: "lr-pulse-soft 1.4s ease-in-out infinite",
        }}
      />
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: "#cffafe", letterSpacing: "0.15em" }}
      >
        Indexing
      </span>
      {!compact && (
        <span
          className="text-xs"
          style={{
            color: "#d1d5db",
            fontFamily: "ui-monospace, Menlo, Monaco, monospace",
            letterSpacing: "0.02em",
          }}
        >
          {n.toLocaleString()} posts seen
        </span>
      )}
    </div>
  );
}

function SkeletonRow({ height = 78 }: { height?: number }) {
  return (
    <div
      className="rounded-xl"
      style={{
        height,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          animation: "lr-shimmer 1.6s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          right: 16,
          height: 8,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 16,
          width: "70%",
          height: 10,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 16,
          width: "40%",
          height: 6,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

export function PanelLoading({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        className="flex items-center text-xs"
        style={{ gap: "0.5rem", marginBottom: "0.25rem", color: "#9ca3af" }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#a5f3fc",
            boxShadow: "0 0 6px #a5f3fc",
            animation: "lr-pulse-soft 1.4s ease-in-out infinite",
          }}
        />
        <span>{label}</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function LockIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.5"
      opacity="0.85"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
