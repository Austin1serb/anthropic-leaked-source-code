"use server";

import { prisma } from "@/lib/db";
import { auth, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

// ── Admin CRUD ──

export async function getAllExperiences() {
  await requireAuth();
  return prisma.wineExperience.findMany({
    include: {
      winery: { select: { name: true, slug: true, region: true, country: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExperienceById(id: string) {
  await requireAuth();
  return prisma.wineExperience.findUnique({
    where: { id },
    include: {
      winery: { select: { name: true, slug: true } },
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function createExperience(data: {
  wineryId: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  duration: number;
  maxGuests: number;
  pricePerPerson: number;
  currency?: string;
  recurring?: boolean;
  daysOfWeek?: number[];
  startTime?: string;
  seasonStart?: number;
  seasonEnd?: number;
  includes?: string[];
  languages?: string[];
  highlights?: string;
  meetingPoint?: string;
  featured?: boolean;
}) {
  await requireAuth();

  const experience = await prisma.wineExperience.create({
    data: {
      wineryId: data.wineryId,
      title: data.title,
      slug: data.slug,
      description: data.description,
      type: data.type,
      duration: data.duration,
      maxGuests: data.maxGuests,
      pricePerPerson: data.pricePerPerson,
      currency: data.currency ?? "EUR",
      recurring: data.recurring ?? false,
      daysOfWeek: data.daysOfWeek ?? [],
      startTime: data.startTime ?? null,
      seasonStart: data.seasonStart ?? null,
      seasonEnd: data.seasonEnd ?? null,
      includes: data.includes ?? [],
      languages: data.languages ?? ["English"],
      highlights: data.highlights ?? null,
      meetingPoint: data.meetingPoint ?? null,
      featured: data.featured ?? false,
      active: true,
    },
  });

  revalidatePath("/admin/experiences");
  revalidatePath("/experiences");
  return experience;
}

export async function updateExperience(
  id: string,
  data: {
    title?: string;
    description?: string;
    type?: string;
    duration?: number;
    maxGuests?: number;
    pricePerPerson?: number;
    currency?: string;
    recurring?: boolean;
    daysOfWeek?: number[];
    startTime?: string | null;
    seasonStart?: number | null;
    seasonEnd?: number | null;
    includes?: string[];
    languages?: string[];
    highlights?: string | null;
    meetingPoint?: string | null;
    featured?: boolean;
    active?: boolean;
  },
) {
  await requireAuth();

  const experience = await prisma.wineExperience.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/experiences");
  revalidatePath("/experiences");
  revalidatePath(`/experiences/${experience.slug}`);
  return experience;
}

export async function deleteExperience(id: string) {
  await requireAuth();
  const experience = await prisma.wineExperience.delete({ where: { id } });
  revalidatePath("/admin/experiences");
  revalidatePath("/experiences");
  return experience;
}

export async function getWineriesForSelect() {
  return prisma.winery.findMany({
    select: { id: true, name: true, slug: true, region: true, country: true },
    orderBy: { name: "asc" },
  });
}
