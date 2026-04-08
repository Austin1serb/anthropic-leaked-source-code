import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * Verify admin access via AGGREGATION_SECRET.
 */
function isAdmin(request: Request): boolean {
  const secret = process.env.AGGREGATION_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * POST /api/analytics/keys
 *
 * Create a new API key for a producer. Admin only.
 * Body: { name, producerName, tier?, permissions?, rateLimit?, expiresAt? }
 * Returns the raw key (shown only once) and key metadata.
 */
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Admin access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, producerName, tier, permissions, rateLimit, expiresAt } = body;

    if (!name || !producerName) {
      return Response.json(
        { error: "Missing required fields: name, producerName" },
        { status: 400 }
      );
    }

    const { rawKey, hashedKey } = generateApiKey();

    const defaultPermissions =
      tier === "premium"
        ? ["read:own_insights", "read:region_trends", "read:demographics", "export:csv"]
        : tier === "basic"
        ? ["read:own_insights", "read:region_trends"]
        : ["read:own_insights"];

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        name,
        producerName,
        tier: tier ?? "free",
        permissions: permissions ?? defaultPermissions,
        rateLimit: rateLimit ?? 100,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return Response.json({
      id: apiKey.id,
      rawKey, // Show only once — cannot be retrieved again
      name: apiKey.name,
      producerName: apiKey.producerName,
      tier: apiKey.tier,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/analytics/keys?producer=X
 *
 * List API keys for a producer. Admin only.
 * Returns key metadata (never the key hash itself).
 */
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Admin access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const producer = searchParams.get("producer");

  const where = producer ? { producerName: producer } : {};

  const keys = await prisma.apiKey.findMany({
    where,
    select: {
      id: true,
      name: true,
      producerName: true,
      tier: true,
      permissions: true,
      rateLimit: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ keys });
}

/**
 * DELETE /api/analytics/keys?id=xxx
 *
 * Revoke an API key. Admin only.
 */
export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Admin access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  try {
    await prisma.apiKey.delete({ where: { id } });
    return Response.json({ deleted: true, id });
  } catch {
    return Response.json({ error: "Key not found" }, { status: 404 });
  }
}
