import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Remme route guard (Next.js 16 "proxy" — formerly middleware).
 *
 * - Unauthenticated visitors are always sent to /login.
 * - A CARE_USER (patient) is confined to /care; a CAREGIVER to /caregiver.
 * - The role picker at /role is only shown to users who can be both.
 *
 * This is an optimistic check (it cannot touch the database). The real
 * authorization happens in the server components and route handlers.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths need no guard.
  const publicPaths = ["/login", "/signup", "/role"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Everything else requires a session.
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role;

  // Patient (Care Mode) routes live at the root: /home, /reminders, etc.
  const CARE_PATHS = ["/home", "/reminders", "/people", "/memories", "/assistant", "/mood", "/routine", "/sos", "/quiz"];
  const isCarePath = CARE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isCarePath || pathname === "/") {
    if (role === "CARE_USER") return NextResponse.next();
    if (role === "CAREGIVER") {
      return NextResponse.redirect(new URL("/caregiver/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/role", request.url));
  }

  // Caregiver Mode routes live under /caregiver.
  if (pathname === "/caregiver" || pathname.startsWith("/caregiver/")) {
    if (role === "CAREGIVER") return NextResponse.next();
    if (role === "CARE_USER") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.redirect(new URL("/role", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything but static assets, Next internals, and auth callbacks.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};