import { notFound } from "next/navigation";
import { getExperienceById, getWineriesForSelect } from "@/lib/experienceActions";
import { ExperienceForm } from "../../ExperienceForm";

export const dynamic = "force-dynamic";

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let experience: Awaited<ReturnType<typeof getExperienceById>> = null;
  let wineries: Awaited<ReturnType<typeof getWineriesForSelect>> = [];

  try {
    [experience, wineries] = await Promise.all([
      getExperienceById(id),
      getWineriesForSelect(),
    ]);
  } catch { /* DB unavailable */ }

  if (!experience) notFound();

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-1" style={{ fontFamily: "Georgia, serif" }}>
        Edit Experience
      </h1>
      <p className="text-[13px] text-muted mb-6">
        {experience.title} · {experience.winery.name}
      </p>
      <ExperienceForm
        wineries={wineries}
        initial={{
          id: experience.id,
          wineryId: experience.wineryId,
          title: experience.title,
          slug: experience.slug,
          description: experience.description,
          type: experience.type,
          duration: experience.duration,
          maxGuests: experience.maxGuests,
          pricePerPerson: experience.pricePerPerson,
          currency: experience.currency,
          recurring: experience.recurring,
          daysOfWeek: experience.daysOfWeek,
          startTime: experience.startTime ?? "",
          seasonStart: experience.seasonStart,
          seasonEnd: experience.seasonEnd,
          includes: experience.includes,
          languages: experience.languages,
          highlights: experience.highlights ?? "",
          meetingPoint: experience.meetingPoint ?? "",
          featured: experience.featured,
          active: experience.active,
        }}
      />
    </div>
  );
}
