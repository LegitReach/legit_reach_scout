"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Eyebrow, StatusTag } from "./LegitBotFrame";
import styles from "./legitbot.module.css";

const areas = [
  { title: "Member review", body: "Approve consented profiles. Members can fix facts from public X data.", meta: "PROFILE APPROVAL" },
  { title: "Match review", body: "Check needs, fit, blocks, and plan limits before members see a match.", meta: "HUMAN REVIEW" },
  { title: "Public drafts", body: "Approve, edit, or reject posts and replies. This preview cannot post.", meta: "OWNER APPROVAL" },
  { title: "Safety", body: "Send reports, blocks, ID conflicts, data warnings, and abuse to a human.", meta: "RESTRICTED" },
  { title: "Service health", body: "Check X, jobs, email, billing, AI, and data sources when live.", meta: "STATUS" },
  { title: "Audit log", body: "Log short-lived approval commands and operator acts. Keep message text out of analytics.", meta: "AUDIT" },
];

export function AdminAccess() {
  return (
    <>
      <SignedOut>
        <section className={styles.gatePanel}>
          <Eyebrow>RESTRICTED</Eyebrow>
          <h1>Operator sign-in.</h1>
          <p>Only approved LegitReach operators may enter. Sign-in alone is not enough. The server allowlist must also approve you.</p>
          <SignInButton mode="modal">
            <button className={styles.primaryButton} style={{ marginTop: "1.5rem" }} type="button">SIGN IN</button>
          </SignInButton>
        </section>
      </SignedOut>
      <SignedIn>
        <div className={styles.pageContainer}>
          <header className={styles.pageHero}>
            <div className={styles.adminHeader}>
              <div>
                <Eyebrow>OPERATOR CONSOLE · PREVIEW</Eyebrow>
                <h1>Review work.</h1>
                <p className={styles.pageLead}>Review members, matches, drafts, and logs. Use human replies until X API access is ready.</p>
              </div>
              <StatusTag>No production data connected</StatusTag>
            </div>
          </header>
          <section className={styles.section}>
            <div className={styles.adminGrid}>
              {areas.map((area) => <article className={styles.adminCard} key={area.title}><h2>{area.title}</h2><p>{area.body}</p><div className={styles.adminMeta}><span>{area.meta}</span><span>NOT CONNECTED</span></div></article>)}
            </div>
          </section>
        </div>
      </SignedIn>
    </>
  );
}
