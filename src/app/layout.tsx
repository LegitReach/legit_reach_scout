import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";
import AuthHeader from "@/components/AuthHeader";
import "./globals.css";
import { CSPostHogProvider, PostHogPageView } from "@/providers/posthog";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "LegitReach - Reddit Opportunity Finder",
  description: "Find relevant Reddit discussions, track your outreach, and craft authentic replies that convert.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CSPostHogProvider>
          <ClerkProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <AppProvider>
              <AuthHeader />
              {children}
            </AppProvider>
          </ClerkProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
