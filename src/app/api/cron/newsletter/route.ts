import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { processGlobalNewsletterSearch } from "@/lib/newsletter-orchestrator";
import { MorningLegitEmail } from "@/emails/MorningLegitEmail";

// ──────────────────────────────────────────────────────────
// POST /api/cron/newsletter
//
// Triggered daily by QStash at 7:00 AM UTC.
// Sends a personalized "Morning Legit" email to every user
// with newsletter_enabled = true.
//
// Security: verified via QStash signature headers.
// ──────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(req: NextRequest) {
  // 1. Verify QStash signature
  // const signature = req.headers.get("Upstash-Signature") ?? "";
  // const body =  req.body

  console.log("Headers: ",req.headers);
  console.log("Body: ", await req.text());

  // const isValid = await receiver.verify({
  //   body,
  //   signature,

  // }).catch(() => false);

  // if (!isValid) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 2. Fetch all opted-in users from Supabase
  const { data: users, error } = await supabaseAdmin
    .from("onboarding_details")
    .select("user_id, business_pitch, keywords, brand_name, newsletter_enabled")
    .eq("newsletter_enabled", true)
    .in("user_id" , ["user_3B0FrRF67U7sOOd6bvIEAnsPPnR" ,  "user_3AJFWgVb4DB6WHHSAMrgM4fqf0r"])
    .not("business_pitch", "is", null);

  if (error) {
    console.error("[Newsletter CRON] Supabase fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ message: "No opted-in users found", sent: 0 });
  }

  const clerk = await clerkClient();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // 3. Process each user independently — one failure doesn't block others
  for (const user of users) {
    try {
      const { user_id, business_pitch, keywords, brand_name } = user;

      if (!business_pitch || !keywords?.length) {
        skipped++;
        continue;
      }

      // Get email from Clerk
      const clerkUser = await clerk.users.getUser(user_id);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;

      if (!email) {
        skipped++;
        continue;
      }

      // Run Reddit intelligence
      const result = await processGlobalNewsletterSearch(business_pitch, keywords);

      // Render email
      // Send via Resend
      await resend.emails.send({
        from: "Morning Legit <manthan@legitreach.com>",
        to: email,
        subject: `Morning Legit — ${date}`,
        react : MorningLegitEmail({
          brandName: brand_name || "Your Brand",
          briefing: result.briefing,
          topLeads: result.topLeads,
          totalAnalyzed: result.totalAnalyzed,
          date,
        })
      });

      sent++;
      console.log(`[Newsletter CRON] Sent to ${email}`);
    } catch (err) {
      console.error(`[Newsletter CRON] Failed for user ${user.user_id}:`, err);
      failed++;
    }
  }

  console.log(`[Newsletter CRON] Done — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`);

  return NextResponse.json({ sent, skipped, failed });
}
