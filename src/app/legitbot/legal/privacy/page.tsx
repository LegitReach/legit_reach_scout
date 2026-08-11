import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "Privacy Notice", description: "How LegitBot handles member, conversation, account, and usage data.", alternates: { canonical: "/legitbot/legal/privacy" } };

export default function PrivacyPage() {
  return <LegalPage title="Privacy notice" summary="How LegitBot uses personal data for X, matches, alerts, email, billing, and API access." sections={[
    { title: "Who this covers", body: <><p>LegitBot is for adults 18+ worldwide in English. LegitReach controls member data unless a final contract says otherwise.</p><p>We do not sell contact, profile, relationship, or chat data in our space-data product.</p></> },
    { title: "Data we use", body: <><ul><li>X user ID, handle, profile, inbound DMs, consent, blocks, and account state.</li><li>Your role, group, sectors, place, timezone, needs, offers, free time, and intro choices.</li><li>With separate consent: your X bio, linked profile, and up to 25 public posts from the past 90 days.</li><li>After an accepted match: email and intro thread. We also use billing, API, usage, support, and safety records.</li></ul><p>Do not send sensitive personal data, classified data, trade secrets, or export-controlled technical data.</p></> },
    { title: "Why we use it", body: <><p>We use data to run accounts, consented matches, intros, alerts, billing, safety, and legal work. Our legal bases are contract, law, and valid business interests where allowed.</p><p>We ask separate consent for public X data, alerts, email intros, optional analytics, and marketing. You may withdraw consent. This does not undo earlier lawful use.</p></> },
    { title: "Sharing and transfers", body: <><p>We share only what our vendors need for identity, hosting, data, jobs, AI, email, pay, approved analytics, and X. Staff see only what they need for review, safety, and help.</p><p>Data sent abroad will use an adequacy ruling, contract terms, or another lawful method.</p></> },
    { title: "Storage and safety", body: <><p>We keep X DMs and email text for a rolling 12 months, unless you ask for less or law or safety needs more. Profile facts stay while your account is active. We may keep billing, consent, audit, abuse, and deletion logs longer when the law requires it.</p><p>Planned controls include row access rules, server-only keys, hashed API keys, field encryption, clean logs, and signed webhooks. No system is fully safe.</p></> },
    { title: "Your rights", body: <><p>Ask for access, a fix, export, pause, objection, limit, block, or deletion on X or at privacy@legitreach.com. Local law may also let you complain to a regulator or appeal a denial.</p><p>Send STOP on X to pause alerts. Block us to stop X contact. We may need to check your ID first.</p></> },
    { title: "Site data", body: <><p>We use needed storage for safety and your privacy choice. Analytics starts only after you choose “Allow analytics.” It never gets DM or email text, sensitive profile data, or API secrets.</p></> },
  ]} />;
}
