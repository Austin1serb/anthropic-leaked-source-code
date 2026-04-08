import { getLiveEventById } from "@/lib/liveActions";
import { notFound } from "next/navigation";
import { LiveHostClient } from "./LiveHostClient";

export const dynamic = "force-dynamic";

export default async function LiveHostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getLiveEventById(id);
  if (!event) notFound();

  return <LiveHostClient event={event} />;
}
