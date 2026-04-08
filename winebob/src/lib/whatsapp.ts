/**
 * WhatsApp Cloud API client for sending tasting results.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN          – Permanent system-user token from Meta Business
 *   WHATSAPP_PHONE_ID       – Phone number ID (not the phone number itself)
 *   NEXT_PUBLIC_BASE_URL    – Public URL of the app (for result links)
 *
 * Meta template messages must be pre-approved in the WhatsApp Manager.
 * We use one template: "tasting_results" with these variables:
 *   {{1}} = guest display name
 *   {{2}} = event title
 *   {{3}} = total score
 *   {{4}} = rank (e.g. "2nd of 8")
 *   {{5}} = results page URL
 */

const API_BASE = "https://graph.facebook.com/v21.0";

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://winebob.com";

  if (!token || !phoneId) {
    throw new Error(
      "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID environment variables"
    );
  }

  return { token, phoneId, baseUrl };
}

// ── Types ──

interface WhatsAppResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface TastingResultPayload {
  to: string; // E.164 phone number
  guestName: string;
  eventTitle: string;
  totalScore: number;
  rank: string; // e.g. "2nd of 8"
  resultsUrl: string;
}

// ── Send template message (pre-approved, works outside 24h window) ──

export async function sendTastingResults(
  payload: TastingResultPayload
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  const { token, phoneId } = getConfig();

  const body = {
    messaging_product: "whatsapp",
    to: payload.to,
    type: "template",
    template: {
      name: "tasting_results",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: payload.guestName },
            { type: "text", text: payload.eventTitle },
            { type: "text", text: String(payload.totalScore) },
            { type: "text", text: payload.rank },
            { type: "text", text: payload.resultsUrl },
          ],
        },
      ],
    },
  };

  try {
    const res = await fetch(`${API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as WhatsAppError;
      return {
        success: false,
        error: err.error?.message ?? `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as WhatsAppResponse;
    return { success: true, messageId: data.messages[0].id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ── Send a free-form text message (only works within 24h conversation window) ──

export async function sendTextMessage(
  to: string,
  text: string
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  const { token, phoneId } = getConfig();

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { preview_url: true, body: text },
  };

  try {
    const res = await fetch(`${API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as WhatsAppError;
      return {
        success: false,
        error: err.error?.message ?? `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as WhatsAppResponse;
    return { success: true, messageId: data.messages[0].id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ── Validate E.164 phone number ──

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

// ── Build results URL ──

export function buildResultsUrl(eventId: string, guestId: string): string {
  const { baseUrl } = getConfig();
  return `${baseUrl}/results/${eventId}?guest=${guestId}`;
}

// ── Ordinal helper (1 → "1st", 2 → "2nd", etc.) ──

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
