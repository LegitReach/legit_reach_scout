import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { RedditPost } from "@/types";

interface MorningLegitEmailProps {
  firstName: string;
  briefing: string;
  topLeads: RedditPost[];
  totalAnalyzed: number;
  date: string;
}

export function MorningLegitEmail({
  firstName,
  briefing,
  topLeads,
  totalAnalyzed,
  date,
}: MorningLegitEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your Morning Legit briefing for ${date} - ${totalAnalyzed} Reddit posts analyzed`}</Preview>
      <Body style={body}>
        <Section style={header}>
          <Text style={headerLabel}>LEGITREACH SCOUT</Text>
          <Heading style={headerTitle}>Morning Legit</Heading>
          <Text style={headerDate}>{date}</Text>
        </Section>

        <Container style={container}>
          <Text style={greeting}>Good morning, {firstName}</Text>

          <Section style={card}>
            <Text style={sectionLabel}>TODAY'S BRIEFING</Text>
            <Text style={briefingText}>{briefing}</Text>
            <Text style={analyzedCount}>
              {totalAnalyzed} Reddit posts analyzed in the last 24 hours
            </Text>
          </Section>

          {topLeads.length > 0 && (
            <Section>
              <Text style={sectionLabel}>TOP REDDIT OPPORTUNITIES</Text>
              {topLeads.slice(0, 5).map((post) => (
                <Section key={post.id} style={leadCard}>
                  <Text style={leadMeta}>
                    r/{post.subreddit} &nbsp;·&nbsp; ↑ {post.score} &nbsp;·&nbsp; 💬 {post.num_comments}
                  </Text>
                  <Text style={leadTitle}>{post.title}</Text>
                  <Link
                    href={`${post.url}`}
                    style={leadLink}
                  >
                    View on Reddit →
                  </Link>
                </Section>
              ))}
            </Section>
          )}

          {topLeads.length === 0 && (
            <Section style={card}>
              <Text style={emptyText}>
                No high-intent leads found in the last 24 hours. Check back tomorrow.
              </Text>
            </Section>
          )}

          <Hr style={divider} />

          <Text style={footer}>
            You're receiving this because your LegitReach newsletter is enabled.
            Visit your{" "}
            <Link href="https://legitreach.com/terminal" style={footerLink}>
              dashboard
            </Link>{" "}
            to manage settings.
          </Text>
          <Text style={footerBrand}>
            Powered by{" "}
            <Link href="https://legitreach.com" style={footerLink}>
              LegitReach Scout
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MorningLegitEmail;

// ─── Styles ───────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: 0,
};

const header: React.CSSProperties = {
  backgroundColor: "#09090b",
  padding: "32px 24px 24px",
  textAlign: "center",
};

const headerLabel: React.CSSProperties = {
  color: "#22c55e",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const headerTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 700,
  margin: "0 0 8px",
};

const headerDate: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "580px",
  padding: "32px 24px",
};

const greeting: React.CSSProperties = {
  color: "#09090b",
  fontSize: "18px",
  fontWeight: 600,
  margin: "0 0 24px",
};

const sectionLabel: React.CSSProperties = {
  color: "#22c55e",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const card: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "24px",
  padding: "20px",
};

const briefingText: React.CSSProperties = {
  color: "#18181b",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 12px",
};

const analyzedCount: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  margin: 0,
};

const leadCard: React.CSSProperties = {
  borderLeft: "3px solid #22c55e",
  marginBottom: "20px",
  paddingLeft: "16px",
};

const leadMeta: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  margin: "0 0 4px",
};

const leadTitle: React.CSSProperties = {
  color: "#09090b",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "1.4",
  margin: "0 0 8px",
};

const leadLink: React.CSSProperties = {
  color: "#22c55e",
  fontSize: "12px",
  fontWeight: 600,
  textDecoration: "none",
};

const emptyText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: 0,
  textAlign: "center",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 8px",
  textAlign: "center",
};

const footerBrand: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  margin: 0,
  textAlign: "center",
};

const footerLink: React.CSSProperties = {
  color: "#22c55e",
  textDecoration: "none",
};
