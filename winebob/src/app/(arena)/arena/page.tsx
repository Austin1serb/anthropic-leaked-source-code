import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ArenaClient } from "./ArenaClient";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  const session = await requireAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let events: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let templates: any[] = [];

  try {
    [events, templates] = await Promise.all([
      prisma.blindTastingEvent.findMany({
        where: { hostId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          wines: true,
          guests: { select: { id: true, displayName: true } },
        },
      }),
      prisma.eventTemplate.findMany({
        where: { isPublic: true },
        orderBy: [{ featured: "desc" }, { usageCount: "desc" }],
      }),
    ]);
  } catch (e) {
    console.error("Failed to load arena data:", e);
  }

  return (
    <ArenaClient
      events={events}
      templates={templates}
      userName={session.user.name ?? "Host"}
    />
  );
}
