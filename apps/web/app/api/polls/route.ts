import { NextResponse } from "next/server";
import { forwardSetCookies } from "../_lib/forward-set-cookie";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const backendUrl = new URL("/polls", apiBase);
    const status = url.searchParams.get("status");
    if (status) {
      backendUrl.searchParams.set("status", status);
    }

    const cookie = req.headers.get("cookie") || "";

    let res: Response;
    try {
      res = await fetch(backendUrl.toString(), {
        method: "GET",
        headers: {
          cookie,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (err) {
      console.error("/api/polls GET backend fetch failed:", err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();
    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/polls GET error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const backendUrl = new URL("/polls", apiBase).toString();
    const cookie = req.headers.get("cookie") || "";
    const body = await req.text();
    const contentType = req.headers.get("content-type") || "application/json";

    let res: Response;
    try {
      res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          cookie,
          Accept: "application/json",
          "Content-Type": contentType,
        },
        body,
        cache: "no-store",
      });
    } catch (err) {
      console.error("/api/polls POST backend fetch failed:", err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();
    const headers = new Headers();
    const resContentType = res.headers.get("content-type");
    if (resContentType) headers.set("content-type", resContentType);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/polls POST error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
