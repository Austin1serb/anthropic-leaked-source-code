import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Trophy, Crown, Wine } from "lucide-react";

interface Props {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ guest?: string }>;
}

async function getResultsData(eventId: string) {
  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.status !== "completed") return null;

  const [blindWines, guests, guesses] = await Promise.all([
    prisma.blindWine.findMany({
      where: { eventId },
      orderBy: { position: "asc" },
    }),
    prisma.guestParticipant.findMany({ where: { eventId } }),
    prisma.blindGuess.findMany({ where: { eventId } }),
  ]);

  const wineIds = blindWines.map((bw) => bw.wineId);
  const wines = await prisma.wine.findMany({
    where: { id: { in: wineIds } },
  });
  const wineMap = new Map(wines.map((w) => [w.id, w]));

  // Calculate scores
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
      displayName: g.displayName,
      totalScore: scoresByGuest.get(g.id) ?? 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return {
    event,
    ranked,
    blindWines,
    wineMap,
    guesses,
    guestCount: guests.length,
    wineCount: blindWines.length,
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const { guest: guestId } = await searchParams;
  const data = await getResultsData(eventId);
  if (!data) return { title: "Results not found" };

  const guestRank = guestId
    ? data.ranked.findIndex((g) => g.id === guestId) + 1
    : 0;
  const guestScore = guestId
    ? data.ranked.find((g) => g.id === guestId)?.totalScore ?? 0
    : 0;
  const guestName = guestId
    ? data.ranked.find((g) => g.id === guestId)?.displayName ?? ""
    : "";

  const description = guestId && guestRank > 0
    ? `${guestName} scored ${guestScore} pts and placed #${guestRank} of ${data.guestCount} in "${data.event.title}"`
    : `${data.guestCount} tasters competed across ${data.wineCount} wines in "${data.event.title}"`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://winebob.com";
  const ogUrl = new URL(`/api/og/results`, baseUrl);
  ogUrl.searchParams.set("event", eventId);
  if (guestId) ogUrl.searchParams.set("guest", guestId);

  return {
    title: `${data.event.title} — Results | WineBob`,
    description,
    openGraph: {
      title: `${data.event.title} — Tasting Results`,
      description,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
  };
}

const MEDAL_COLORS = [
  "bg-amber-400 text-white",
  "bg-gray-300 text-gray-700",
  "bg-orange-300 text-orange-800",
];

export default async function ResultsPage({ params, searchParams }: Props) {
  const { eventId } = await params;
  const { guest: guestId } = await searchParams;
  const data = await getResultsData(eventId);

  if (!data) notFound();

  const { event, ranked, blindWines, wineMap, guesses } = data;
  const myRank = guestId ? ranked.findIndex((g) => g.id === guestId) + 1 : 0;

  const myWineScores = guestId
    ? guesses
        .filter((g) => g.guestId === guestId)
        .sort((a, b) => a.winePosition - b.winePosition)
    : [];

  return (
    <div className="min-h-dvh bg-background safe-top safe-bottom">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="h-20 w-20 rounded-[16px] bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
            <Trophy className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">
            {event.title}
          </h1>
          <p className="text-muted mt-2 text-[15px]">
            {ranked.length} taster{ranked.length !== 1 ? "s" : ""} &middot;{" "}
            {blindWines.length} wine{blindWines.length !== 1 ? "s" : ""}
          </p>
          {myRank > 0 && (
            <p className="mt-3 text-cherry font-bold text-[18px] nums">
              You placed #{myRank} of {ranked.length}
            </p>
          )}
        </div>

        {/* Per-wine breakdown (if viewing as a specific guest) */}
        {myWineScores.length > 0 && (
          <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-4 mb-6 animate-fade-in-up">
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-3">
              Your Breakdown
            </h3>
            <div className="space-y-1.5">
              {myWineScores.map((ws) => {
                const blindWine = blindWines.find(
                  (bw) => bw.position === ws.winePosition
                );
                const wine = blindWine ? wineMap.get(blindWine.wineId) : null;
                return (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Wine className="h-4 w-4 text-cherry/60 shrink-0" />
                      <span className="text-[13px] text-muted font-medium truncate">
                        {wine
                          ? `${wine.name} ${wine.vintage ?? "NV"}`
                          : `Wine #${ws.winePosition}`}
                      </span>
                    </div>
                    <span className="text-[14px] font-bold text-foreground nums ml-3">
                      {ws.score ?? 0} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <h2 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-3">
          Scoreboard
        </h2>
        <div className="rounded-[16px] bg-card-bg border border-card-border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
          {ranked.map((g, i) => (
            <div
              key={g.id}
              className={`flex items-center gap-3.5 px-4 ${
                i < 3 ? "py-4" : "py-3.5"
              } ${
                i === 0 ? "bg-widget-gold/30" : g.id === guestId ? "bg-cherry/5" : ""
              } ${
                g.id === guestId ? "border-l-4 border-cherry" : ""
              } ${
                i < ranked.length - 1 ? "border-b border-card-border/30" : ""
              }`}
            >
              <div
                className={`${
                  i < 3 ? "h-10 w-10" : "h-9 w-9"
                } rounded-[12px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                  i < 3
                    ? MEDAL_COLORS[i]
                    : "bg-card-border/30 text-muted"
                }`}
              >
                {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[14px] font-semibold truncate ${
                    g.id === guestId ? "text-cherry" : "text-foreground"
                  }`}
                >
                  {g.displayName}
                  {g.id === guestId && (
                    <span className="text-[11px] text-muted ml-1.5">
                      (you)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-[16px] font-bold nums text-foreground">
                {g.totalScore}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center animate-fade-in-up">
          <a href="/" className="btn-primary inline-block touch-target">
            Try WineBob
          </a>
        </div>
      </div>
    </div>
  );
}
