import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "Terms of Service", description: "Pre-launch terms for LegitBot membership, introductions, monitoring, billing, and API usage.", alternates: { canonical: "/legitbot/legal/terms" } };

export default function TermsPage() {
  return <LegalPage title="Terms of service" summary="Draft rules for LegitBot. You must accept the final terms at sign-up or checkout." sections={[
    { title: "Who may use it", body: <><p>You must be 18+, able to make a binding deal, and give true facts. Your member record uses your fixed X user ID. You are responsible for your account, verified email, and API keys.</p></> },
    { title: "What we offer", body: <><p>LegitBot may offer X help, human-checked matches, two-way opt-in email intros, company watches, alerts, space facts, exports, and API access. Beta features and sources may change.</p><p>We do not promise a match, reply, meeting, deal, or always-on data. We never speak for a member or bind them.</p></> },
    { title: "Fair use", body: <><p>Do not harass, lie, discriminate, spam, avoid blocks, find protected traits, breach privacy or IP rights, attack security, resell blocked data, or break X or source rules.</p><p>Do not send classified, private, ITAR, EAR, sanctions-controlled, or stolen data. Company facts are not investment advice.</p></> },
    { title: "Plans and credits", body: <><p>Free, Premium, and Elite are monthly. Plan limits reset each billing cycle. Paid API packs are prepaid and do not expire while the service runs. Monthly credits go first.</p><p>There are no postpaid overages. A low balance stops the call with HTTP 402. We show prices, tax, refunds, renewal, and cancel terms before Stripe payment.</p></> },
    { title: "Content and data", body: <><p>You keep rights to what you send. You give LegitReach only the rights needed for features you choose. Public data keeps its source rights, credits, and use limits. API access does not give you ownership or remove those limits.</p></> },
    { title: "Pause or end access", body: <><p>You may pause or end your plan. We may limit or stop access for abuse, safety risk, no payment, law, license changes, or a major breach. When practical, we will give notice and time to fix it.</p></> },
    { title: "Limits and risk", body: <><p>The beta and public data are offered “as available.” AI and source data may be late, incomplete, or wrong. Check key facts. After counsel review, final terms will cover warranties, liability, indemnity, law, disputes, and required consumer rights.</p></> },
  ]} />;
}
