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

  // Hide on dashboard as it's integrated into the Sidebar
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/morning')) {
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
