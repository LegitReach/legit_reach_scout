import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AdminAccess } from "@/components/legitbot/AdminAccess";

export const metadata: Metadata = {
  title: "Operator Console",
  description: "Restricted LegitBot operator console.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

function configuredOwnerIds(): Set<string> {
  return new Set(
    (process.env.LEGITBOT_OWNER_CLERK_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId || !configuredOwnerIds().has(userId)) notFound();

  return <AdminAccess />;
}
