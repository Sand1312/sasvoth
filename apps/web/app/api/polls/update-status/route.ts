import { NextResponse } from "next/server";

import { forwardSetCookies } from "../../_lib/forward-set-cookie";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8000";

export async function PATCH(req: Request) {
  try {
    const backendUrl = new URL("/polls/updateStatus", apiBase).toString();
    const cookie = req.headers.get("cookie") || "";
    const body = await req.text();
    const contentType = req.headers.get("content-type") || "application/json";

    let res: Response;
    try {
      res = await fetch(backendUrl, {
        method: "PATCH",
        headers: {
          cookie,
          Accept: "application/json",
          "Content-Type": contentType,
        },
        body,
        cache: "no-store",
      });
    } catch (err) {
      console.error("/api/polls/update-status PATCH backend fetch failed:", err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();
    const headers = new Headers();
    const resContentType = res.headers.get("content-type");
    if (resContentType) headers.set("content-type", resContentType);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/polls/update-status PATCH error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
