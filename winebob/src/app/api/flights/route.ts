import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { name, path, wines } = body as {
      name?: string;
      path: GeoJSON.LineString;
      wines: Array<{ region: string; wineName: string; grapes: string[] }>;
    };

    if (!path || !path.coordinates || path.coordinates.length < 2) {
      return NextResponse.json(
        { error: "A valid path is required" },
        { status: 400 },
      );
    }

    if (!wines || !Array.isArray(wines) || wines.length === 0) {
      return NextResponse.json(
        { error: "At least one wine is required" },
        { status: 400 },
      );
    }

    if (wines.length > 6) {
      return NextResponse.json(
        { error: "Maximum 6 wines per flight" },
        { status: 400 },
      );
    }

    const flight = await prisma.tastingFlight.create({
      data: {
        userId: session.user.id,
        name: name ?? null,
        path: path as unknown as Prisma.InputJsonValue,
        wines: wines as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(flight, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Create flight error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
