import { NextResponse } from "next/server";

import { forwardSetCookies } from "../../_lib/forward-set-cookie";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8000";

export async function GET(
  _req: Request,
  { params }: { params: { ideaId: string } }
) {
  try {
    const backendUrl = new URL(`/ideas/get/${encodeURIComponent(params.ideaId)}`, apiBase);

    let res: Response;
    try {
      res = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (err) {
      console.error("/api/ideas/[ideaId] GET backend fetch failed:", err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();
    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/ideas/[ideaId] GET error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { ideaId: string } }
) {
  try {
    const backendUrl = new URL(`/ideas/update/${encodeURIComponent(params.ideaId)}`, apiBase);
    const cookie = req.headers.get("cookie") || "";
    const body = await req.text();
    const contentType = req.headers.get("content-type") || "application/json";

    let res: Response;
    try {
      res = await fetch(backendUrl, {
        method: "PUT",
        headers: {
          cookie,
          Accept: "application/json",
          "Content-Type": contentType,
        },
        body,
        cache: "no-store",
      });
    } catch (err) {
      console.error("/api/ideas/[ideaId] PUT backend fetch failed:", err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();
    const headers = new Headers();
    const resContentType = res.headers.get("content-type");
    if (resContentType) headers.set("content-type", resContentType);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/ideas/[ideaId] PUT error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
