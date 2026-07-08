import type { Metadata } from "next";
import SiphoApp from "../SiphoApp";

export const metadata: Metadata = {
  title: "Data-Center Sim | LegitReach",
  description:
    "A simple interactive simulator for first-time AI data-center planning across racks, accelerators, switches, optics, power, and bandwidth.",
};

export default function Page() {
  return <SiphoApp />;
}
