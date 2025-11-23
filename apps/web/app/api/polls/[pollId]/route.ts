import { NextResponse } from "next/server";
import { forwardSetCookies } from "../../_lib/forward-set-cookie";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000";

export async function GET(
  req: Request,
  { params }: { params: { pollId: string } }
) {
  try {
    const pollId = params.pollId;
    const backendUrl = new URL(`/polls/${encodeURIComponent(pollId)}`, apiBase);

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
      console.error(`/api/polls/${pollId} GET backend fetch failed:`, err);
      return new NextResponse("backend unreachable", { status: 502 });
    }

    const text = await res.text();
    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    forwardSetCookies(res, headers);

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    console.error(`/api/polls/[pollId] GET error:`, err);
    return new NextResponse("internal proxy error", { status: 500 });
  }
}
