import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:4000";
    const backendUrl = new URL("/auth/validate", apiBase).toString();

    const cookie = req.headers.get("cookie") || "";

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        cookie,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const body = await res.text();

    if (res.ok) {
      return new NextResponse(body, {
        status: 200,
        headers: {
          "content-type": res.headers.get("content-type") || "application/json",
        },
      });
    }
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "text/plain",
      },
    });
  } catch (err) {
    console.error("/api/auth/validate error:", err);
    return new NextResponse("internal validation error", { status: 500 });
  }
}
