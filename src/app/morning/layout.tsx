"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Sidebar from "@/components/Sidebar";
import styles from "../dashboard/layout.module.css";

export default function MorningLayout({ children }: { children: React.ReactNode }) {
    const { onboarding } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!onboarding.completed && typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (!path.includes('/onboarding')) {
                router.push("/onboarding");
            }
        }
    }, [onboarding.completed, router]);

    return (
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.content}>{children}</div>
            </main>
        </div>
    );
}
