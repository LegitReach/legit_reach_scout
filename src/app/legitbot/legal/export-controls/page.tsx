import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "Export-Control Warning", description: "Rules against sharing controlled or sensitive space information with LegitBot.", alternates: { canonical: "/legitbot/legal/export-controls" } };

export default function ExportControlsPage() {
  return <LegalPage title="Export-control warning" summary="Space work may involve classified, CUI, sanctions, ITAR, EAR, or contract limits. Do not use LegitBot for that data." sections={[
    { title: "Do not send controlled data", body: <><p>Do not send limited technical data, code, drawings, specs, results, passwords, mission flaws, defense items, or services. An X DM or intro email is not safe just because both people work in space.</p></> },
    { title: "No secret or private data", body: <><p>Do not send classified data, CUI, state secrets, trade secrets, client secrets, or third-party private data. The only exception is clear authority plus a safe channel approved by LegitReach in writing.</p></> },
    { title: "Sanctions", body: <><p>Do not break export rules, embargoes, or sanctions, or help a banned party. We may screen or block use when law requires it.</p></> },
    { title: "An intro grants no rights", body: <><p>A match or intro gives no export license, aid deal, clearance, need to know, work permit, buying approval, or right to discuss controlled work. Each person must check.</p></> },
    { title: "If you send it by mistake", body: <><p>Stop. Email security@legitreach.com without repeating the data. Name the message only at a high level. We will limit access, keep required audit proof, and seek expert legal or safety help.</p></> },
    { title: "Your duty", body: <><p>You must handle classification, legal scope, licenses, screening, labels, storage, transfer, and access for your data. Ask export counsel before sharing technical space data across groups or borders.</p></> },
  ]} />;
}
