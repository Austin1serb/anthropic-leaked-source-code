import { getWineById } from "@/lib/actions";
import { notFound } from "next/navigation";
import { WineDetailClient } from "./WineDetailClient";

export const dynamic = "force-dynamic";

export default async function WineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wine = await getWineById(id);

  if (!wine) notFound();

  return <WineDetailClient wine={wine} />;
}
