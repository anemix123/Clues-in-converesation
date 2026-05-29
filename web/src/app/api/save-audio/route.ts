import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs"; // important for fs access

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file received" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save inside web/uploads
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: `uploads/${safeName}`,
      bytes: buffer.length,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("save-audio error:", error);
    return NextResponse.json(
      { error: "Failed to save audio", details: String(error) },
      { status: 500 }
    );
  }
}