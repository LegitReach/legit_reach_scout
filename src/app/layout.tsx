import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";
import AuthHeader from "@/components/AuthHeader";
import "./globals.css";
import { CSPostHogProvider, PostHogPageView } from "@/providers/posthog";
import { Suspense } from "react";
import { RealtimeProvider } from "@/providers/RealtimeProvider";

export const metadata: Metadata = {
  title: "LegitReach | Find Your Ideal Customer Insights on Reddit",
  description: "Your AI agent finds what ecommerce customers actually say on Reddit. Pain points, product wishes, competitor complaints. Build what sells. Free to start.",
  openGraph: {
    title: "LegitReach | Find Your Ideal Customer Insights on Reddit",
    description: "An AI agent that thinks like your ideal customer. It scans Reddit daily to surface real buying signals, pain points, and product feedback for ecommerce brands.",
    images: ["https://legitreach.com/og-image.png"],
    url: "https://legitreach.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegitReach | Find Your Ideal Customer Insights on Reddit",
    description: "AI finds what your ecommerce customers actually say on Reddit. Pain points. Product wishes. Competitor complaints. Free.",
    images: ["https://legitreach.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Logo%20Initials%20LegitReach.png" type="image/png" />
      </head>
      <body>
        <CSPostHogProvider>
          <ClerkProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <AppProvider>
              <RealtimeProvider>
                <AuthHeader />
                {children}
              </RealtimeProvider>
            </AppProvider>
          </ClerkProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
