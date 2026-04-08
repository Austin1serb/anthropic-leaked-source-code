import { prisma } from "@/lib/db";
import { createHash } from "crypto";

// ── Rate limiter (in-memory, per serverless instance) ──

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if an identifier has exceeded its rate limit.
 * Returns true if rate-limited (should reject), false if allowed.
 */
export function rateLimitCheck(
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(identifier);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count++;
  return bucket.count > limit;
}

// ── API key types ──

export type ValidatedApiKey = {
  id: string;
  name: string;
  producerName: string;
  tier: string;
  permissions: string[];
  rateLimit: number;
};

/**
 * Hash a raw API key for database lookup.
 * Keys are stored hashed (SHA-256) in the database.
 */
function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validate an API key from a request.
 * Extracts Bearer token from Authorization header, looks up the hashed key,
 * checks expiration and rate limit, updates lastUsedAt.
 * Returns the key record or null if invalid.
 */
export async function validateApiKey(
  request: Request
): Promise<ValidatedApiKey | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("wb_")) return null;

  const hashedKey = hashKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
  });

  if (!apiKey) return null;

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Check rate limit
  const windowMs = 60 * 60 * 1000; // 1 hour
  if (rateLimitCheck(`apikey:${apiKey.id}`, apiKey.rateLimit, windowMs)) {
    return null;
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    id: apiKey.id,
    name: apiKey.name,
    producerName: apiKey.producerName,
    tier: apiKey.tier,
    permissions: apiKey.permissions,
    rateLimit: apiKey.rateLimit,
  };
}

/**
 * Check if an API key has a specific permission.
 */
export function checkPermission(
  apiKey: ValidatedApiKey,
  permission: string
): boolean {
  return apiKey.permissions.includes(permission);
}

/**
 * Generate a new raw API key (unhashed, to be returned to the user once).
 * Returns { rawKey, hashedKey }.
 */
export function generateApiKey(): { rawKey: string; hashedKey: string } {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const rawKey = `wb_${Buffer.from(bytes).toString("base64url")}`;
  const hashedKey = hashKey(rawKey);
  return { rawKey, hashedKey };
}
