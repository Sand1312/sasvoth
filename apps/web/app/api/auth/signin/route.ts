import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");
    if (!provider) {
      return new NextResponse("provider query param required", { status: 400 });
    }

    // Backend base URL
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const backendUrl = new URL(`/auth/signin/${provider}`, apiBase).toString();

    // Start the OAuth flow by calling backend and forwarding its redirect
    // response (which will typically be a 302 to the external provider).
    let backendRes;
    try {
      backendRes = await fetch(backendUrl, {
        method: "GET",
        // forward cookies if any (not usually needed for start)
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        redirect: "manual",
        cache: "no-store",
      });
    } catch (err) {
      console.error("/api/auth/signin proxy start failed:", err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    // If backend returned a redirect, forward it to the browser so it goes to
    // the provider (Google/Github). Otherwise return the backend body/status.
    const location = backendRes.headers.get("location");
    const text = await backendRes.text();
    if (location) {
      return NextResponse.redirect(location, backendRes.status);
    }

    const headers: Record<string, string> = {};
    const ct = backendRes.headers.get("content-type");
    if (ct) headers["content-type"] = ct;
    return new NextResponse(text, { status: backendRes.status, headers });
  } catch (err) {
    console.error("/api/auth/signin error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    if (!type) {
      return new NextResponse("type query param required", { status: 400 });
    }

    // Backend base URL
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    const backendUrl = new URL(`/auth/signin?type=${type}`, apiBase).toString();

    // Forward incoming cookie header and JSON body to backend
    const cookie = req.headers.get("cookie") || "";
    const body = await req.text();

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
      console.error("/api/auth/signin POST proxy failed:", fetchErr);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();

    // Forward any Set-Cookie header we received from backend so browser can store cookies
    const headers: Record<string, string> = {};
    const ct = res.headers.get("content-type");
    if (ct) headers["content-type"] = ct;
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      headers["set-cookie"] = setCookie;
    }

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error("/api/auth/signin POST error:", err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
