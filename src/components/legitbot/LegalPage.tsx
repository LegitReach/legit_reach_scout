import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "./LegitBotFrame";
import styles from "./legitbot.module.css";

export type LegalSection = {
  title: string;
  body: ReactNode;
};

export function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <article className={styles.legalPage}>
      <header className={styles.legalHeader}>
        <Eyebrow>DRAFT · AUGUST 10, 2026</Eyebrow>
        <h1>{title}</h1>
        <p>{summary}</p>
        <div className={styles.legalNotice}>
          <strong>Pre-launch draft.</strong> Counsel must review the final policy before launch.
        </div>
      </header>

      <div className={styles.legalGrid}>
        <aside className={styles.legalAside} aria-label="Legal navigation">
          <Link href="/legitbot/legal">All policies</Link>
          <Link href="/legitbot/legal/privacy">Privacy</Link>
          <Link href="/legitbot/legal/terms">Terms</Link>
          <Link href="/legitbot/legal/ai-disclosure">AI disclosure</Link>
          <Link href="/legitbot/legal/data-license">Data licensing</Link>
          <Link href="/legitbot/legal/subprocessors">Subprocessors</Link>
          <Link href="/legitbot/legal/financial-information">Financial information</Link>
          <Link href="/legitbot/legal/export-controls">Export controls</Link>
        </aside>
        <div className={styles.legalBody}>
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <div>{section.body}</div>
            </section>
          ))}
          <section>
            <h2>Questions</h2>
            <div>
              <p>
                Privacy: <a href="mailto:privacy@legitreach.com">privacy@legitreach.com</a>.{" "}
                Legal: <a href="mailto:legal@legitreach.com">legal@legitreach.com</a>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
