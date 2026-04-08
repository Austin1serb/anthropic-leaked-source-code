import { getLiveEventById } from "@/lib/liveActions";
import { notFound } from "next/navigation";
import { LiveEventClient } from "./LiveEventClient";

export const dynamic = "force-dynamic";

export default async function LiveEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getLiveEventById(id);
  if (!event) notFound();

  return <LiveEventClient event={event} />;
}
