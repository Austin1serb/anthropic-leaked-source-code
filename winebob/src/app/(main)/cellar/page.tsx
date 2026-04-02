import { prisma } from "@/lib/db";
import { CellarClient } from "./CellarClient";

export const dynamic = "force-dynamic";

export default async function CellarPage() {
  // Fetch real data from database
  const [wines, recentActivity] = await Promise.all([
    prisma.wine.findMany({
      orderBy: [{ avgRating: "desc" }, { totalRatings: "desc" }],
      take: 20,
    }),
    prisma.activity.findMany({
      where: { type: "tasting", isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { displayName: true, name: true, image: true } },
      },
    }),
  ]);

  return <CellarClient wines={wines} recentActivity={recentActivity} />;
}
