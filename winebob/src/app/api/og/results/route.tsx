import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const eventId = searchParams.get("event");
  const guestId = searchParams.get("guest");

  if (!eventId) {
    return new Response("Missing event param", { status: 400 });
  }

  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  // Gather scores
  const [guests, guesses] = await Promise.all([
    prisma.guestParticipant.findMany({ where: { eventId } }),
    prisma.blindGuess.findMany({ where: { eventId } }),
  ]);

  const scoresByGuest = new Map<string, number>();
  for (const guess of guesses) {
    scoresByGuest.set(
      guess.guestId,
      (scoresByGuest.get(guess.guestId) ?? 0) + (guess.score ?? 0)
    );
  }

  const ranked = guests
    .map((g) => ({
      id: g.id,
      name: g.displayName,
      score: scoresByGuest.get(g.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const guestRank = guestId
    ? ranked.findIndex((g) => g.id === guestId) + 1
    : 0;
  const guestName = guestId
    ? ranked.find((g) => g.id === guestId)?.name ?? ""
    : "";
  const guestScore = guestId
    ? ranked.find((g) => g.id === guestId)?.score ?? 0
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #FEF9F0 0%, #F5E6D3 50%, #E8D5C0 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#6B1D2A",
              letterSpacing: "-0.5px",
            }}
          >
            WineBob
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#8B6F5E",
              marginLeft: "auto",
            }}
          >
            Blind Tasting Results
          </div>
        </div>

        {/* Event title */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#1A1412",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          {event.title}
        </div>

        {/* Personal result */}
        {guestId && guestRank > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              background: "rgba(255,255,255,0.7)",
              borderRadius: "20px",
              padding: "28px 36px",
              marginBottom: "32px",
              border: "1px solid rgba(107,29,42,0.15)",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                fontWeight: 800,
                color: "#6B1D2A",
              }}
            >
              #{guestRank}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1A1412" }}>
                {guestName}
              </div>
              <div style={{ fontSize: "22px", color: "#8B6F5E" }}>
                {guestScore} points &middot; {ranked.length} tasters
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: "22px",
              color: "#8B6F5E",
              marginBottom: "32px",
            }}
          >
            {ranked.length} tasters competed
          </div>
        )}

        {/* Top 3 mini-leaderboard */}
        <div style={{ display: "flex", gap: "16px", marginTop: "auto" }}>
          {ranked.slice(0, 3).map((g, i) => (
            <div
              key={g.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: i === 0 ? "rgba(245,200,66,0.25)" : "rgba(255,255,255,0.5)",
                borderRadius: "14px",
                padding: "14px 20px",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: i === 0 ? "#B8860B" : "#8B6F5E",
                }}
              >
                {i + 1}.
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#1A1412" }}>
                {g.name}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#6B1D2A",
                  marginLeft: "auto",
                }}
              >
                {g.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
