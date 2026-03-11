"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import {
  SignInButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isWarm, setIsWarm] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [honeypot, setHoneypot] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  // Theme Logic
  useEffect(() => {
    const stored = localStorage.getItem("lr-theme") as "light" | "dark" | null;
    const initialTheme =
      stored ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("lr-theme", nextTheme);
  };

  // Form Logic (GoHighLevel Webhook)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (honeypot) {
      setMessage({ text: "You're on the list! We'll be in touch.", type: "success" });
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ text: "Please enter a valid email address.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const GHL_WEBHOOK_URL = "YOUR_GHL_WEBHOOK_URL";

    try {
      await fetch(GHL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          email: email,
          source: "legitreach-landing",
          timestamp: new Date().toISOString(),
          tags: ["early-access", "coming-soon"],
        }),
      });
      setMessage({
        text: "You're on the list! We'll be in touch soon.",
        type: "success",
      });
      setEmail("");
    } catch (error) {
      setMessage({
        text: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.container} ${isWarm ? styles.warmMode : ""}`}>
      {/* NAV */}
      <nav className={`${styles.nav} ${isMenuOpen ? styles.navActive : ""}`}>
        <div className={styles.innerContainer}>
          <div className={styles.navLeft}>
            <Link href="/" className={styles.logo}>
              <span>Legit</span>Reach
            </Link>

            <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksMobile : ""}`}>
              <div
                className={`${styles.dropdown} ${isProductsOpen ? styles.dropdownActive : ""}`}
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
                onClick={() => setIsProductsOpen(!isProductsOpen)}
              >
                <button className={styles.navLink}>
                  Products
                  <svg
                    className={`${styles.chevron} ${isProductsOpen ? styles.chevronRotated : ""}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className={styles.dropdownMenu}>
                  <Link href="/onboarding" className={styles.dropdownItem}>
                    <div className={styles.itemIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M2 12h20" />
                        <path d="M12 2l4 4-4 4" />
                      </svg>
                    </div>
                    <div className={styles.itemDetails}>
                      <span className={styles.itemName}>Pulse</span>
                      <p className={styles.itemDesc}>Automated AI prospect research</p>
                    </div>
                  </Link>
                </div>
              </div>
              <a href="#how-it-works" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>How it works</a>

              <div className={styles.mobileOnly}>
                <div className={styles.mobileDivider}></div>
                <div className={styles.mobileActions}>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className={styles.loginBtnMobile}>Sign in</button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard" className={styles.dashboardBtnMobile}>
                      Dashboard
                    </Link>
                  </SignedIn>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.navRight}>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <svg
                className={styles.iconMoon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <svg
                className={styles.iconSun}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </button>

            <div className={styles.navActions}>
              <div className={styles.authLinks}>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className={styles.loginBtn}>Sign in</button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className={styles.dashboardBtn}>
                    Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>

            <button
              className={`${styles.menuToggle} ${isMenuOpen ? styles.menuToggleActive : ""}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.innerContainer}>
          <div className={styles.heroGlow}></div>
          <h1>
            Outreach that feels like a{" "}
            <span className={styles.highlight}>warm introduction</span>
          </h1>
          <p>
            AI agents that research, personalize, and connect — so every
            touchpoint builds a real relationship, not a spam folder.
          </p>
        </div>
      </section>

      {/* TOGGLE SECTION */}
      <section className={styles.toggleSection}>
        <div className={styles.innerContainer}>
          <div className={styles.toggleWrapper}>
            <span
              className={`${styles.toggleLabel} ${styles.toggleLabelCold}`}
            >
              Cold Outreach
            </span>
            <button
              className={styles.toggleSwitch}
              onClick={() => setIsWarm(!isWarm)}
              role="switch"
              aria-checked={isWarm}
              aria-label="Switch between cold and warm outreach"
            >
              <span className={styles.toggleThumb}></span>
            </button>
            <span
              className={`${styles.toggleLabel} ${styles.toggleLabelWarm}`}
            >
              Warm Outreach
            </span>
          </div>

          <div className={styles.comparisonPanel}>
            {/* COLD PANEL */}
            <div
              className={`${styles.panel} ${styles.panelCold}`}
              id="coldPanel"
            >
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>The Cold Reality</span>
                  <span className={styles.statBadge}>~1% response rate</span>
                </div>
                <ul className={`${styles.featureList} ${styles.featureListNegative}`}>
                  <li>
                    <span className={styles.iconWrapper}>&times;</span> Generic
                    copy-paste templates sent to thousands
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&times;</span> Caught
                    by spam filters before anyone reads it
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&times;</span> Damages
                    your brand reputation over time
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&times;</span> People
                    hate receiving it — and they remember
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&times;</span> Burns
                    through prospect lists with zero ROI
                  </li>
                </ul>
                <p className={styles.analogy}>
                  "Junk mail for the digital age — spray and pray at scale."
                </p>
              </div>
            </div>

            {/* WARM PANEL */}
            <div
              className={`${styles.panel} ${styles.panelWarm}`}
              id="warmPanel"
            >
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>LegitReach Way</span>
                  <span className={styles.statBadge}>10-40% response rate</span>
                </div>
                <ul className={`${styles.featureList} ${styles.featureListPositive}`}>
                  <li>
                    <span className={styles.iconWrapper}>&check;</span> AI
                    agents research each prospect deeply before reaching out
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&check;</span> Every
                    message is crafted to feel genuinely personal
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&check;</span> Builds
                    your reputation as someone worth talking to
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&check;</span> People
                    appreciate the thoughtfulness — and respond
                  </li>
                  <li>
                    <span className={styles.iconWrapper}>&check;</span> Grows
                    relationships and lifetime customer value
                  </li>
                </ul>
                <p className={styles.analogy}>
                  "Like 3D-printing a personalized gift for every prospect."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.howSection} id="how-it-works">
        <div className={styles.innerContainer}>
          <h2>How it works</h2>
          <div className={styles.howGrid}>
            <div className={styles.howCard}>
              <div className={styles.howIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Tell us about your ICP</h3>
              <p>
                Describe your business and ideal customer profile. Our agents
                learn exactly who you should be talking to.
              </p>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>AI agents prospect</h3>
              <p>
                Our agents research prospects, understand their world, and find
                genuine reasons to connect.
              </p>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3>Warm conversations start</h3>
              <p>
                Personalized, frictionless outreach that starts real
                conversations and builds lasting relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / EMAIL CAPTURE */}
      <section className={styles.ctaSection}>
        <div className={styles.innerContainer}>
          <h2>Be first to send warm outreach</h2>
          <p className={styles.ctaDescription}>
            Join the early access list. We'll let you know when it's your turn.
          </p>
          <form
            id="earlyAccessForm"
            className={styles.emailForm}
            onSubmit={handleSubmit}
            noValidate
          >
            <div className={styles.formGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                aria-label="Email address"
              />
              <button type="submit" disabled={isSubmitting}>
                <span className={styles.btnText}>
                  {isSubmitting ? <span className={styles.btnLoader}></span> : "Get Early Access"}
                </span>
              </button>
            </div>
            {/* Honeypot */}
            <div className={styles.hpField} aria-hidden="true">
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            {message.text && (
              <p
                className={`${styles.formMessage} ${message.type === "success"
                  ? styles.formMessageSuccess
                  : styles.formMessageError
                  }`}
              >
                {message.text}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.innerContainer}>
          <p>&copy; 2025 LegitReach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
