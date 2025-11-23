import { NextResponse } from "next/server";

import mockIpfs from "@ipfs-service/ipfs/mock-ipfs.client";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const cid = await mockIpfs.add(JSON.stringify(payload), "metadata.json");
    const url = `ipfs://${cid}`;
    return NextResponse.json({ cid, url });
  } catch (err) {
    console.error("/api/ipfs POST error:", err);
    return new NextResponse("Failed to upload to IPFS", { status: 500 });
  }
}
