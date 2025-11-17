import { NextResponse } from "next/server";
import { forwardSetCookies } from "../../_lib/forward-set-cookie";

export async function GET(req: Request) {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const backendUrl = new URL("/users/me", apiBase).toString();

    const cookie = req.headers.get("cookie") || "";

    let res;
    try {
      res = await fetch(backendUrl, {
        method: "GET",
        headers: {
          cookie,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.error("/api/users/me fetch to backend failed:", fetchErr);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();

    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/users/me error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
