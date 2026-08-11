import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedLegitBotRoute = createRouteMatcher([
  "/legitbot/portal(.*)",
  "/legitbot/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedLegitBotRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$).*)",
    "/(api|trpc)(.*)",
  ],
};
