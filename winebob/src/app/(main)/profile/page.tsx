import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Wine, Calendar, Users, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [eventCount, totalGuests] = await Promise.all([
    prisma.blindTastingEvent.count({ where: { hostId: userId } }),
    prisma.guestParticipant.count({
      where: { event: { hostId: userId } },
    }),
  ]);

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold font-serif">Profile</h1>
      </header>

      {/* Profile card */}
      <section className="px-4 mt-2">
        <div className="wine-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-wine-burgundy/20 flex items-center justify-center">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl">🧑</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">
                {session.user.name ?? "Host"}
              </h2>
              <p className="text-sm text-muted">{session.user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-around mt-4 pt-4 border-t border-card-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wine size={16} className="text-wine-burgundy" />
              </div>
              <p className="text-lg font-bold">{eventCount}</p>
              <p className="text-xs text-muted">Events</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users size={16} className="text-wine-burgundy" />
              </div>
              <p className="text-lg font-bold">{totalGuests}</p>
              <p className="text-xs text-muted">Total Guests</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar size={16} className="text-wine-burgundy" />
              </div>
              <p className="text-lg font-bold">
                {session.user.name ? "Active" : "—"}
              </p>
              <p className="text-xs text-muted">Status</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section className="px-4 mt-4 mb-6">
        <a
          href="/api/auth/signout"
          className="wine-card px-4 py-3.5 flex items-center gap-3 active:bg-wine-cream-dark/50 transition-colors"
        >
          <LogOut size={18} className="text-muted" />
          <span className="text-sm font-medium">Sign Out</span>
        </a>
      </section>
    </div>
  );
}
