import { NextResponse } from "next/server";
import { forwardSetCookies } from "../../_lib/forward-set-cookie";

export async function POST(req: Request) {
  try {
    // Backend base URL
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const backendUrl = new URL("/auth/refresh", apiBase).toString();

    // Forward incoming cookie header (refresh token is in cookie)
    const cookie = req.headers.get("cookie") || "";
    const body = await req.text(); // Though refresh typically has no body

    let res;
    try {
      res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          cookie,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.error("/api/auth/refresh fetch to backend failed:", fetchErr);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();

    // Forward Set-Cookie header (new access/refresh tokens)
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/auth/refresh error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
