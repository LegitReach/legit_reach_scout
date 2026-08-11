import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "AI Disclosure", description: "How LegitBot uses AI and where human review applies.", alternates: { canonical: "/legitbot/legal/ai-disclosure" } };

export default function AiDisclosurePage() {
  return <LegalPage title="AI disclosure" summary="LegitBot is automated. Gemini helps with chats, matches, and sourced summaries. Humans check key beta choices." sections={[
    { title: "What AI does", body: <><p>AI may draft private replies, pull profile facts, make vectors, rank needs and offers, explain matches, sum up company events, and draft public posts for review.</p><p>Model names can change. Planned defaults are Gemini 3.5 Flash-Lite and Gemini Embedding 2. A set schema checks each output before use.</p></> },
    { title: "What people decide", body: <><p>A human must approve each member, beta match, public post or reply, and safety case. Members see a match only after review. Email intros need both people to opt in and verify email.</p></> },
    { title: "AI limits", body: <><p>AI can make up facts, miss context, label a source wrong, or make a poor match. You can fix profile facts. Check company summaries against the cited main source. They are not financial advice.</p></> },
    { title: "Fair matches", body: <><p>Rank uses consent, availability, plan limits, blocks, needs, offers, role or sector fit, time, and place choices. We do not score protected traits or treat follower count as authority.</p></> },
    { title: "Data sent to AI", body: <><p>We send only data needed for the chosen task. Do not send classified, proprietary, export-controlled, card, API secret, or needless sensitive personal data. Requests and replies follow our retention rules and the provider&apos;s final terms.</p></> },
    { title: "Your choices", body: <><p>You may fix a fact, reject a match, ask for a human, withdraw public-X or match consent, or ask us to delete data. A major harmful choice should not rely only on AI.</p></> },
  ]} />;
}
