import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, StatusTag } from "@/components/legitbot/LegitBotFrame";
import styles from "@/components/legitbot/legitbot.module.css";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Select a LegitBot membership plan.",
  robots: { index: false, follow: false },
};

const planDetails = {
  free: { name: "Free", price: "$0", credits: "100 API credits", matches: "3 match proposals / month" },
  premium: { name: "Premium", price: "$99 / month", credits: "10,000 API credits", matches: "15 match proposals / month" },
  elite: { name: "Elite", price: "$499 / month", credits: "100,000 API credits", matches: "50 match proposals / month" },
} as const;

type PlanKey = keyof typeof planDetails;

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const params = await searchParams;
  const selected: PlanKey = params.plan === "premium" || params.plan === "elite" ? params.plan : "free";
  const plan = planDetails[selected];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHero}>
        <Eyebrow>CHECKOUT</Eyebrow>
        <h1>Choose a plan.</h1>
        <p className={styles.pageLead}>Payments are off until Stripe, tax, and webhooks are ready.</p>
      </header>
      <section className={styles.section}>
        <div className={styles.checkoutLayout}>
          <div className={styles.checkoutCard}>
            <h2>Select a plan</h2>
            <div className={styles.checkoutOptions}>
              {(Object.keys(planDetails) as PlanKey[]).map((key) => (
                <Link className={`${styles.checkoutOption} ${selected === key ? styles.checkoutOptionActive : ""}`} href={`/legitbot/checkout?plan=${key}`} key={key} aria-current={selected === key ? "true" : undefined}>
                  <strong>{planDetails[key].name}</strong><span>{planDetails[key].price}</span>
                </Link>
              ))}
            </div>
          </div>
          <aside className={styles.checkoutCard} aria-label="Order summary">
            <StatusTag>Not live</StatusTag>
            <h2 style={{ marginTop: "1.2rem" }}>{plan.name}</h2>
            <p className={styles.planPrice}>{plan.price}</p>
            <ul className={styles.featureList}><li>{plan.matches}</li><li>{plan.credits}</li><li>Critical X alerts + daily digest</li></ul>
            <div className={styles.pendingCallout}>Checkout is off. We collect no payment details. DM LegitBot for the private beta.</div>
            <a className={styles.primaryLink} style={{ width: "100%", marginTop: "1rem" }} href="https://x.com/get_LegitReach" target="_blank" rel="noreferrer">DM LEGITBOT ON X ↗</a>
          </aside>
        </div>
      </section>
    </div>
  );
}
