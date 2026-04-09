import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { wineId, lat, lng, city, country } = body;

    if (!wineId || typeof lat !== "number" || typeof lng !== "number") {
      return Response.json(
        { error: "wineId, lat, and lng are required" },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return Response.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    const checkIn = await prisma.wineCheckIn.create({
      data: {
        userId: session.user.id,
        wineId,
        lat,
        lng,
        city: city ?? null,
        country: country ?? null,
        expiresAt,
      },
    });

    return Response.json(checkIn, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Check-in error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const now = new Date();

    const checkIns = await prisma.wineCheckIn.findMany({
      where: {
        expiresAt: { gt: now },
      },
      include: {
        wine: {
          select: {
            id: true,
            name: true,
            type: true,
            region: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const geojson = {
      type: "FeatureCollection" as const,
      features: checkIns.map((ci) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [ci.lng, ci.lat],
        },
        properties: {
          wineId: ci.wine.id,
          wineName: ci.wine.name,
          wineType: ci.wine.type,
          region: ci.wine.region,
          city: ci.city,
          createdAt: ci.createdAt.toISOString(),
        },
      })),
    };

    return Response.json(geojson);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Check-in fetch error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
