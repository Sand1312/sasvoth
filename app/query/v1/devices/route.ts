import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { id: 1, brand: "Apple", name: "iPhone 14 Pro", type: "phone" },
    { id: 2, brand: "Apple", name: "iPhone 15", type: "phone" },
    { id: 3, brand: "Apple", name: "MacBook Pro M2", type: "laptop" },
    { id: 4, brand: "Apple", name: "iPad Pro M4", type: "tablet" },

    { id: 5, brand: "Samsung", name: "Galaxy S24 Ultra", type: "phone" },
    { id: 6, brand: "Samsung", name: "Galaxy Z Fold5", type: "phone" },
    { id: 7, brand: "Samsung", name: "Galaxy Book3 Pro", type: "laptop" },
    { id: 8, brand: "Samsung", name: "Galaxy Tab S9", type: "tablet" },

    { id: 9, brand: "Google", name: "Pixel 8 Pro", type: "phone" },
    { id: 10, brand: "Google", name: "Pixelbook Go", type: "laptop" },
    { id: 11, brand: "Google", name: "Pixel Tablet", type: "tablet" },

    { id: 12, brand: "Xiaomi", name: "Xiaomi 14 Ultra", type: "phone" },
    { id: 13, brand: "Xiaomi", name: "Redmi Book Pro 15", type: "laptop" },
    { id: 14, brand: "Xiaomi", name: "Pad 6", type: "tablet" },
  ]);
}