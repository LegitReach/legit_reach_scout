import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "Data-License Policy", description: "How LegitBot evaluates and enforces source permissions.", alternates: { canonical: "/legitbot/legal/data-license" } };

export default function DataLicensePage() {
  return <LegalPage title="Data-license policy" summary="Public access does not grant resale rights. We record rights and sources before we share data." sections={[
    { title: "Source record", body: <><p>For each source, we store its URL, license URL and version, credit line, commercial rights, cache, change, and resale rights, fetch time, checksum, schema version, freshness rule, and review state.</p></> },
    { title: "Data modes", body: <><ul><li><strong>Redistributable:</strong> We may clean and serve records within the license.</li><li><strong>Derived only:</strong> We show only allowed results.</li><li><strong>Catalog only:</strong> We show our own metadata and an upstream link, not blocked records.</li><li><strong>Blocked:</strong> We do not load or serve it.</li></ul><p>Missing or unclear rights mean catalog-only until a written review allows more.</p></> },
    { title: "First sources", body: <><p>We plan to use official company and exchange reports, SEC EDGAR, NOAA SWPC, NASA DONKI and NeoWs, NASA PDS, NASA SPDF or CDAWeb, Copernicus STAC metadata, and public buying or mission sources. Their current terms always apply.</p></> },
    { title: "Limits", body: <><p>We do not sell raw Space-Track data without written approval. Paid CelesTrak use stays off until written approval. SIMBAD and other share-alike data stays separate. We do not scrape unsupported sites or copy large images.</p><p>Stock prices stay out until we sign and fund clear commercial resale rights.</p></> },
    { title: "API catalog", body: <><p>The “awesome open-source space data APIs” repo helps us find sources. It does not license them. We review each source, write our own text, and link to it.</p></> },
    { title: "Fix or remove data", body: <><p>Rights owners may report credit, license, fact, or removal issues to legal@legitreach.com. We may turn off data during review and keep an audit log.</p></> },
  ]} />;
}
