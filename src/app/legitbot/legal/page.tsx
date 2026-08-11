import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/legitbot/LegitBotFrame";
import styles from "@/components/legitbot/legitbot.module.css";

export const metadata: Metadata = {
  title: "Trust & Legal",
  description: "LegitBot privacy, terms, AI, data, vendors, finance, and export rules.",
  alternates: { canonical: "/legitbot/legal" },
};

const policies = [
  ["Privacy notice", "What we use, why, how long, and your rights.", "/legitbot/legal/privacy"],
  ["Terms of service", "Rules for matches, alerts, billing, and API use.", "/legitbot/legal/terms"],
  ["AI disclosure", "What Gemini does, what people decide, and AI limits.", "/legitbot/legal/ai-disclosure"],
  ["Data-license policy", "How source rights control data use.", "/legitbot/legal/data-license"],
  ["Subprocessors", "Vendors that help run LegitBot.", "/legitbot/legal/subprocessors"],
  ["Financial information", "Company facts are not investment advice.", "/legitbot/legal/financial-information"],
  ["Export controls", "Do not share classified, private, ITAR, or EAR data.", "/legitbot/legal/export-controls"],
];

export default function LegalHubPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHero}>
        <Eyebrow>DRAFT · COUNSEL REVIEW NEEDED</Eyebrow>
        <h1>Rules and privacy.</h1>
        <p className={styles.pageLead}>These drafts cover consent, data rights, and human review. Counsel must approve them before launch.</p>
      </header>
      <section className={styles.section}>
        <div className={styles.policyGrid}>
          {policies.map(([title, body, href]) => (
            <article className={styles.policyCard} key={href}>
              <h2>{title}</h2><p>{body}</p><Link href={href}>READ →</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
