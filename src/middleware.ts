import { clerkMiddleware } from "@clerk/nextjs/server";

// apply Clerk middleware to all routes; public paths are controlled via the matcher below
export default clerkMiddleware();

// See "Matching Paths" below to learn more
// exclude next.js internals and the auth path from middleware
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|auth).*)"] };
