/**
 * Wine Label Scanner Service
 *
 * Uses Claude Vision API to identify wine from a label photo.
 * Returns structured wine information for search/matching.
 */

import Anthropic from "@anthropic-ai/sdk";

type ScanResult = {
  name: string;
  producer: string;
  vintage: number | null;
  grapes: string[];
  region: string;
  country: string;
  appellation: string | null;
  type: string;
  confidence: number;
};

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

/**
 * Scan a wine label image and extract structured wine information.
 * @param imageBase64 - Base64-encoded image data
 * @param mediaType - Image MIME type
 */
export async function scanWineLabel(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<ScanResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analyze this wine label and extract the following information. Return ONLY valid JSON, no other text.

{
  "name": "Full wine name as it appears on the label",
  "producer": "Producer/winery name",
  "vintage": 2020 or null if NV,
  "grapes": ["Grape variety 1", "Grape variety 2"],
  "region": "Wine region",
  "country": "Country",
  "appellation": "AOC/DOC/AVA appellation if visible, or null",
  "type": "red|white|rosé|sparkling|dessert|fortified|orange",
  "confidence": 0.95
}

If you cannot identify certain fields, use your best guess based on the region and label style. Set confidence lower (0.5-0.7) if uncertain.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from label scan");
  }

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const result = JSON.parse(jsonStr) as ScanResult;

  // Validate and sanitize
  return {
    name: result.name || "Unknown Wine",
    producer: result.producer || "Unknown Producer",
    vintage: typeof result.vintage === "number" ? result.vintage : null,
    grapes: Array.isArray(result.grapes) ? result.grapes : [],
    region: result.region || "Unknown",
    country: result.country || "Unknown",
    appellation: result.appellation || null,
    type: result.type || "red",
    confidence: typeof result.confidence === "number" ? result.confidence : 0.5,
  };
}
