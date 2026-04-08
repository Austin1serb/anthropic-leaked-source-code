"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Winery (Producer) CRUD ──

export async function getWineries(filters?: { region?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.region) where.region = filters.region;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { region: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.winery.findMany({
    where,
    include: { _count: { select: { wines: true } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });
}

export async function getWinery(slug: string) {
  return prisma.winery.findUnique({
    where: { slug },
    include: {
      wines: { orderBy: { name: "asc" }, take: 100 },
      _count: { select: { wines: true } },
    },
  });
}

export async function createWinery(data: {
  name: string;
  slug: string;
  description?: string;
  history?: string;
  philosophy?: string;
  founded?: number;
  owner?: string;
  winemaker?: string;
  website?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  lat: number;
  lng: number;
  address?: string;
  region: string;
  country: string;
  featured?: boolean;
  visitBooking?: string;
  annualBottles?: number;
  vineyardSize?: string;
  grapeVarieties?: string[];
  wineStyles?: string[];
  certifications?: string[];
}) {
  await requireAuth();
  const winery = await prisma.winery.create({ data: { ...data, verified: true } });
  revalidatePath("/admin/producers");
  return winery;
}

export async function updateWinery(id: string, data: Record<string, unknown>) {
  await requireAuth();
  const winery = await prisma.winery.update({ where: { id }, data });
  revalidatePath("/admin/producers");
  revalidatePath(`/producers/${winery.slug}`);
  return winery;
}

export async function deleteWinery(id: string) {
  await requireAuth();
  // Unlink wines first (set wineryId to null), then delete
  await prisma.wine.updateMany({ where: { wineryId: id }, data: { wineryId: null } });
  await prisma.winery.delete({ where: { id } });
  revalidatePath("/admin/producers");
}

// ── Wine CRUD (linked to Winery) ──

export async function getWines(filters?: { wineryId?: string; search?: string; type?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.wineryId) where.wineryId = filters.wineryId;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { producer: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.wine.findMany({
    where,
    include: { winery: { select: { name: true, slug: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function createWine(data: {
  name: string;
  wineryId: string;
  type: string;
  vintage?: number;
  grapes?: string[];
  appellation?: string;
  description?: string;
  priceRange?: string;
  abv?: number;
  tastingNotes?: string;
  foodPairing?: string;
}) {
  await requireAuth();
  // Look up the winery to set legacy producer/region/country fields
  const winery = await prisma.winery.findUniqueOrThrow({ where: { id: data.wineryId } });
  const wine = await prisma.wine.create({
    data: {
      name: data.name,
      wineryId: data.wineryId,
      producer: winery.name,
      region: winery.region,
      country: winery.country,
      type: data.type,
      vintage: data.vintage,
      grapes: data.grapes ?? [],
      appellation: data.appellation,
      description: data.description,
      priceRange: data.priceRange,
      abv: data.abv,
      tastingNotes: data.tastingNotes,
      foodPairing: data.foodPairing,
      source: "user",
      confidence: 1.0,
      isPublic: true,
    },
  });
  revalidatePath("/admin/wines");
  revalidatePath(`/producers/${winery.slug}`);
  return wine;
}

export async function updateWine(id: string, data: Record<string, unknown>) {
  await requireAuth();
  const wine = await prisma.wine.update({ where: { id }, data });
  revalidatePath("/admin/wines");
  return wine;
}

export async function deleteWine(id: string) {
  await requireAuth();
  await prisma.wine.delete({ where: { id } });
  revalidatePath("/admin/wines");
}

// ── Winery Applications ──

export async function submitApplication(data: {
  type: "claim" | "create";
  applicantName: string;
  applicantEmail: string;
  applicantRole?: string;
  applicantPhone?: string;
  message?: string;
  wineryId?: string;
  wineryName?: string;
  wineryRegion?: string;
  wineryCountry?: string;
  wineryWebsite?: string;
}) {
  return prisma.wineryApplication.create({ data });
}

export async function getApplications(status?: string) {
  await requireAuth();
  const where = status ? { status } : {};
  return prisma.wineryApplication.findMany({
    where,
    include: { winery: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewApplication(id: string, decision: "approved" | "rejected", note?: string) {
  const session = await requireAuth();
  return prisma.wineryApplication.update({
    where: { id },
    data: {
      status: decision,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: note,
    },
  });
}
