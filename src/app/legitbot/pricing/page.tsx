import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, SectionIntro, StatusTag } from "@/components/legitbot/LegitBotFrame";
import styles from "@/components/legitbot/legitbot.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free, Premium, and Elite plans for matches, alerts, and API use.",
  alternates: { canonical: "/legitbot/pricing" },
};

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Try LegitBot.",
    features: ["3 match proposals / month", "Watch 3 companies", "Critical alerts + daily digest", "100 API credits / month", "Standard human review"],
    href: "/legitbot/checkout?plan=free",
  },
  {
    name: "Premium",
    price: "$99",
    description: "For active users.",
    features: ["15 match proposals / month", "Watch 25 companies", "Critical alerts + daily digest", "10,000 API credits / month", "CSV exports", "Priority human review"],
    href: "/legitbot/checkout?plan=premium",
    featured: true,
  },
  {
    name: "Elite",
    price: "$499",
    description: "For heavy use.",
    features: ["50 match proposals / month", "Unlimited company watches", "Critical alerts + daily digest", "100,000 API credits / month", "CSV, JSON + Parquet exports", "Highest human-review priority"],
    href: "/legitbot/checkout?plan=elite",
  },
];

const rows = [
  ["Match proposals / month", "3", "15", "50"],
  ["Watched companies", "3", "25", "Unlimited"],
  ["Included API credits", "100", "10,000", "100,000"],
  ["Exports", "—", "CSV", "CSV, JSON, Parquet"],
  ["Human review", "Standard", "Priority", "Highest"],
];

export default function PricingPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHero}>
        <Eyebrow>MONTHLY · CANCEL ANYTIME</Eyebrow>
        <h1>Simple plans.<br />Clear limits.</h1>
        <p className={styles.pageLead}>
          All plans include matches, company watches, X alerts, and API credits. Checkout
          opens when Stripe is ready.
        </p>
      </header>

      <section className={styles.section} aria-label="LegitBot plans">
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <article className={`${styles.planCard} ${plan.featured ? styles.planCardFeatured : ""}`} key={plan.name}>
              <div className={styles.planTop}>
                <span className={styles.planName}>{plan.name}</span>
                {plan.featured ? <StatusTag>Core plan</StatusTag> : null}
              </div>
              <p className={styles.planPrice}>{plan.price}{plan.price !== "$0" ? <span> / month</span> : null}</p>
              <p className={styles.planDescription}>{plan.description}</p>
              <ul className={styles.featureList}>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className={plan.featured ? styles.primaryLink : styles.secondaryLink} href={plan.href}>
                CHOOSE {plan.name.toUpperCase()}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro eyebrow="COMPARE" title="What you get." />
        <div className={styles.tableWrap}>
          <table className={styles.comparisonTable}>
            <thead><tr><th scope="col">Entitlement</th><th scope="col">Free</th><th scope="col">Premium</th><th scope="col">Elite</th></tr></thead>
            <tbody>{rows.map(([label, free, premium, elite]) => <tr key={label}><td>{label}</td><td>{free}</td><td>{premium}</td><td>{elite}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro
          eyebrow="PREPAID API CREDITS"
          title="Buy more API credits."
          description="Paid credits do not expire. We use monthly credits first. A low balance stops the request with HTTP 402."
        />
        <div className={styles.creditPacks}>
          <div className={styles.creditPack}><strong>$10</strong><span>1,000 credits</span></div>
          <div className={styles.creditPack}><strong>$25</strong><span>3,000 credits</span></div>
          <div className={styles.creditPack}><strong>$75</strong><span>10,000 credits</span></div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro eyebrow="QUESTIONS" title="No overage fees." />
        <div className={styles.faqList}>
          <details className={styles.faqItem}><summary>What is a match proposal?</summary><p>One human-approved person offered to you. We make an intro only when both people say yes.</p></details>
          <details className={styles.faqItem}><summary>What do API calls cost?</summary><p>A lookup or page is 1 credit. Search or grouped data is 5. An AI summary is 10. An export is at least 10, plus 1 per 100 rows.</p></details>
          <details className={styles.faqItem}><summary>Do you charge overages?</summary><p>No. A low balance returns HTTP 402 with a link to buy credits.</p></details>
          <details className={styles.faqItem}><summary>Is this investment advice?</summary><p>No. Company facts are sourced and not personal. They do not tell you to buy, sell, or hold.</p></details>
        </div>
      </section>
    </div>
  );
}
