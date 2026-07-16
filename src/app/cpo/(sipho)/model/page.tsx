import type { Metadata } from "next";
import SiphoApp from "../SiphoApp";

export const metadata: Metadata = {
  title: "SiPho Model | LegitReach",
  description:
    "Compatibility-first buying model for silicon optics teams validating speed, reach, protocol, connector, power, thermal envelope, host support, substitutes, and ordering path.",
};

export default function Page() {
  return <SiphoApp />;
}
