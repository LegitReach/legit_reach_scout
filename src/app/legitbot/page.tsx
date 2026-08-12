import type { Metadata } from "next";
import Link from "next/link";
import {
  Eyebrow,
  SectionIntro,
  StatusTag,
} from "@/components/legitbot/LegitBotFrame";
import styles from "@/components/legitbot/legitbot.module.css";

export const metadata: Metadata = {
  title: { absolute: "LegitBot | Space, Connected" },
  description: "DM LegitBot on X to meet space people and track space news.",
  alternates: { canonical: "/legitbot" },
};

const connectionSteps = [
  {
    title: "Say what you need",
    body: "DM @get_LegitReach. Share what you need and what you can offer.",
  },
  {
    title: "Check your profile",
    body: "We use public X data only if you agree. Fix any fact before approval.",
  },
  {
    title: "Both people say yes",
    body: "A human checks each match. We share verified emails only after both people agree.",
  },
];

const trustItems = [
  {
    title: "Clear consent",
    body: "You choose service DMs, public X data use, matches, alerts, and email intros one by one.",
  },
  {
    title: "Your control",
    body: "Pause, fix, block, export, or delete. A like or follow never allows an automated DM.",
  },
  {
    title: "Licensed data",
    body: "Each dataset shows its source, date, rights, and credit. Unclear rights stay catalog-only.",
  },
];

export default function LegitBotHome() {
  return (
    <div className={styles.pageContainer}>
      <section className={styles.hero} aria-labelledby="legitbot-hero-title">
        <div className={styles.heroCopy}>
          <Eyebrow>X ONLY · HUMAN REVIEW · SPACE</Eyebrow>
          <h1 id="legitbot-hero-title">
            Meet people
            <em>in space.</em>
          </h1>
          <p className={styles.heroLead}>
            DM LegitBot on X. Find people, track companies, and use space data.
          </p>
          <div className={styles.heroActions}>
            <a
              className={styles.primaryLink}
              href="https://x.com/get_LegitReach"
              target="_blank"
              rel="noreferrer"
            >
              DM @GET_LEGITREACH <span aria-hidden="true">↗</span>
            </a>
            <Link className={styles.secondaryLink} href="/legitbot/pricing">
              VIEW PLANS
            </Link>
          </div>
          <div className={styles.heroMeta} aria-label="LegitBot product principles">
            <span>No LinkedIn</span>
            <span>No phone</span>
            <span>No unsolicited DMs</span>
          </div>
        </div>

        <div className={styles.signalPanel} aria-label="LegitBot connection sequence">
          <div className={styles.signalHeader}>
            <span>PRIVATE MATCH FLOW</span>
            <span className={styles.signalDot} aria-hidden="true" />
          </div>
          <div className={styles.signalSteps}>
            <div className={styles.signalStep}>
              <span>01</span><strong>You DM on X</strong><span aria-hidden="true" />
            </div>
            <div className={styles.signalStep}>
              <span>02</span><strong>Consent + profile</strong><span aria-hidden="true" />
            </div>
            <div className={styles.signalStep}>
              <span>03</span><strong>Human checks match</strong><span aria-hidden="true" />
            </div>
            <div className={styles.signalStep}>
              <span>04</span><strong>Both say yes</strong><span aria-hidden="true" />
            </div>
          </div>
          <div className={styles.signalFooter}>
            <span>LEGITBOT · @GET_LEGITREACH</span>
            <span>X ONLY</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro
          eyebrow="01 · MATCHES"
          title="Meet the right space person."
          description="Find founders, engineers, operators, researchers, investors, suppliers, and advisors. Fit comes from needs and offers, not follower count."
        />
        <div className={styles.threeColumnGrid}>
          {connectionSteps.map((step, index) => (
            <article className={styles.featureCard} key={step.title}>
              <span className={styles.cardNumber}>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro
          eyebrow="02 · DATA"
          title="Track space."
          description="Follow companies, launches, contracts, missions, orbits, and space weather. Stock prices stay out until we have resale rights."
        />
        <div className={styles.intelligencePanel}>
          <div className={styles.intelligenceCopy}>
            <StatusTag>Private beta</StatusTag>
            <h3>Facts with sources.</h3>
            <p>
              We review each company for real space work. Facts link to filings, company
              reports, agencies, and data we may share.
            </p>
          </div>
          <div className={styles.dataRows} aria-label="Planned data coverage">
            <div className={styles.dataRow}>
              <strong>Companies + events</strong><span>Filings, contracts, missions, rules, and operations</span><span className={styles.dataMode}>FACTS</span>
            </div>
            <div className={styles.dataRow}>
              <strong>Launches + orbits</strong><span>Schedules and allowed orbital data</span><span className={styles.dataMode}>SOURCED</span>
            </div>
            <div className={styles.dataRow}>
              <strong>Space weather</strong><span>NOAA and NASA data with source dates</span><span className={styles.dataMode}>CURRENT</span>
            </div>
            <div className={styles.dataRow}>
              <strong>One API</strong><span>Cursor pages, credit use, and source credit</span><span className={styles.dataMode}>V1</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro
          eyebrow="03 · CONTROL"
          title="You choose."
          description="Consent, human review, and data rights guide each step."
        />
        <div className={styles.threeColumnGrid}>
          {trustItems.map((item, index) => (
            <article className={styles.featureCard} key={item.title}>
              <span className={styles.cardNumber}>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.ctaBand}>
          <div>
            <Eyebrow>START ON X</Eyebrow>
            <h2>Who do you need to meet?</h2>
            <p>
              DM @get_LegitReach. A human replies until official X API access is ready.
              The same consent and review rules apply.
            </p>
          </div>
          <a
            className={styles.primaryLink}
            href="https://x.com/get_LegitReach"
            target="_blank"
            rel="noreferrer"
          >
            OPEN X <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </div>
  );
}
