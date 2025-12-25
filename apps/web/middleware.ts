import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of cookie names the middleware will accept as proof of authentication.
const AUTH_COOKIE_NAMES = [
  "connect.sid",
  "token",
  "session",
  "jwt",
  "maci_sid",
  "access_token",
  "refresh_token",
  "auth_token",
];

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Skip static files, API routes (handled by rewrites), etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname) ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const protectedRoots = ["/dashboard", "/admin", "/settings", "/profile"];
  const needsAuth = protectedRoots.some((p) => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next();

  // Simple cookie existence check - no backend validation
  // Full auth validation happens in Server Components/Server Actions
  const cookieHeader = req.headers.get("cookie") || "";
  const hasAuthCookie = AUTH_COOKIE_NAMES.some((name) =>
    cookieHeader.includes(`${name}=`)
  );

  if (hasAuthCookie) {
    return NextResponse.next();
  }

  // Redirect to signin if no auth cookie found
  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};
