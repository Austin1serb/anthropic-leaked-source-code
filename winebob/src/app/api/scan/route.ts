import { NextRequest } from "next/server";
import { scanWineLabel } from "@/lib/services/labelScanner";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Determine media type
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

    const result = await scanWineLabel(base64, mediaType);

    return Response.json(result);
  } catch (error) {
    console.error("Label scan error:", error);
    return Response.json(
      { error: "Failed to scan label" },
      { status: 500 }
    );
  }
}
