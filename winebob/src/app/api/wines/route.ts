import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/wines?region=Bordeaux
 *
 * Returns wines for a region (id, name, producer, vintage, type).
 * Used by the Vintage Weather layer's wine picker.
 */
export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get("region");
    if (!region) {
      return NextResponse.json([]);
    }

    const wines = await prisma.wine.findMany({
      where: { region, isPublic: true },
      select: { id: true, name: true, producer: true, vintage: true, type: true },
      orderBy: [{ vintage: "desc" }, { name: "asc" }],
      take: 30,
    });

    return NextResponse.json(wines, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
