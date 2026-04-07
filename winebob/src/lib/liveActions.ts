"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ SOMMELIER PROFILE ============

export async function getSommelierProfile(userId?: string) {
  if (!userId) {
    const session = await requireAuth();
    userId = session.user.id;
  }
  return prisma.sommelierProfile.findUnique({ where: { userId } });
}

export async function getMyProfile() {
  const session = await requireAuth();
  return prisma.sommelierProfile.findUnique({ where: { userId: session.user.id } });
}

export async function createSommelierProfile(data: {
  displayName: string;
  bio?: string;
  expertise: string[];
  certifications: string[];
}) {
  const session = await requireAuth();

  const existing = await prisma.sommelierProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) throw new Error("Profile already exists");

  return prisma.sommelierProfile.create({
    data: {
      userId: session.user.id,
      displayName: data.displayName,
      bio: data.bio,
      expertise: data.expertise,
      certifications: data.certifications,
    },
  });
}

export async function updateSommelierProfile(data: {
  displayName?: string;
  bio?: string;
  avatar?: string;
  expertise?: string[];
  certifications?: string[];
}) {
  const session = await requireAuth();
  return prisma.sommelierProfile.update({
    where: { userId: session.user.id },
    data,
  });
}

export async function getAllSommeliers() {
  return prisma.sommelierProfile.findMany({
    orderBy: [{ verified: "desc" }, { rating: "desc" }, { totalEvents: "desc" }],
  });
}

// ============ LIVE EVENT MANAGEMENT ============

export async function createLiveEvent(data: {
  title: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  scheduledAt: string; // ISO date string
  maxParticipants?: number;
  guessFields: string[];
  scoringConfig: Record<string, number>;
  difficulty: string;
  showCrowdStats?: boolean;
  wines: { wineId: string; hints: { content: string; hintType: string }[] }[];
}) {
  const session = await requireAuth();

  const profile = await prisma.sommelierProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("You need a sommelier profile to host live events");

  // Validate wine IDs
  const wineIds = data.wines.map((w) => w.wineId);
  if (wineIds.length === 0) throw new Error("At least one wine is required");

  const existingWines = await prisma.wine.findMany({
    where: { id: { in: wineIds } },
    select: { id: true },
  });
  const existingSet = new Set(existingWines.map((w) => w.id));
  const invalid = wineIds.filter((id) => !existingSet.has(id));
  if (invalid.length > 0) throw new Error(`Invalid wine IDs: ${invalid.join(", ")}`);

  // Generate join code for private events
  let joinCode: string | null = null;
  if (!data.isPublic) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    joinCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  // Create event
  const event = await prisma.liveEvent.create({
    data: {
      sommelierId: profile.id,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      isPublic: data.isPublic,
      joinCode,
      scheduledAt: new Date(data.scheduledAt),
      maxParticipants: data.maxParticipants,
      guessFields: data.guessFields,
      scoringConfig: data.scoringConfig,
      difficulty: data.difficulty,
      showCrowdStats: data.showCrowdStats ?? true,
    },
  });

  // Create wines + hints (separately for Neon HTTP adapter)
  for (let i = 0; i < data.wines.length; i++) {
    const w = data.wines[i];
    const liveWine = await prisma.liveWine.create({
      data: {
        eventId: event.id,
        wineId: w.wineId,
        position: i + 1,
      },
    });

    // Create hints for this wine
    for (let h = 0; h < w.hints.length; h++) {
      await prisma.liveHint.create({
        data: {
          wineId: liveWine.id,
          position: h + 1,
          content: w.hints[h].content,
          hintType: w.hints[h].hintType,
        },
      });
    }
  }

  // Increment sommelier event count
  await prisma.sommelierProfile.update({
    where: { id: profile.id },
    data: { totalEvents: { increment: 1 } },
  });

  revalidatePath("/live");
  return event;
}

// ============ LIVE EVENT CONTROL (sommelier) ============

export async function startLiveEvent(eventId: string) {
  const session = await requireAuth();
  const event = await getLiveEventWithAuth(eventId, session.user.id);
  if (event.status !== "scheduled") throw new Error("Event is not in scheduled state");

  await prisma.liveEvent.update({
    where: { id: eventId },
    data: { status: "live", startedAt: new Date() },
  });
  revalidatePath(`/live/${eventId}`);
}

export async function releaseHint(hintId: string) {
  const session = await requireAuth();

  const hint = await prisma.liveHint.findUnique({
    where: { id: hintId },
    include: { wine: { include: { event: { include: { sommelier: true } } } } },
  });
  if (!hint) throw new Error("Hint not found");
  if (hint.wine.event.sommelier.userId !== session.user.id) throw new Error("Not authorized");
  if (hint.revealed) return; // idempotent

  await prisma.liveHint.update({
    where: { id: hintId },
    data: { revealed: true, revealedAt: new Date() },
  });
  revalidatePath(`/live/${hint.wine.eventId}`);
}

export async function revealLiveWine(eventId: string, position: number) {
  const session = await requireAuth();
  const event = await getLiveEventWithAuth(eventId, session.user.id);
  if (event.status !== "live") throw new Error("Event is not live");

  const liveWine = await prisma.liveWine.findFirst({
    where: { eventId, position },
  });
  if (!liveWine) throw new Error("Wine not found");
  if (liveWine.revealed) return; // idempotent

  await prisma.liveWine.update({
    where: { id: liveWine.id },
    data: { revealed: true, revealedAt: new Date() },
  });

  // Score all guesses for this wine
  await scoreLiveWine(eventId, position);

  revalidatePath(`/live/${eventId}`);
}

export async function completeLiveEvent(eventId: string) {
  const session = await requireAuth();
  const event = await getLiveEventWithAuth(eventId, session.user.id);
  if (event.status !== "live") throw new Error("Event is not live");

  // Final scoring pass
  const unrevealed = await prisma.liveWine.findMany({
    where: { eventId, revealed: false },
  });
  for (const w of unrevealed) {
    await prisma.liveWine.update({
      where: { id: w.id },
      data: { revealed: true, revealedAt: new Date() },
    });
    await scoreLiveWine(eventId, w.position);
  }

  await prisma.liveEvent.update({
    where: { id: eventId },
    data: { status: "completed", completedAt: new Date() },
  });

  // Update sommelier viewer count
  const participantCount = await prisma.liveParticipant.count({ where: { eventId } });
  await prisma.sommelierProfile.update({
    where: { id: event.sommelierId },
    data: { totalViewers: { increment: participantCount } },
  });

  revalidatePath(`/live/${eventId}`);
}

// ============ PARTICIPANT ACTIONS ============

export async function joinLiveEvent(data: {
  eventId: string;
  displayName: string;
  joinCode?: string; // required for private events
}) {
  const event = await prisma.liveEvent.findUnique({ where: { id: data.eventId } });
  if (!event) throw new Error("Event not found");
  if (event.status === "completed" || event.status === "cancelled") {
    throw new Error("Event has ended");
  }

  // Private event: verify join code
  if (!event.isPublic) {
    if (!data.joinCode || data.joinCode.toUpperCase() !== event.joinCode) {
      throw new Error("Invalid join code");
    }
  }

  // Check max participants
  if (event.maxParticipants) {
    const count = await prisma.liveParticipant.count({ where: { eventId: data.eventId } });
    if (count >= event.maxParticipants) throw new Error("Event is full");
  }

  const participant = await prisma.liveParticipant.create({
    data: {
      eventId: data.eventId,
      displayName: data.displayName,
    },
  });

  return { participantId: participant.id, sessionToken: participant.sessionToken };
}

export async function submitLiveGuess(data: {
  eventId: string;
  participantId: string;
  sessionToken: string;
  winePosition: number;
  guessedGrape?: string;
  guessedRegion?: string;
  guessedCountry?: string;
  guessedVintage?: number;
  guessedProducer?: string;
  guessedType?: string;
  guessedPrice?: number;
  notes?: string;
}) {
  // Verify participant identity
  const participant = await prisma.liveParticipant.findFirst({
    where: { id: data.participantId, sessionToken: data.sessionToken, eventId: data.eventId },
  });
  if (!participant) throw new Error("Invalid participant");

  // Verify event is live
  const event = await prisma.liveEvent.findUnique({ where: { id: data.eventId } });
  if (!event || event.status !== "live") throw new Error("Event is not accepting guesses");

  // Verify wine is not revealed (submission lock)
  const liveWine = await prisma.liveWine.findFirst({
    where: { eventId: data.eventId, position: data.winePosition },
  });
  if (!liveWine) throw new Error("Wine not found");
  if (liveWine.revealed) throw new Error("Wine already revealed — guesses locked");

  // Upsert guess (can update until revealed)
  await prisma.liveGuess.upsert({
    where: {
      eventId_participantId_winePosition: {
        eventId: data.eventId,
        participantId: data.participantId,
        winePosition: data.winePosition,
      },
    },
    create: {
      eventId: data.eventId,
      participantId: data.participantId,
      winePosition: data.winePosition,
      guessedGrape: data.guessedGrape,
      guessedRegion: data.guessedRegion,
      guessedCountry: data.guessedCountry,
      guessedVintage: data.guessedVintage,
      guessedProducer: data.guessedProducer,
      guessedType: data.guessedType,
      guessedPrice: data.guessedPrice,
      notes: data.notes,
    },
    update: {
      guessedGrape: data.guessedGrape,
      guessedRegion: data.guessedRegion,
      guessedCountry: data.guessedCountry,
      guessedVintage: data.guessedVintage,
      guessedProducer: data.guessedProducer,
      guessedType: data.guessedType,
      guessedPrice: data.guessedPrice,
      notes: data.notes,
    },
  });

  revalidatePath(`/live/${data.eventId}`);
}

// ============ DATA FETCHING ============

export async function getUpcomingLiveEvents() {
  return prisma.liveEvent.findMany({
    where: {
      isPublic: true,
      status: { in: ["scheduled", "live"] },
    },
    orderBy: [{ status: "desc" }, { scheduledAt: "asc" }], // live first, then by date
    include: {
      sommelier: { select: { displayName: true, avatar: true, verified: true, expertise: true } },
      _count: { select: { participants: true, wines: true } },
    },
  });
}

export async function getLiveEventById(id: string) {
  const event = await prisma.liveEvent.findUnique({
    where: { id },
    include: {
      sommelier: { select: { id: true, displayName: true, avatar: true, verified: true, expertise: true, userId: true } },
      participants: { select: { id: true, displayName: true } },
      wines: { orderBy: { position: "asc" } },
      guesses: true,
    },
  });
  if (!event) return null;

  // Fetch actual wine data + hints separately (Neon adapter)
  const liveWineIds = event.wines.map((w) => w.id);
  const wineIds = event.wines.map((w) => w.wineId);

  const [wines, hints] = await Promise.all([
    wineIds.length > 0 ? prisma.wine.findMany({ where: { id: { in: wineIds } } }) : [],
    liveWineIds.length > 0 ? prisma.liveHint.findMany({ where: { wineId: { in: liveWineIds } }, orderBy: { position: "asc" } }) : [],
  ]);

  const wineMap = new Map(wines.map((w) => [w.id, w]));
  const hintsByWine = new Map<string, typeof hints>();
  for (const h of hints) {
    const arr = hintsByWine.get(h.wineId) ?? [];
    arr.push(h);
    hintsByWine.set(h.wineId, arr);
  }

  return {
    ...event,
    wines: event.wines.map((lw) => ({
      ...lw,
      wine: wineMap.get(lw.wineId) ?? null,
      hints: hintsByWine.get(lw.id) ?? [],
    })),
  };
}

export async function getCrowdStats(eventId: string, winePosition: number) {
  const guesses = await prisma.liveGuess.findMany({
    where: { eventId, winePosition },
  });

  const stats: Record<string, Record<string, number>> = {};
  const fields = ["guessedGrape", "guessedRegion", "guessedCountry", "guessedType"] as const;

  for (const field of fields) {
    const counts: Record<string, number> = {};
    for (const g of guesses) {
      const val = g[field];
      if (val) counts[val] = (counts[val] ?? 0) + 1;
    }
    // Sort by count, take top 5
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length > 0) {
      stats[field.replace("guessed", "").toLowerCase()] = Object.fromEntries(
        sorted.map(([k, v]) => [k, Math.round((v / guesses.length) * 100)])
      );
    }
  }

  return { stats, totalGuesses: guesses.length };
}

// ============ HELPERS ============

async function getLiveEventWithAuth(eventId: string, userId: string) {
  const event = await prisma.liveEvent.findUnique({
    where: { id: eventId },
    include: { sommelier: true },
  });
  if (!event) throw new Error("Event not found");
  if (event.sommelier.userId !== userId) throw new Error("Not authorized");
  return event;
}

async function scoreLiveWine(eventId: string, position: number) {
  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const liveWine = await prisma.liveWine.findFirst({ where: { eventId, position } });
  if (!liveWine) return;

  const actual = await prisma.wine.findUnique({ where: { id: liveWine.wineId } });
  if (!actual) return;

  const guesses = await prisma.liveGuess.findMany({
    where: { eventId, winePosition: position },
  });

  const weights = (event.scoringConfig as Record<string, number>) ?? {
    grape: 25, region: 20, country: 15, vintage: 15, producer: 15, type: 10,
  };

  const norm = (s: string) => s.trim().toLowerCase();

  await Promise.all(
    guesses.map((guess) => {
      let score = 0;

      if (weights.grape && guess.guessedGrape) {
        if (actual.grapes.some((g: string) => norm(g) === norm(guess.guessedGrape!))) score += weights.grape;
      }
      if (weights.region && guess.guessedRegion) {
        if (norm(actual.region) === norm(guess.guessedRegion)) score += weights.region;
      }
      if (weights.country && guess.guessedCountry) {
        if (norm(actual.country) === norm(guess.guessedCountry)) score += weights.country;
      }
      if (weights.vintage && guess.guessedVintage && actual.vintage) {
        if (actual.vintage === guess.guessedVintage) score += weights.vintage;
        else if (Math.abs(actual.vintage - guess.guessedVintage) === 1) score += Math.round(weights.vintage / 2);
      }
      if (weights.producer && guess.guessedProducer) {
        if (norm(actual.producer) === norm(guess.guessedProducer)) score += weights.producer;
      }
      if (weights.type && guess.guessedType) {
        if (norm(actual.type) === norm(guess.guessedType)) score += weights.type;
      }

      return prisma.liveGuess.update({ where: { id: guess.id }, data: { score } });
    })
  );
}
