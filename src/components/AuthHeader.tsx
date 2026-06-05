"use client";

import { UserButton, SignedIn } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import styles from "./AuthHeader.module.css";

export default function AuthHeader() {
  const pathname = usePathname();

  // morning/terminal/a16z/invest have custom navs
  if (pathname?.startsWith('/morning') || pathname?.startsWith('/terminal') || pathname?.startsWith('/a16z') || pathname?.startsWith('/invest')) {
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
