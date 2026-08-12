import type { Metadata } from "next";
import { Eyebrow, StatusTag } from "@/components/legitbot/LegitBotFrame";
import styles from "@/components/legitbot/legitbot.module.css";

export const metadata: Metadata = {
  title: "Developers",
  description: "LegitBot API v1 routes, keys, pages, sources, and credits.",
  alternates: { canonical: "/legitbot/api" },
};

const endpoints = [
  "/companies",
  "/companies/{slug}",
  "/companies/{slug}/events",
  "/events",
  "/space-weather",
  "/launches",
  "/datasets",
  "/datasets/{slug}/records",
  "/sources",
  "/usage",
];

export default function DevelopersPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHero}>
        <Eyebrow>LEGITBOT DATA API · V1</Eyebrow>
        <h1>Space data.<br />One API.</h1>
        <p className={styles.pageLead}>
          Get companies, events, launches, weather, and licensed datasets. The API is in
          private beta. Sources and billing are not live.
        </p>
        <div className={styles.pageActions}>
          <a className={styles.primaryLink} href="#quickstart">READ QUICKSTART</a>
          <a className={styles.secondaryLink} href="mailto:api@legitreach.com?subject=LegitBot%20API%20beta">REQUEST BETA ACCESS</a>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.portalLayout}>
          <aside className={styles.portalAside} aria-label="API documentation sections">
            <a href="#portal">Portal</a><a href="#quickstart">Quickstart</a><a href="#endpoints">Endpoints</a><a href="#responses">Responses</a><a href="#credits">Credits</a><a href="#provenance">Provenance</a>
          </aside>
          <div className={styles.portalContent}>
            <section className={styles.portalCard} id="portal">
              <StatusTag>Private beta</StatusTag>
              <h2 style={{ marginTop: "1.2rem" }}>Developer portal</h2>
              <p>Live keys show once. We store only a hash and tie each key to your account. Key creation is off in this preview.</p>
              <div className={styles.apiKeyShell}>
                <label htmlFor="api-key-preview">API key</label>
                <div className={styles.apiKeyRow}>
                  <input id="api-key-preview" value="lb_live_••••••••••••••••" readOnly aria-describedby="api-key-help" />
                  <button className={styles.secondaryButton} type="button" disabled>CREATE KEY</button>
                </div>
                <p id="api-key-help">No key was made. Key tools are not live.</p>
              </div>
            </section>

            <section className={styles.portalCard} id="quickstart">
              <h2>Quickstart</h2>
              <p>Send a bearer key. Times use ISO-8601. Lists use opaque cursors.</p>
              <pre className={styles.codeBlock}><code>{`curl "https://www.legitreach.com/legitbot/api/v1/companies" \\
  -H "Authorization: Bearer $LEGITBOT_API_KEY"`}</code></pre>
            </section>

            <section className={styles.portalCard} id="endpoints">
              <h2>Endpoints</h2>
              <p>These are the public v1 routes. Data depends on source rights and health.</p>
              <div className={styles.endpointList}>
                {endpoints.map((endpoint) => <div className={styles.endpointRow} key={endpoint}><span className={styles.method}>GET</span><code>/legitbot/api/v1{endpoint}</code></div>)}
              </div>
            </section>

            <section className={styles.portalCard} id="responses">
              <h2>Response envelope</h2>
              <p>Each success shows its request ID, date, credit use, and source credit.</p>
              <pre className={styles.codeBlock}><code>{`{
  "data": [],
  "meta": {
    "request_id": "req_…",
    "cursor": null,
    "as_of": "2026-08-10T00:00:00Z",
    "credits_used": 1,
    "credits_remaining": 999,
    "attributions": []
  }
}`}</code></pre>
            </section>

            <section className={styles.portalCard} id="credits">
              <h2>Credits and errors</h2>
              <p>A page costs 1 credit. Search or grouped data costs 5. An AI summary costs 10. An export costs at least 10, plus 1 per 100 rows. Monthly credits go first.</p>
              <p>A low balance returns HTTP 402 with a checkout link. Errors use <code>{`{ "error": { "code", "message", "request_id" } }`}</code>.</p>
            </section>

            <section className={styles.portalCard} id="provenance">
              <h2>Source rights</h2>
              <p>Each source is <code>redistributable</code>, <code>derived_only</code>, <code>catalog_only</code>, or <code>blocked</code>. Unclear rights mean catalog-only. Each response keeps its source credit.</p>
              <p>Launch data will not include stock prices, raw Space-Track records, or paid CelesTrak data without clear resale rights.</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
