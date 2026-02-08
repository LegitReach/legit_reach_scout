"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import styles from "./Sidebar.module.css";

const navItems = [
    { href: "/dashboard", icon: "🔍", label: "Opportunities" },
    { href: "/morning", icon: "☀️", label: "Morning Brief" },
    { href: "/onboarding", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { resetOnboarding } = useApp();

    const handleReset = () => {
        resetOnboarding();
        router.push("/onboarding");
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <Link href="/dashboard" className={styles.logo}>
                    <span className={styles.logoIcon}>🚀</span>
                    <span className={styles.logoText}>LegitReach</span>
                </Link>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${pathname === item.href ? styles.active : ""
                            }`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.footer}>
                <div className={styles.info}>
                    <span className={styles.badge}>MCP Powered</span>
                    <p className={styles.hint}>No login required</p>
                </div>
                <button onClick={handleReset} className={styles.resetBtn}>
                    <span>🔄</span>
                    <span>Reset Setup</span>
                </button>
            </div>
        </aside>
    );
}
