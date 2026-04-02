"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
      wines: {
        create: data.wineIds.map((wineId, i) => ({
          wineId,
          position: i + 1,
        })),
      },
    },
  });

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

  await prisma.blindWine.updateMany({
    where: { eventId, position },
    data: { revealed: true },
  });

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
    include: {
      wines: { include: { wine: true }, orderBy: { position: "asc" } },
      guesses: true,
    },
  });

  if (!event || event.hostId !== session.user.id) {
    throw new Error("Not authorized");
  }

  const weights = (event.scoringConfig as Record<string, number>) ?? {
    grape: 25,
    region: 20,
    country: 15,
    vintage: 15,
    producer: 15,
    type: 10,
  };

  for (const guess of event.guesses) {
    const blindWine = event.wines.find((w) => w.position === guess.winePosition);
    if (!blindWine) continue;
    const actual = blindWine.wine;

    let score = 0;

    if (weights.grape && guess.guessedGrape) {
      const guessLower = guess.guessedGrape.toLowerCase();
      if (actual.grapes.some((g) => g.toLowerCase().includes(guessLower))) {
        score += weights.grape;
      }
    }
    if (weights.region && guess.guessedRegion) {
      if (actual.region.toLowerCase().includes(guess.guessedRegion.toLowerCase())) {
        score += weights.region;
      }
    }
    if (weights.country && guess.guessedCountry) {
      if (actual.country.toLowerCase() === guess.guessedCountry.toLowerCase()) {
        score += weights.country;
      }
    }
    if (weights.vintage && guess.guessedVintage) {
      if (actual.vintage === guess.guessedVintage) {
        score += weights.vintage;
      }
    }
    if (weights.producer && guess.guessedProducer) {
      if (actual.producer.toLowerCase().includes(guess.guessedProducer.toLowerCase())) {
        score += weights.producer;
      }
    }
    if (weights.type && guess.guessedType) {
      if (actual.type.toLowerCase() === guess.guessedType.toLowerCase()) {
        score += weights.type;
      }
    }

    await prisma.blindGuess.update({
      where: { id: guess.id },
      data: { score },
    });
  }

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
  return prisma.blindTastingEvent.findUnique({
    where: { id },
    include: {
      host: { select: { displayName: true, name: true, image: true } },
      wines: {
        include: { wine: true },
        orderBy: { position: "asc" },
      },
      guests: true,
      guesses: true,
    },
  });
}

export async function getTemplates() {
  return prisma.eventTemplate.findMany({
    where: { isPublic: true },
    orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
  });
}

export async function searchWines(query: string) {
  if (!query || query.trim().length < 2) return [];

  return prisma.wine.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { producer: { contains: query, mode: "insensitive" } },
        { region: { contains: query, mode: "insensitive" } },
        { grapes: { hasSome: [query] } },
      ],
    },
    take: 20,
  });
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
