"use server";

import { prisma } from "@/lib/db";
import { requireAuth, auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  trackWineSearch,
  trackWineView,
  trackWineFavorite,
  trackEvent,
} from "@/lib/analytics";

// ============ JOIN CODE GENERATION ============

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/1/O/0 confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateJoinCode();
    const existing = await prisma.blindTastingEvent.findUnique({
      where: { joinCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique join code");
}

// ============ HOST: EVENT MANAGEMENT ============

export async function createEvent(data: {
  title: string;
  description?: string;
  templateId?: string;
  guessFields: string[];
  scoringConfig: Record<string, number>;
  difficulty: string;
  timePerWine?: number;
  wineIds: string[];
}) {
  const session = await requireAuth();
  const joinCode = await uniqueJoinCode();

  // Validate that all wine IDs actually exist before creating the event
  if (data.wineIds.length > 0) {
    const existingWines = await prisma.wine.findMany({
      where: { id: { in: data.wineIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingWines.map((w) => w.id));
    const invalid = data.wineIds.filter((id) => !existingIds.has(id));
    if (invalid.length > 0) {
      throw new Error(`Invalid wine IDs: ${invalid.join(", ")}`);
    }
  }

  const event = await prisma.blindTastingEvent.create({
    data: {
      hostId: session.user.id,
      title: data.title,
      description: data.description,
      templateId: data.templateId,
      joinCode,
      guessFields: data.guessFields,
      scoringConfig: data.scoringConfig,
      difficulty: data.difficulty,
      timePerWine: data.timePerWine,
      status: "draft",
    },
  });

  // Add wines separately (Neon HTTP adapter doesn't support nested creates / implicit transactions)
  if (data.wineIds.length > 0) {
    await Promise.all(
      data.wineIds.map((wineId, i) =>
        prisma.blindWine.create({
          data: {
            eventId: event.id,
            wineId,
            position: i + 1,
          },
        })
      )
    );
  }

  // Increment template usage count
  if (data.templateId) {
    await prisma.eventTemplate.update({
      where: { id: data.templateId },
      data: { usageCount: { increment: 1 } },
    });
  }

  revalidatePath("/arena");
  redirect(`/arena/event/${event.id}`);
}

export async function updateEventStatus(
  eventId: string,
  status: "lobby" | "live" | "revealing" | "completed"
) {
  const session = await requireAuth();

  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.hostId !== session.user.id) {
    throw new Error("Not authorized");
  }

  await prisma.blindTastingEvent.update({
    where: { id: eventId },
    data: {
      status,
      ...(status === "live" ? { startsAt: new Date() } : {}),
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    },
  });

  revalidatePath(`/arena/event/${eventId}`);
}

export async function advanceWine(eventId: string) {
  const session = await requireAuth();

  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: eventId },
    include: { wines: { orderBy: { position: "asc" } } },
  });
  if (!event || event.hostId !== session.user.id) {
    throw new Error("Not authorized");
  }

  const nextPosition = event.currentWine + 1;
  if (nextPosition > event.wines.length) {
    throw new Error("No more wines");
  }

  await prisma.blindTastingEvent.update({
    where: { id: eventId },
    data: { currentWine: nextPosition },
  });

  revalidatePath(`/arena/event/${eventId}`);
}

export async function revealWine(eventId: string, position: number) {
  const session = await requireAuth();

  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.hostId !== session.user.id) {
    throw new Error("Not authorized");
  }

  // Find the specific blind wine first, then update it (avoids updateMany which
  // can trigger implicit transactions on some adapters)
  const blindWine = await prisma.blindWine.findFirst({
    where: { eventId, position },
  });
  if (blindWine) {
    await prisma.blindWine.update({
      where: { id: blindWine.id },
      data: { revealed: true },
    });
  }

  revalidatePath(`/arena/event/${eventId}`);
}

// ============ GUEST: JOIN & GUESS ============

export async function joinEvent(data: {
  joinCode: string;
  displayName: string;
  birthYear: number;
  city?: string;
  country?: string;
  locationLat?: number;
  locationLng?: number;
  consentGiven: boolean;
}) {
  const event = await prisma.blindTastingEvent.findUnique({
    where: { joinCode: data.joinCode.toUpperCase() },
  });

  if (!event) {
    throw new Error("Event not found. Check your code and try again.");
  }

  if (event.status === "completed") {
    throw new Error("This event has already ended.");
  }

  const guest = await prisma.guestParticipant.create({
    data: {
      eventId: event.id,
      displayName: data.displayName,
      birthYear: data.birthYear,
      city: data.city,
      country: data.country,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      consentGiven: data.consentGiven,
      consentAt: data.consentGiven ? new Date() : null,
    },
  });

  return { eventId: event.id, guestId: guest.id };
}

export async function submitGuess(data: {
  eventId: string;
  guestId: string;
  winePosition: number;
  guessedGrape?: string;
  guessedRegion?: string;
  guessedCountry?: string;
  guessedVintage?: number;
  guessedProducer?: string;
  guessedType?: string;
  guessedPrice?: number;
  notes?: string;
  timeElapsed?: number;
}) {
  // 1. Verify the guest actually belongs to this event
  const guest = await prisma.guestParticipant.findFirst({
    where: { id: data.guestId, eventId: data.eventId },
  });
  if (!guest) {
    throw new Error("Guest not found in this event");
  }

  // 2. Verify the event is live and the wine is not already revealed (submission lock)
  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: data.eventId },
  });
  if (!event || event.status !== "live") {
    throw new Error("Event is not accepting guesses");
  }

  const blindWine = await prisma.blindWine.findFirst({
    where: { eventId: data.eventId, position: data.winePosition },
  });
  if (!blindWine) {
    throw new Error("Wine position does not exist");
  }
  if (blindWine.revealed) {
    throw new Error("This wine has already been revealed — guesses are locked");
  }

  // 3. Submit/update the guess
  const guess = await prisma.blindGuess.upsert({
    where: {
      eventId_guestId_winePosition: {
        eventId: data.eventId,
        guestId: data.guestId,
        winePosition: data.winePosition,
      },
    },
    create: {
      eventId: data.eventId,
      guestId: data.guestId,
      winePosition: data.winePosition,
      guessedGrape: data.guessedGrape,
      guessedRegion: data.guessedRegion,
      guessedCountry: data.guessedCountry,
      guessedVintage: data.guessedVintage,
      guessedProducer: data.guessedProducer,
      guessedType: data.guessedType,
      guessedPrice: data.guessedPrice,
      notes: data.notes,
      timeElapsed: data.timeElapsed,
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
      timeElapsed: data.timeElapsed,
    },
  });

  return guess;
}

// ============ SCORING ============

export async function scoreEvent(eventId: string) {
  const session = await requireAuth();

  const event = await prisma.blindTastingEvent.findUnique({
    where: { id: eventId },
  });
  if (!event || event.hostId !== session.user.id) {
    throw new Error("Not authorized");
  }

  // Fetch wines, actual wine data, and guesses separately to avoid nested
  // includes which can trigger implicit transactions on the Neon HTTP adapter.
  const blindWines = await prisma.blindWine.findMany({
    where: { eventId },
    orderBy: { position: "asc" },
  });

  const wineIds = blindWines.map((bw) => bw.wineId);
  const wines = await prisma.wine.findMany({
    where: { id: { in: wineIds } },
  });
  const wineMap = new Map(wines.map((w) => [w.id, w]));

  const guesses = await prisma.blindGuess.findMany({
    where: { eventId },
  });

  const weights = (event.scoringConfig as Record<string, number>) ?? {
    grape: 25,
    region: 20,
    country: 15,
    vintage: 15,
    producer: 15,
    type: 10,
  };

  // Score each guess and update individually
  await Promise.all(
    guesses.map((guess) => {
      const blindWine = blindWines.find((w) => w.position === guess.winePosition);
      if (!blindWine) return Promise.resolve();
      const actual = wineMap.get(blindWine.wineId);
      if (!actual) return Promise.resolve();

      let score = 0;

      // Helper: normalize strings for comparison (trim, lowercase)
      const norm = (s: string) => s.trim().toLowerCase();

      // Grape: match if guessed grape is one of the actual grapes (exact match per grape)
      if (weights.grape && guess.guessedGrape) {
        const guessNorm = norm(guess.guessedGrape);
        if (actual.grapes.some((g: string) => norm(g) === guessNorm)) {
          score += weights.grape;
        }
      }

      // Region: exact match (normalized)
      if (weights.region && guess.guessedRegion) {
        if (norm(actual.region) === norm(guess.guessedRegion)) {
          score += weights.region;
        }
      }

      // Country: exact match (normalized)
      if (weights.country && guess.guessedCountry) {
        if (norm(actual.country) === norm(guess.guessedCountry)) {
          score += weights.country;
        }
      }

      // Vintage: exact year match, or half points for ±1 year
      if (weights.vintage && guess.guessedVintage && actual.vintage) {
        if (actual.vintage === guess.guessedVintage) {
          score += weights.vintage;
        } else if (Math.abs(actual.vintage - guess.guessedVintage) === 1) {
          score += Math.round(weights.vintage / 2);
        }
      }

      // Producer: exact match (normalized)
      if (weights.producer && guess.guessedProducer) {
        if (norm(actual.producer) === norm(guess.guessedProducer)) {
          score += weights.producer;
        }
      }

      // Type: exact match (normalized) — red, white, rosé etc.
      if (weights.type && guess.guessedType) {
        if (norm(actual.type) === norm(guess.guessedType)) {
          score += weights.type;
        }
      }

      return prisma.blindGuess.update({
        where: { id: guess.id },
        data: { score },
      });
    })
  );

  revalidatePath(`/arena/event/${eventId}`);
}

// ============ DATA FETCHING ============

export async function getEventByJoinCode(joinCode: string) {
  return prisma.blindTastingEvent.findUnique({
    where: { joinCode: joinCode.toUpperCase() },
    include: {
      host: { select: { displayName: true, name: true, image: true } },
      wines: { orderBy: { position: "asc" } },
      guests: { select: { id: true, displayName: true } },
    },
  });
}

export async function getEventById(id: string) {
  // Fetch event with flat relations first, then enrich blind wines with
  // actual wine data separately — avoids nested includes which trigger
  // implicit transactions on the Neon HTTP adapter.
  const event = await prisma.blindTastingEvent.findUnique({
    where: { id },
    include: {
      host: { select: { displayName: true, name: true, image: true } },
      wines: { orderBy: { position: "asc" } },
      guests: true,
      guesses: true,
    },
  });
  if (!event) return null;

  // Fetch the actual Wine records for each blind wine
  const wineIds = event.wines.map((bw) => bw.wineId);
  const wines = wineIds.length > 0
    ? await prisma.wine.findMany({ where: { id: { in: wineIds } } })
    : [];
  const wineMap = new Map(wines.map((w) => [w.id, w]));

  return {
    ...event,
    wines: event.wines.map((bw) => ({
      ...bw,
      wine: wineMap.get(bw.wineId) ?? null,
    })),
  };
}

export async function getTemplates() {
  try {
    return await prisma.eventTemplate.findMany({
      where: { isPublic: true },
      orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
    });
  } catch (e) {
    console.error("Failed to load templates:", e);
    return [];
  }
}

export async function searchWines(query: string) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();

  const results = await prisma.wine.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { producer: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        { appellation: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tastingNotes: { contains: q, mode: "insensitive" } },
        { grapes: { hasSome: [q] } },
      ],
    },
    take: 20,
  });

  // Fire-and-forget: track search after results are ready
  const session = await auth().catch(() => null);
  trackWineSearch(session?.user?.id ?? null, q, results.length).catch(() => {});

  return results;
}

export async function getWineRegionCounts(): Promise<Record<string, number>> {
  const wines = await prisma.wine.findMany({
    where: { isPublic: true },
    select: { region: true },
  });
  const counts: Record<string, number> = {};
  for (const w of wines) {
    counts[w.region] = (counts[w.region] ?? 0) + 1;
  }
  return counts;
}

export async function getBrowseWines() {
  try {
    const wines = await prisma.wine.findMany({
      where: { isPublic: true },
      take: 30,
      orderBy: { name: "asc" },
    });

    // Fire-and-forget: track browse view
    const session = await auth().catch(() => null);
    trackWineView(session?.user?.id ?? null, "", "browse").catch(() => {});

    return wines;
  } catch (e) {
    console.error("Failed to load browse wines:", e);
    return [];
  }
}

// ============ WINE LIBRARY ============

export async function getWineLibrary(filters?: {
  type?: string;
  country?: string;
  priceRange?: string;
  search?: string;
  page?: number;
}) {
  const PAGE_SIZE = 24;
  const page = filters?.page ?? 1;

  const where: Record<string, unknown> = { isPublic: true };
  if (filters?.type) where.type = filters.type;
  if (filters?.country) where.country = filters.country;
  if (filters?.priceRange) where.priceRange = filters.priceRange;
  if (filters?.search) {
    // Split query into words for smarter AND-based matching
    // Each word must match at least one field (AND logic for words, OR for fields)
    const words = filters.search
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    if (words.length > 0) {
      where.AND = words.map((word) => ({
        OR: [
          { name: { contains: word, mode: "insensitive" } },
          { producer: { contains: word, mode: "insensitive" } },
          { region: { contains: word, mode: "insensitive" } },
          { country: { contains: word, mode: "insensitive" } },
          { appellation: { contains: word, mode: "insensitive" } },
          { description: { contains: word, mode: "insensitive" } },
          { tastingNotes: { contains: word, mode: "insensitive" } },
          { grapes: { hasSome: [word] } },
        ],
      }));
    }
  }

  const [wines, total] = await Promise.all([
    prisma.wine.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { name: "asc" },
    }),
    prisma.wine.count({ where }),
  ]);

  // Fire-and-forget: track library search with filters
  const session = await auth().catch(() => null);
  trackWineSearch(session?.user?.id ?? null, filters?.search ?? "", total, {
    type: filters?.type,
    country: filters?.country,
    priceRange: filters?.priceRange,
    page,
  }).catch(() => {});

  return { wines, total, pages: Math.ceil(total / PAGE_SIZE), page };
}

export async function getWineById(id: string) {
  const wine = await prisma.wine.findUnique({ where: { id } });

  if (wine) {
    // Fire-and-forget: track view after data is fetched
    const session = await auth().catch(() => null);
    trackWineView(session?.user?.id ?? null, id, "detail").catch(() => {});
  }

  return wine;
}

export async function getWineCountries() {
  const wines = await prisma.wine.findMany({
    where: { isPublic: true },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });
  return wines.map((w) => w.country);
}

export async function addWine(data: {
  name: string;
  producer: string;
  vintage?: number;
  grapes: string[];
  region: string;
  country: string;
  appellation?: string;
  type: string;
  description?: string;
  labelImage?: string;
  priceRange?: string;
  abv?: number;
  tastingNotes?: string;
  foodPairing?: string;
}) {
  const session = await requireAuth();

  const wine = await prisma.wine.create({
    data: {
      ...data,
      vintage: data.vintage ?? null,
      addedById: session.user.id,
      isPublic: true,
    },
  });

  // Fire-and-forget: track wine addition
  trackEvent({
    eventType: "wine_add",
    userId: session.user.id,
    wineId: wine.id,
    metadata: { producer: data.producer, region: data.region, country: data.country },
  }).catch(() => {});

  return wine;
}

export async function toggleFavorite(wineId: string) {
  const session = await requireAuth();

  const existing = await prisma.wineFavorite.findUnique({
    where: { userId_wineId: { userId: session.user.id, wineId } },
  });

  if (existing) {
    await prisma.wineFavorite.delete({ where: { id: existing.id } });

    // Fire-and-forget: track favorite removal
    trackEvent({
      eventType: "wine_unfavorite",
      userId: session.user.id,
      wineId,
      metadata: { action: "remove" },
    }).catch(() => {});

    return { favorited: false };
  }

  await prisma.wineFavorite.create({
    data: { userId: session.user.id, wineId },
  });

  // Fire-and-forget: track favorite addition
  trackWineFavorite(session.user.id, wineId).catch(() => {});

  return { favorited: true };
}

export async function getUserFavorites() {
  const session = await requireAuth();

  const favs = await prisma.wineFavorite.findMany({
    where: { userId: session.user.id },
    select: { wineId: true },
  });
  return new Set(favs.map((f) => f.wineId));
}

export async function getMyWines() {
  const session = await requireAuth();

  return prisma.wine.findMany({
    where: { addedById: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyCellar() {
  const session = await requireAuth();

  const favorites = await prisma.wineFavorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (favorites.length === 0) return [];

  const wineIds = favorites.map((f) => f.wineId);
  const wines = await prisma.wine.findMany({
    where: { id: { in: wineIds } },
  });

  const wineMap = new Map(wines.map((w) => [w.id, w]));
  return favorites.map((f) => ({
    ...f,
    wine: wineMap.get(f.wineId) ?? null,
  }));
}

export async function getHostEvents() {
  const session = await requireAuth();

  return prisma.blindTastingEvent.findMany({
    where: { hostId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      wines: true,
      guests: { select: { id: true } },
    },
  });
}
