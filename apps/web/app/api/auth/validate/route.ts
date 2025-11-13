import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Backend base URL
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const backendUrl = new URL("/auth/validate", apiBase).toString();

    // Forward incoming cookie header to backend (no body needed for validate)
    const cookie = req.headers.get("cookie") || "";

    let res;
    try {
      res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          cookie,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.error("/api/auth/validate fetch to backend failed:", fetchErr);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();

    // Forward any Set-Cookie header we received from backend (though validate shouldn't set cookies)
    const headers: Record<string, string> = {};
    const ct = res.headers.get("content-type");
    if (ct) headers["content-type"] = ct;
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      headers["set-cookie"] = setCookie;
    }

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/auth/validate error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
