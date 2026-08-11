import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AuthHeader from "@/components/AuthHeader";
import "./globals.css";
import { CSPostHogProvider, PostHogPageView } from "@/providers/posthog";
import { Suspense } from "react";
import AnalyticsScripts from "@/components/AnalyticsScripts";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://legitreach.com"),
  title: {
    default: "LegitReach | Human-approved AI products",
    template: "%s | LegitReach",
  },
  description: "LegitReach builds human-approved AI products for community operations and the global space industry.",
  openGraph: {
    title: "LegitReach | Human-approved AI products",
    description: "Community operations and space-industry intelligence, with people in control.",
    images: ["/og-image.png"],
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegitReach | Human-approved AI products",
    description: "Community operations and space-industry intelligence, with people in control.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.className}>
      <head />
      <body>
        <AnalyticsScripts />
        <CSPostHogProvider>
          <ClerkProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
                <AuthHeader />
                {children}
          </ClerkProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
