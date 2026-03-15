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

  // Hide on home page and dashboard as it's integrated into the custom nav/sidebar
  if (pathname === '/' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/morning')) {
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
