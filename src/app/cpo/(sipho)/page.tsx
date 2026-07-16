import type { Metadata } from "next";
import SiphoApp from "./SiphoApp";

export const metadata: Metadata = {
  title: "LegitReach | Silicon Optics Intelligence",
  description:
    "Forbes like monthly-magazine for silicon optics. SiPho Model for enterprise teams moving from 200G to 1.6T optical fabrics.",
  openGraph: {
    title: "LegitReach | Silicon Optics Intelligence",
    description:
      "Forbes like monthly-magazine for silicon optics. SiPho Model for enterprise teams moving from 200G to 1.6T optical fabrics.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <SiphoApp />;
}
