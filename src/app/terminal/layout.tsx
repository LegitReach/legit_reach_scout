"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@clerk/nextjs";

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { onboarding, isAppLoaded } = useApp();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Must be signed in for terminal
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    // Must have completed onboarding
    if (isAppLoaded && !onboarding.completed) {
      router.push("/onboarding");
    }
  }, [isLoaded, isSignedIn, isAppLoaded, onboarding.completed, router]);

  // Full-screen terminal — no sidebar wrapper
  return <>{children}</>;
}
