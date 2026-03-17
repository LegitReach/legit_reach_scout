"use client";

import { WaitlistExperience } from "@/components/ui/waitlist-landing-page-with-countdown-timer";
import {
  SignInButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import posthog from "posthog-js";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Absolute Header for Login/Dashboard Access */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex items-center gap-4">
        <SignedOut>
          <Link
            href="/onboarding"
            className="text-sm font-medium text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
            onClick={() => posthog.capture("try_for_free_clicked")}
          >
            Start for Free
          </Link>
          <SignInButton mode="modal">
            <button
              className="text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-full border border-white/10 hover:border-white/30 bg-black/40 backdrop-blur-md transition-all"
              onClick={() => posthog.capture("sign_in_clicked")}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white/90 hover:text-white px-4 py-2 rounded-full border border-green-500/30 hover:border-green-500 bg-green-500/10 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] mr-2"
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
