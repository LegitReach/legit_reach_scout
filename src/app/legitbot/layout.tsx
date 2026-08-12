import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LegitBotFrame } from "@/components/legitbot/LegitBotFrame";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.legitreach.com"),
  title: {
    default: "LegitBot | Space, Connected",
    template: "%s | LegitBot",
  },
  description: "Meet space people and track space data through X.",
  alternates: {
    canonical: "/legitbot",
  },
  openGraph: {
    title: "LegitBot | Space, Connected",
    description: "Meet space people and track space data through X.",
    url: "/legitbot",
    siteName: "LegitReach",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "LegitReach" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LegitBot | Space, Connected",
    description: "Meet space people and track space data through X.",
    creator: "@get_LegitReach",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function LegitBotLayout({ children }: { children: ReactNode }) {
  return <LegitBotFrame>{children}</LegitBotFrame>;
}
