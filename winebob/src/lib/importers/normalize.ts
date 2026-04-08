/**
 * Shared normalization utilities for wine data imports.
 */

// Common abbreviation expansions for wine names
const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  "ch.": "Château",
  "dom.": "Domaine",
  "st.": "Saint",
  "ste.": "Sainte",
  "mt.": "Mount",
  "ft.": "Fort",
};

// Common grape alias mappings (alias -> canonical name)
const GRAPE_ALIASES: Record<string, string> = {
  "cab sav": "Cabernet Sauvignon",
  "cab": "Cabernet Sauvignon",
  "cabernet": "Cabernet Sauvignon",
  "cab franc": "Cabernet Franc",
  "sav blanc": "Sauvignon Blanc",
  "sauvignon": "Sauvignon Blanc",
  "pinot grigio": "Pinot Gris",
  "pinot grigo": "Pinot Gris",
  "shiraz": "Syrah",
  "syrah/shiraz": "Syrah",
  "garnacha": "Grenache",
  "garnatxa": "Grenache",
  "spätburgunder": "Pinot Noir",
  "blauburgunder": "Pinot Noir",
  "grauburgunder": "Pinot Gris",
  "weissburgunder": "Pinot Blanc",
  "weißburgunder": "Pinot Blanc",
  "tempranillo": "Tempranillo",
  "tinta roriz": "Tempranillo",
  "tinto fino": "Tempranillo",
  "cencibel": "Tempranillo",
  "aragonez": "Tempranillo",
  "ull de llebre": "Tempranillo",
  "sangiovese grosso": "Sangiovese",
  "brunello": "Sangiovese",
  "prugnolo gentile": "Sangiovese",
  "morellino": "Sangiovese",
  "nielluccio": "Sangiovese",
  "mourvèdre": "Mourvèdre",
  "mourvedre": "Mourvèdre",
  "monastrell": "Mourvèdre",
  "mataro": "Mourvèdre",
  "pinot meunier": "Meunier",
  "meunier": "Meunier",
  "schwarzriesling": "Meunier",
  "trebbiano": "Ugni Blanc",
  "ugni blanc": "Ugni Blanc",
  "grüner veltliner": "Grüner Veltliner",
  "gruner veltliner": "Grüner Veltliner",
  "cariñena": "Carignan",
  "carignane": "Carignan",
  "mazuelo": "Carignan",
  "zinfandel": "Zinfandel",
  "primitivo": "Zinfandel",
  "malbec": "Malbec",
  "côt": "Malbec",
  "cot": "Malbec",
  "auxerrois": "Malbec",
};

/**
 * Convert a string to proper title case, handling wine-specific conventions.
 */
function toProperCase(str: string): string {
  // Common lowercase words that should stay lowercase (unless first word)
  const lowerWords = new Set(["de", "di", "du", "da", "des", "del", "della", "delle", "von", "van", "le", "la", "les", "et", "y", "e", "do", "dos"]);

  return str
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && lowerWords.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      // Preserve existing capitalization for words with internal caps (e.g., "McDonald")
      if (word.length > 1 && word !== word.toLowerCase() && word !== word.toUpperCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Normalize Unicode accented characters to their base + combining form,
 * then re-compose. This standardizes different Unicode representations
 * of the same accented character. Preserves accents for display.
 */
function normalizeAccents(str: string): string {
  // NFC normalization: compose characters into canonical form
  return str.normalize("NFC");
}

/**
 * Strip accents for comparison/deduplication purposes.
 * "Château" -> "Chateau", "Côtes" -> "Cotes", etc.
 * Do NOT use this for display — only for fingerprinting/dedup.
 */
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Expand common wine abbreviations for display normalization.
 * "Ch. Margaux" -> "Château Margaux", "Dom. Romanée" -> "Domaine Romanée"
 */
function expandAbbreviations(str: string): string {
  return str.replace(/\b\w+\./g, (match) => {
    const expansion = ABBREVIATION_EXPANSIONS[match.toLowerCase()];
    return expansion ?? match;
  });
}

/**
 * Decode common HTML entities found in scraped/imported wine data.
 * "&amp;quot;Fruits And Wine&amp;quot; rosé" -> "\"Fruits And Wine\" rosé"
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Normalize a wine name: trim whitespace, proper capitalization, standardize accents.
 */
export function normalizeWineName(name: string): string {
  if (!name) return "";

  let normalized = name.trim();

  // Decode common HTML entities from scraped data
  normalized = decodeHtmlEntities(normalized);

  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, " ");

  // Expand common abbreviations (Ch. -> Château, Dom. -> Domaine, etc.)
  normalized = expandAbbreviations(normalized);

  // Standardize accents (preserve for display)
  normalized = normalizeAccents(normalized);

  // Proper case
  normalized = toProperCase(normalized);

  return normalized;
}

/**
 * Normalize a producer name: similar to wine name normalization.
 */
export function normalizeProducerName(name: string): string {
  if (!name) return "";

  let normalized = name.trim();

  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, " ");

  // Expand common abbreviations (Ch. -> Château, Dom. -> Domaine, etc.)
  normalized = expandAbbreviations(normalized);

  // Standardize accents (preserve for display)
  normalized = normalizeAccents(normalized);

  // Proper case
  normalized = toProperCase(normalized);

  return normalized;
}

/**
 * Normalize a grape name: map aliases to canonical names, proper case.
 */
export function normalizeGrapeName(name: string): string {
  if (!name) return "";

  let normalized = name.trim();
  normalized = normalized.replace(/\s+/g, " ");
  normalized = normalizeAccents(normalized);

  // Check alias mapping (case-insensitive)
  const alias = GRAPE_ALIASES[normalized.toLowerCase()];
  if (alias) {
    return alias;
  }

  // Proper case if no alias found
  return toProperCase(normalized);
}

/**
 * Generate a deterministic fingerprint for deduplication.
 * Based on normalized name + producer + optional vintage.
 */
export function generateWineFingerprint(
  name: string,
  producer: string,
  vintage?: number | null
): string {
  // Strip accents so "Château" and "Chateau" produce the same fingerprint
  const normalizedName = stripAccents(normalizeWineName(name).toLowerCase());
  const normalizedProducer = stripAccents(normalizeProducerName(producer).toLowerCase());
  const vintageStr = vintage != null ? String(vintage) : "nv";

  const input = `${normalizedName}|${normalizedProducer}|${vintageStr}`;

  // Simple deterministic hash (djb2 variant)
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }

  // Convert to hex string, ensure positive
  return (hash >>> 0).toString(16).padStart(8, "0");
}
