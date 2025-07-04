import type { Device } from "../../../type/definitions";
import { fetchAllDevices } from "../../../lib/device";

export async function GET(request: Request) {
  try {
    const devices = await fetchAllDevices();
    return new Response(JSON.stringify(devices), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Failed to fetch devices", error }),
      { status: 500 }
    );
  }
}
