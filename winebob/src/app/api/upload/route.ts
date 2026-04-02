import { put } from "@vercel/blob";
import { NextRequest } from "next/server";

/**
 * Upload endpoint for wine label photos and user avatars.
 * Uses Vercel Blob for storage.
 *
 * POST /api/upload
 * Body: FormData with "file" field
 * Query: ?folder=labels|avatars|reviews
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, HEIC" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: "File too large. Maximum 10MB." },
        { status: 400 }
      );
    }

    const folder = request.nextUrl.searchParams.get("folder") ?? "uploads";
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}-${file.name}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
