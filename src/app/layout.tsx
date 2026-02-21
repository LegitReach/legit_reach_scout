import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";import AuthHeader from "@/components/AuthHeader";import "./globals.css";

export const metadata: Metadata = {
  title: "LegitReach - Reddit Opportunity Finder",
  description: "Find relevant Reddit discussions, track your outreach, and craft authentic replies that convert.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <AppProvider>
            <AuthHeader />
            {children}
          </AppProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
