import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ArenaClient } from "./ArenaClient";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  const session = await requireAuth();

  const [events, templates] = await Promise.all([
    prisma.blindTastingEvent.findMany({
      where: { hostId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        wines: true,
        guests: { select: { id: true } },
      },
    }),
    prisma.eventTemplate.findMany({
      where: { isPublic: true },
      orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
    }),
  ]);

  return (
    <ArenaClient
      events={events}
      templates={templates}
      userName={session.user.name ?? "Host"}
    />
  );
}
