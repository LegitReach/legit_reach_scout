"use client";

import { UserButton, SignedIn } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import styles from "./AuthHeader.module.css";

export default function AuthHeader() {
  const pathname = usePathname();

  // Hide on home page, dashboard, and terminal as they have custom navs
  if (
    pathname === '/' ||
    pathname === '/cpo' ||
    pathname?.startsWith('/cpo/model') ||
    pathname?.startsWith('/cpo/tetration') ||
    pathname?.startsWith('/cpo/scout') ||
    pathname?.startsWith('/cpo/a16z') ||
    pathname?.startsWith('/cpo/invest') ||
    pathname?.startsWith('/cpo/building') ||
    pathname?.startsWith('/cpo/pricing') ||
    pathname?.startsWith('/cpo/policy')
  ) {
    return null;
  }

  return (
    <div className={styles.header}>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
