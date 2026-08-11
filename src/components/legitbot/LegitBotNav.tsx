"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { TriangleMark } from "./TriangleMark";
import styles from "./legitbot.module.css";

const links = [
  { href: "/legitbot", label: "Overview" },
  { href: "/legitbot/pricing", label: "Pricing" },
  { href: "/legitbot/api", label: "Developers" },
  { href: "/legitbot/legal", label: "Trust" },
];

export function LegitBotNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="LegitBot navigation">
        <Link className={styles.brand} href="/legitbot" aria-label="LegitBot home">
          <TriangleMark className={styles.brandMark} />
          <span className={styles.brandParent}>LEGITREACH</span>
          <span className={styles.brandDivider} aria-hidden="true" />
          <span className={styles.brandProduct}>LEGITBOT</span>
        </Link>

        <button
          className={styles.menuButton}
          type="button"
          aria-expanded={open}
          aria-controls="legitbot-navigation-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>

        <div
          className={`${styles.navMenu} ${open ? styles.navMenuOpen : ""}`}
          id="legitbot-navigation-menu"
        >
          <div className={styles.navLinks}>
            {links.map((link) => {
              const active =
                link.href === "/legitbot"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);

              return (
                <Link
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  href={link.href}
                  key={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <a
            className={styles.navCta}
            href="https://x.com/get_LegitReach"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            DM ON X
            <span className={styles.externalArrow} aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
