import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic();

const SCAN_PROMPT = `You are a wine label recognition expert. Analyze this wine label image and extract the following information. Return ONLY valid JSON, no markdown.

{
  "name": "Full wine name as it appears on the label",
  "producer": "Winery/producer name",
  "vintage": 2020 or null if NV/not visible,
  "region": "Wine region (e.g. Bordeaux, Tuscany, Napa Valley)",
  "country": "Country of origin",
  "appellation": "Specific appellation if visible (e.g. Margaux AOC, Barolo DOCG)",
  "type": "red|white|rosé|sparkling|dessert|fortified|orange (best guess from label)",
  "grapes": ["Array of grape varieties if mentioned"],
  "abv": 13.5 or null if not visible,
  "confidence": 0.0 to 1.0 how confident you are in the identification
}

If you cannot identify the wine at all, return {"error": "Could not identify wine", "confidence": 0}.
Focus on accuracy — it's better to return fewer fields with high confidence than guess everything.`;

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    // Subscription check
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || subscription.status !== "active") {
      return Response.json(
        { error: "subscription_required", message: "An active subscription is required to scan wines." },
        { status: 403 }
      );
    }

    // Get image from request
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate base64 image
    const isBase64 = image.startsWith("data:image/");
    if (!isBase64) {
      return Response.json({ error: "Image must be base64 data URI" }, { status: 400 });
    }

    // Extract media type and base64 data
    const mediaTypeMatch = image.match(/^data:(image\/[a-z]+);base64,/);
    if (!mediaTypeMatch) {
      return Response.json({ error: "Invalid image format" }, { status: 400 });
    }
    const mediaType = mediaTypeMatch[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "");

    // Call Claude Vision
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            { type: "text", text: SCAN_PROMPT },
          ],
        },
      ],
    });

    // Parse Claude's response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    let result: Record<string, unknown>;
    try {
      // Strip markdown code fences if present
      const cleaned = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "Could not parse AI response", raw: textBlock.text }, { status: 500 });
    }

    // Try to match against existing wines in DB
    let matchedWineId: string | null = null;
    if (result.name && typeof result.name === "string") {
      const where: Record<string, unknown> = {
        name: { contains: result.name, mode: "insensitive" },
      };
      if (result.vintage) where.vintage = result.vintage;

      const match = await prisma.wine.findFirst({ where });
      if (match) matchedWineId = match.id;
    }

    // Save scan to history
    const scan = await prisma.wineScan.create({
      data: {
        userId: session.user.id,
        result: result as any,
        matchedWineId,
        confidence: typeof result.confidence === "number" ? result.confidence : 0,
      },
    });

    return Response.json({
      scanId: scan.id,
      result,
      matchedWineId,
      matchedWine: matchedWineId
        ? await prisma.wine.findUnique({
            where: { id: matchedWineId },
            select: { id: true, name: true, producer: true, vintage: true, region: true, country: true, type: true, grapes: true, priceRange: true, tastingNotes: true },
          })
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Scan error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
