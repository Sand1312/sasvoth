import { NextResponse } from "next/server";
import { forwardSetCookies } from "../../_lib/forward-set-cookie";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyRequest(
  req: Request,
  method: string,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const segments = params.path ?? [];
    const targetPath = `/api/v1/${segments.join("/")}`;

    const incomingUrl = new URL(req.url);
    const backendUrl = new URL(targetPath, apiBase);
    backendUrl.search = incomingUrl.search;

    const cookie = req.headers.get("cookie") || "";
    const contentType = req.headers.get("content-type") || "application/json";
    // console.log(' API Call:', {
    //   method: method,
    //   clientUrl: req.url,
    //   proxyUrl: backendUrl.toString(),
    //   path: targetPath,
    //   query: incomingUrl.search,
    //   timestamp: new Date().toISOString()
    // });
    const init: RequestInit = {
      method,
      headers: {
        cookie,
        Accept: "application/json",
      },
      cache: "no-store",
    };

    if (METHODS_WITH_BODY.has(method.toUpperCase())) {
      const bodyBuffer = await req.arrayBuffer();
      init.body = bodyBuffer;
      init.headers = {
        ...init.headers,
        "Content-Type": contentType,
      };
    }

    let res: Response;
    try {
      res = await fetch(backendUrl.toString(), init);
    } catch (err) {
      // console.error(`/api/v1 proxy ${method} backend fetch failed:`, err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const headers = new Headers();
    const resContentType = res.headers.get("content-type");
    if (resContentType) headers.set("content-type", resContentType);
    forwardSetCookies(res, headers);

    return new NextResponse(arrayBuffer, { status: res.status, headers });
  } catch (err) {
    console.error(`/api/v1 proxy ${method} error:`, err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}

export async function GET(req: Request, context: RouteContext) {
  return proxyRequest(req, "GET", context);
}

export async function POST(req: Request, context: RouteContext) {
  return proxyRequest(req, "POST", context);
}

export async function PUT(req: Request, context: RouteContext) {
  return proxyRequest(req, "PUT", context);
}

export async function PATCH(req: Request, context: RouteContext) {
  return proxyRequest(req, "PATCH", context);
}

export async function DELETE(req: Request, context: RouteContext) {
  return proxyRequest(req, "DELETE", context);
}
