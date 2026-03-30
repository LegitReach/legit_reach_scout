"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { WaitlistExperience } from "@/components/ui/waitlist-landing-page-with-countdown-timer";
import {
  SignInButton,
  UserButton,
  SignedIn,
  SignedOut,
  useAuth
} from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect } from "react";
import posthog from "posthog-js";

export default function Home() {
  const router = useRouter();
  const { onboarding, isAppLoaded } = useApp();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn && isAppLoaded && onboarding.completed) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, isAppLoaded, onboarding.completed, router]);
  return (
    <div className="relative min-h-screen">
      {/* Absolute Header for Login/Dashboard Access */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex items-center gap-4">
        <SignedOut>
          <Link
            href="/"
            className="text-sm font-medium text-primary-foreground bg-primary hover:brightness-110 px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(114,227,173,0.3)] hover:shadow-[0_0_25px_rgba(114,227,173,0.5)]"
            onClick={() => {
              posthog.capture("try_for_free_clicked");
              // Scroll to scan input
              const input = document.querySelector('input[placeholder*="Enter your store URL"]');
              input?.scrollIntoView({ behavior: 'smooth' });
              (input as HTMLInputElement)?.focus();
            }}
          >
            Start for Free
          </Link>
          <SignInButton mode="modal">
            <button
              className="text-sm font-medium text-foreground/70 hover:text-foreground px-4 py-2 rounded-full border border-border hover:border-primary bg-card/40 backdrop-blur-md transition-all"
              onClick={() => posthog.capture("sign_in_clicked")}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-foreground/90 hover:text-foreground px-4 py-2 rounded-full border border-primary/30 hover:border-primary bg-primary/10 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(114,227,173,0.1)] hover:shadow-[0_0_20px_rgba(114,227,173,0.3)] mr-2"
          >
            Go to Dashboard
          </Link>
          <UserButton />
        </SignedIn>
      </div>

      {/* Main Waitlist Experience Component */}
      <WaitlistExperience />
    </div>
  );
}
