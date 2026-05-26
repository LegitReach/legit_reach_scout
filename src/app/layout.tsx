import type { Metadata } from "next";
import Script from "next/script";
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
  title: "LegitReach | Search Engine for Community Managers",
  description: "Simple automations to manage your online community. Listen, research, respond, and report — all in one platform. Compound your brand voice without a single dollar in paid media.",
  openGraph: {
    title: "LegitReach | Search Engine for Community Managers",
    description: "Everything a community manager does to run a brand online: listen, research, respond, and report. Compound your brand voice without a single dollar in paid media.",
    images: ["https://legitreach.com/og-image.png"],
    url: "https://legitreach.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegitReach | Search Engine for Community Managers",
    description: "Simple automations to manage your online community. Listen, research, respond, and report. Zero ad spend.",
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
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NF21FQVYWS"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NF21FQVYWS');
          `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wwyx1t8jb4");
          `}
        </Script>
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
