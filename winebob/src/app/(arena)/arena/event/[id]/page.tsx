import { getEventById } from "@/lib/actions";
import { notFound } from "next/navigation";
import { EventControlClient } from "./EventControlClient";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return <EventControlClient event={event} />;
}
