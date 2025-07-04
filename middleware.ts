import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  const port = req.headers.get("host")?.split(":")[1];

  if (port === "3001") {
    const res = NextResponse.next();
    res.headers.set("x-mock-active", "true");
    return res;
  }

  return NextResponse.next();
}
