import type { ReactNode } from "react";
import styles from "../dashboard.module.css";

export function StepCard({
  num, status, title, desc, children,
}: {
  num: number;
  status: "complete" | "active" | "idle";
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.stepCard} ${styles[`step_${status}`]}`}>
      <div className={styles.stepCardHead}>
        <div className={`${styles.stepIcon} ${styles[`stepIcon_${status}`]}`}>
          {status === "complete" ? "✓" : num}
        </div>
        <div className={styles.stepMeta}>
          <div className={styles.stepRow}>
            <span className={styles.stepLabel}>Step {num}</span>
            {status !== "idle" && (
              <span className={`${styles.statusBadge} ${styles[`badge_${status}`]}`}>
                {status === "complete" ? "Complete" : "Active"}
              </span>
            )}
          </div>
          <div className={styles.stepTitle}>{title}</div>
          <div className={styles.stepDesc}>{desc}</div>
        </div>
      </div>
      <div className={styles.stepBody}>{children}</div>
    </div>
  );
}
