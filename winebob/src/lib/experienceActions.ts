"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getExperiences(filters?: {
  type?: string;
  region?: string;
  maxPrice?: number;
  featured?: boolean;
}) {
  const where: Record<string, unknown> = { active: true };
  if (filters?.type) where.type = filters.type;
  if (filters?.featured) where.featured = true;
  if (filters?.maxPrice) where.pricePerPerson = { lte: filters.maxPrice };
  if (filters?.region) {
    where.winery = { region: filters.region };
  }

  return prisma.wineExperience.findMany({
    where,
    include: {
      winery: {
        select: {
          name: true,
          slug: true,
          region: true,
          country: true,
          lat: true,
          lng: true,
          image: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getExperience(slug: string) {
  return prisma.wineExperience.findUnique({
    where: { slug },
    include: {
      winery: {
        select: {
          name: true,
          slug: true,
          region: true,
          country: true,
          lat: true,
          lng: true,
          description: true,
          image: true,
          grapeVarieties: true,
          wineStyles: true,
          verified: true,
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
  });
}

export async function bookExperience(data: {
  experienceId: string;
  guestName: string;
  guestEmail: string;
  guestCount: number;
  date: string;
  notes?: string;
}) {
  const session = await auth();

  const experience = await prisma.wineExperience.findUnique({
    where: { id: data.experienceId },
  });

  if (!experience || !experience.active) {
    throw new Error("Experience not found or not available");
  }

  if (data.guestCount < 1 || data.guestCount > experience.maxGuests) {
    throw new Error(`Guest count must be between 1 and ${experience.maxGuests}`);
  }

  const totalPrice = experience.pricePerPerson * data.guestCount;

  return prisma.experienceBooking.create({
    data: {
      experienceId: data.experienceId,
      userId: session?.user?.id ?? null,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestCount: data.guestCount,
      date: new Date(data.date),
      totalPrice,
      notes: data.notes ?? null,
    },
  });
}

export async function getExperienceTypes() {
  const experiences = await prisma.wineExperience.findMany({
    where: { active: true },
    select: { type: true },
    distinct: ["type"],
  });
  return experiences.map((e) => e.type);
}

export async function getExperienceRegions() {
  const experiences = await prisma.wineExperience.findMany({
    where: { active: true },
    select: { winery: { select: { region: true } } },
  });
  return Array.from(new Set(experiences.map((e) => e.winery.region))).sort();
}
