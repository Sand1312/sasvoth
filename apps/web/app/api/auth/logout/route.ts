import { NextResponse } from "next/server";
import { forwardSetCookies } from "../../_lib/forward-set-cookie";

function getCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [kRaw, ...rest] = part.split("=");
    const key = decodeURIComponent(kRaw || "");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const backendUrl = new URL("/auth/logout", apiBase).toString();

    const cookieHeader = req.headers.get("cookie") || "";
    const accessToken = getCookieValue(cookieHeader, "access_token");

    const requestHeaders: Record<string, string> = {
      cookie: cookieHeader,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    // Some JWT guards expect Authorization header instead of cookies.
    if (accessToken) {
      requestHeaders["authorization"] = `Bearer ${accessToken}`;
    }

    let res;
    try {
      res = await fetch(backendUrl, {
        method: "POST",
        headers: requestHeaders,
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.error("/api/auth/logout fetch to backend failed:", fetchErr);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();

    // Forward any Set-Cookie headers (to clear cookies on client)
    const resHeaders = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) resHeaders.set("content-type", ct);
    forwardSetCookies(res, resHeaders);

    return new NextResponse(text, { status: res.status, headers: resHeaders });
  } catch (err) {
    console.error("/api/auth/logout error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
