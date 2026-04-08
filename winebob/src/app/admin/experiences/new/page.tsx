import { getWineriesForSelect } from "@/lib/experienceActions";
import { ExperienceForm } from "../ExperienceForm";

export const dynamic = "force-dynamic";

export default async function NewExperiencePage() {
  let wineries: Awaited<ReturnType<typeof getWineriesForSelect>> = [];
  try {
    wineries = await getWineriesForSelect();
  } catch { /* DB unavailable */ }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6" style={{ fontFamily: "Georgia, serif" }}>
        New Experience
      </h1>
      <ExperienceForm wineries={wineries} />
    </div>
  );
}
