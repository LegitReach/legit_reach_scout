import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "Subprocessors", description: "Intended service providers supporting LegitBot.", alternates: { canonical: "/legitbot/legal/subprocessors" } };

export default function SubprocessorsPage() {
  return <LegalPage title="Service providers" summary="This draft lists vendors we plan to use. We will check the final list, locations, and transfer terms before launch." sections={[
    { title: "Core services", body: <><ul><li><strong>Vercel:</strong> site hosting and servers.</li><li><strong>Supabase:</strong> Postgres, file storage, and vector search.</li><li><strong>Upstash:</strong> rate limits and job queues.</li><li><strong>Clerk:</strong> site login and X/Twitter v2 link.</li></ul></> },
    { title: "Messages and AI", body: <><ul><li><strong>X Corp.:</strong> DMs, public profiles, approved posts, and X identity.</li><li><strong>Google:</strong> Gemini output and embeddings.</li><li><strong>Resend:</strong> email checks, intros, replies, and delivery events.</li></ul></> },
    { title: "Pay and site data", body: <><ul><li><strong>Stripe:</strong> checkout, plans, tax, portal, refunds, and payment events.</li><li><strong>PostHog:</strong> allowed product analytics. No DM or email text or sensitive profile data.</li><li><strong>Google Analytics and Microsoft Clarity:</strong> allowed site analytics only. No chat text.</li></ul></> },
    { title: "Changes", body: <><p>We plan to post key vendor changes before a new vendor gets live personal data, unless urgent safety work prevents it. Email privacy@legitreach.com about transfers or objections.</p></> },
    { title: "Data limits", body: <><p>Vendors get only what their task needs. Stripe handles card data. We never store plain API keys after issue. Do not send needless member data to AI or analytics.</p></> },
  ]} />;
}
