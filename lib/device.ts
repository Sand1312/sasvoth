import type { Device } from "../type/definitions";

export async function fetchAllDevices(): Promise<Device[] | undefined> {
  const response = await fetch("/api/devices");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
