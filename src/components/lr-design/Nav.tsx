"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { SignInButton, SignedOut } from "@clerk/nextjs";

const LINKS = [
  { href: "/building", label: "Building" },
  { href: "/pricing", label: "Pricing" },
  { href: "/invest", label: "Invest" },
];

export default function Nav({ current }: { current?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className="px-4 sm:px-6 md:px-12 lg:px-16 pt-4 md:pt-6"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl md:text-2xl font-semibold tracking-tight"
          style={{ letterSpacing: "-0.03em" }}
          onClick={() => setOpen(false)}
        >
          LegitReach
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: "2rem" }}>
          {LINKS.map((l) => {
            const active = current === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="lr-nav-link"
                style={{
                  color: active ? "#fff" : "#9ca3af",
                  borderBottom: active
                    ? "1px solid rgba(255,255,255,0.6)"
                    : "1px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center" style={{ gap: "0.75rem" }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
              }}>
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <a href="mailto:manthan@legitreach.com" className="lr-btn-nav">
            Start a Chat
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            padding: "0.25rem",
            minWidth: 44,
            minHeight: 44,
          }}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="md:hidden liquid-glass rounded-xl"
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {LINKS.map((l) => {
            const active = current === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  color: active ? "#fff" : "#d1d5db",
                  fontSize: "1.125rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
          <SignedOut>
            <SignInButton mode="modal">
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginTop: "0.5rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  fontSize: "1.125rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <a
            href="mailto:manthan@legitreach.com"
            onClick={() => setOpen(false)}
            className="lr-btn-primary"
            style={{ textAlign: "center", marginTop: "0.5rem" }}
          >
            Start a Chat
          </a>
        </div>
      )}
    </div>
  );
}
