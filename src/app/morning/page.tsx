"use client";

import styles from "./morning.module.css";
import { useUser } from "@clerk/nextjs";

export default function MorningPage() {
  const { user } = useUser();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.page}>
      <header className={styles.newsletterHeader}>
        <h1>LegitReach</h1>
        <div className={styles.newsletterMeta}>
          <span>{today}</span>
          <span className={styles.divider}></span>
          <span>Vol. 1, Issue {new Date().getDate()}</span>
        </div>
      </header>

      <main className={styles.comingSoonContainer}>
        <div className={styles.v3Badge}>AI Morning Brief is Coming Soon in V3</div>
        <p className={styles.comingSoonText}>
          Hello, {user?.firstName || "Scout"}! We are yet to build the morning briefing experience
          to give you even deeper insights and automated AI outreach strategies.
        </p>
      </main>
    </div>
  );
}
