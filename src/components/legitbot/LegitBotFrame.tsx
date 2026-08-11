import Link from "next/link";
import type { ReactNode } from "react";
import { ConsentBanner } from "./ConsentBanner";
import { LegitBotNav } from "./LegitBotNav";
import { TriangleMark } from "./TriangleMark";
import styles from "./legitbot.module.css";

export function OrbitalBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.starLayerOne} />
      <div className={styles.starLayerTwo} />
      <svg className={styles.orbits} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M-140 640 C 220 40, 1010 10, 1570 490" />
        <path d="M-90 760 C 370 250, 1030 180, 1550 690" />
        <circle cx="1190" cy="160" r="96" />
        <circle cx="1190" cy="160" r="4" className={styles.orbitNode} />
        <circle cx="210" cy="695" r="4" className={styles.orbitNode} />
      </svg>
    </div>
  );
}

export function LegitBotFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.siteShell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <OrbitalBackdrop />
      <LegitBotNav />
      <main className={styles.main} id="main-content">
        {children}
      </main>
      <Footer />
      <ConsentBanner />
    </div>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <TriangleMark className={styles.footerMark} />
        <div>
          <p>LEGITREACH · LEGITBOT</p>
          <span>Space, connected.</span>
        </div>
      </div>
      <div className={styles.footerLinks}>
        <Link href="/legitbot/pricing">Pricing</Link>
        <Link href="/legitbot/api">Developers</Link>
        <Link href="/legitbot/legal">Legal</Link>
        <a href="mailto:privacy@legitreach.com">Privacy</a>
        <a href="https://x.com/get_LegitReach" target="_blank" rel="noreferrer">
          @get_LegitReach
        </a>
      </div>
      <p className={styles.footerFinePrint}>
        © {new Date().getFullYear()} LegitReach. Facts only, not investment advice.
        Counsel must review final policies.
      </p>
    </footer>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className={styles.sectionIntro}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function StatusTag({ children }: { children: ReactNode }) {
  return (
    <span className={styles.statusTag}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}
