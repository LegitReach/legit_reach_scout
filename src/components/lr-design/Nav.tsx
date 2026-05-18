"use client";

import Link from "next/link";

const LINKS = [
  { href: "/invest", label: "Invest" },
  { href: "/building", label: "Building" },
  { href: "/team", label: "Team" },
];

export default function Nav({ current }: { current?: string }) {
  return (
    <div
      className="px-6 md:px-12 lg:px-16 pt-6"
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
          className="text-2xl font-semibold tracking-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          LegitReach
        </Link>
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
        <a href="mailto:manthan@legitreach.com" className="lr-btn-nav">
          Start a Chat
        </a>
      </nav>
    </div>
  );
}
