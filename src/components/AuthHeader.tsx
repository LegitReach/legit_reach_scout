"use client";

import {
  SignInButton,
  SignOutButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import styles from "./AuthHeader.module.css";

export default function AuthHeader() {
  const pathname = usePathname();

  // Hide on home page, dashboard, and terminal as they have custom navs
  if (pathname === '/' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/morning') || pathname?.startsWith('/terminal') || pathname?.startsWith('/a16z') || pathname?.startsWith('/invest') || pathname?.startsWith('/building') || pathname?.startsWith('/pricing') || pathname?.startsWith('/policy')) {
    return null;
  }

  return (
    <div className={styles.header}>
      <SignedIn>
        <UserButton />
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </div>
  );
}
