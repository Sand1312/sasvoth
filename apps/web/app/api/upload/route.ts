import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File blob is required." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, ""); // Sanitize
    const filename = `${uniqueSuffix}-${originalName}`;
    
    // Define the upload directory (public/uploads)
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Ensure directory exists (redundant if mkdir run, but safe)
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);

    // Write file
    await fs.writeFile(filepath, buffer);

    // Return the relative URL
    return NextResponse.json({ 
        url: `/uploads/${filename}`,
        success: true 
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 }
    );
  }
}
