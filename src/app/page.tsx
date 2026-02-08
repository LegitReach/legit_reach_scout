import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Background Glow */}
      <div className={styles.glow}></div>
      <div className={styles.glowSecondary}></div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🚀</span>
          <span className={styles.logoText}>LegitReach</span>
        </div>
        <Link href="/demo" className={styles.demoLink}>
          See Full Vision →
        </Link>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.badge}>No login required • Works instantly</div>
        <h1 className={styles.title}>
          Find Reddit Opportunities<br />
          <span className={styles.gradient}>Where Your Customers Hang Out</span>
        </h1>
        <p className={styles.subtitle}>
          Enter your keywords → Get relevant subreddits →
          Find discussions to engage with → Draft authentic replies.
        </p>
        <div className={styles.cta}>
          <Link href="/onboarding" className={styles.primaryBtn}>
            Start Finding Opportunities →
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>🎯</span>
          <h3>Keyword-Based Discovery</h3>
          <p>Enter what you're looking for, we find relevant communities automatically</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>💡</span>
          <h3>Opportunity Scoring</h3>
          <p>Each post shows why it's an opportunity and how to engage</p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📋</span>
          <h3>Draft & Track</h3>
          <p>Save opportunities, draft replies, and track what you've responded to</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Powered by Reddit MCP • No Reddit account needed</p>
      </footer>
    </div>
  );
}
