"use client";

import {
  SignInButton,
  SignOutButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import styles from "./AuthHeader.module.css";

export default function AuthHeader() {
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
