"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  canRunAnalytics,
  LEGITBOT_ANALYTICS_CONSENT_EVENT,
} from "@/lib/analyticsConsent";

export default function AnalyticsScripts() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const nextAllowed = canRunAnalytics(pathname);
      const analyticsWindow = window as typeof window & {
        clarity?: (...args: unknown[]) => void;
        "ga-disable-G-NF21FQVYWS"?: boolean;
      };

      analyticsWindow["ga-disable-G-NF21FQVYWS"] = !nextAllowed;
      analyticsWindow.clarity?.("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: nextAllowed ? "granted" : "denied",
      });
      setAllowed(nextAllowed);
    };
    refresh();
    window.addEventListener(LEGITBOT_ANALYTICS_CONSENT_EVENT, refresh);
    return () => window.removeEventListener(LEGITBOT_ANALYTICS_CONSENT_EVENT, refresh);
  }, [pathname]);

  if (!allowed) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-NF21FQVYWS"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NF21FQVYWS', { anonymize_ip: true });
        `}
      </Script>
      <Script id="ms-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wwyx1t8jb4");
          window.clarity('consentv2', {
            ad_Storage: 'denied',
            analytics_Storage: 'granted'
          });
        `}
      </Script>
    </>
  );
}
