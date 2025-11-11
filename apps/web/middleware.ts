import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of cookie names the middleware will accept as proof of authentication.
const AUTH_COOKIE_NAMES = [
  "connect.sid",
  "token",
  "session",
  "jwt",
  "maci_sid",
];

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

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

  // Check cookies for any of the known auth cookie names
  const hasAuthCookie = AUTH_COOKIE_NAMES.some(
    (name) => !!cookies.get(name)?.value
  );

  if (hasAuthCookie) {
    // perform server-side validation by calling our internal API which proxies the request
    try {
      const validateUrl = new URL("/api/auth/validate", req.url);
      const validationRes = await fetch(validateUrl.toString(), {
        method: "GET",
        // forward cookie header so backend can validate session
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        cache: "no-store",
      });

      if (validationRes.ok) {
        return NextResponse.next();
      }
    } catch (e) {
      console.error("Middleware validation error:", e);
    }
  }

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
