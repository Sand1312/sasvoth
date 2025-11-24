import { NextResponse } from "next/server";

import mockIpfs from "@ipfs-service/ipfs/mock-ipfs.client";

type RouteParams = {
  params: {
    cid: string;
  };
};

function normalizeCid(cid: string): string {
  return cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const cid = normalizeCid(params.cid);
  try {
    const data = await mockIpfs.cat(cid);
    const raw = data.toString("utf8");
    try {
      const parsed = JSON.parse(raw);
      const parsedContent = parsed?.content;
      const content = typeof parsedContent === "string" ? JSON.parse(parsedContent) : parsed;
      return NextResponse.json(content);
    } catch (err) {
      console.warn(`/api/ipfs/${cid} could not parse JSON`, err);
      return new NextResponse(raw, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  } catch (err) {
    console.error(`/api/ipfs/${cid} GET error:`, err);
    return NextResponse.json({ error: "CID not found" }, { status: 404 });
  }
}
