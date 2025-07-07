"use server";

import { fetchAllDevices } from "@/lib/device";

export async function getAllDevices() {
  try {
    const devices = await fetchAllDevices();
    return devices;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw new Error("Failed to fetch devices");
  }
}
