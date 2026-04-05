import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";
import AuthHeader from "@/components/AuthHeader";
import "./globals.css";
import { CSPostHogProvider, PostHogPageView } from "@/providers/posthog";
import { Suspense } from "react";
import { RealtimeProvider } from "@/providers/RealtimeProvider";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LegitReach | E-Commerce Management System",
  description: "A Bloomberg-style terminal for your ecommerce brand. AI agents for Reddit engagement, brand intelligence, and growth — all in one dashboard. Free to start.",
  openGraph: {
    title: "LegitReach | E-Commerce Management System",
    description: "A Bloomberg-style EMS terminal that connects your brand data, scans Reddit for opportunities, and delivers real-time brand intelligence. Built for modern ecommerce.",
    images: ["https://legitreach.com/og-image.png"],
    url: "https://legitreach.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegitReach | E-Commerce Management System",
    description: "Bloomberg-style terminal for your ecommerce brand. AI agents, brand intelligence, and growth tools. Free.",
    images: ["https://legitreach.com/og-image.png"],
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
