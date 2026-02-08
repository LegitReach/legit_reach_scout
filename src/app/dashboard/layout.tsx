"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { onboarding } = useApp();
    const router = useRouter();

    useEffect(() => {
        // Redirect to onboarding if not completed
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
