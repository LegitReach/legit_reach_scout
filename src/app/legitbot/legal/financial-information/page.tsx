import type { Metadata } from "next";
import { LegalPage } from "@/components/legitbot/LegalPage";

export const metadata: Metadata = { title: "Financial-Information Disclaimer", description: "Important limits on LegitBot company intelligence.", alternates: { canonical: "/legitbot/legal/financial-information" } };

export default function FinancialInformationPage() {
  return <LegalPage title="Financial data" summary="LegitBot shares sourced company facts. It is not a broker, adviser, analyst, exchange, or price vendor." sections={[
    { title: "Facts, not advice", body: <><p>Pages, events, alerts, AI summaries, data, and API replies are general facts. They are not personal advice or a call to buy, sell, hold, fund, value, or trade a company or security.</p></> },
    { title: "No stock prices", body: <><p>We will not show stock prices, charts, quotes, or market feeds until a paid deal clearly allows customer use. A public ticker or delayed quote does not grant resale rights.</p></> },
    { title: "Sources may change", body: <><p>We prefer company and exchange reports, SEC EDGAR, public buying, rules, contracts, launches, and missions. A source or AI summary may be late, incomplete, fixed later, or wrong.</p></> },
    { title: "Why a company is listed", body: <><p>A company must have a main space business, a separate material space unit, or repeat space work that an analyst deems key. A listing says nothing about quality, credit, value, support, or future results.</p></> },
    { title: "Check before you act", body: <><p>Check key facts in original filings. Get your own financial, tax, accounting, and legal advice. Your choices and legal duties are yours.</p></> },
    { title: "Conflicts and fixes", body: <><p>We should list business ties or conflicts that may affect coverage. Send errors, with the source and record, to data@legitreach.com.</p></> },
  ]} />;
}
