import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Wine, Users, Trophy, ChevronRight, LogOut, Bell, Shield, HelpCircle, Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [eventCount, totalGuests, completedEvents] = await Promise.all([
    prisma.blindTastingEvent.count({ where: { hostId: userId } }),
    prisma.guestParticipant.count({
      where: { event: { hostId: userId } },
    }),
    prisma.blindTastingEvent.count({
      where: { hostId: userId, status: "completed" },
    }),
  ]);

  const initials = (session.user.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-28 safe-top bg-profile-gradient">
      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-2">
        <h1 className="text-lg font-bold text-foreground tracking-tight">Profile</h1>
      </header>

      {/* ── Avatar + Name ── */}
      <section className="flex flex-col items-center pt-4 pb-6 px-5">
        <div className="relative">
          <div className="w-24 h-24 rounded-[28px] bg-card-bg flex items-center justify-center shadow-lg shadow-black/5 border border-card-border overflow-hidden">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-cherry">{initials}</span>
            )}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-[3px] border-background" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground tracking-tight">
          {session.user.name ?? "Host"}
        </h2>
        <p className="text-[13px] text-muted mt-0.5">{session.user.email}</p>
      </section>

      {/* ── Stats Widgets ── */}
      <section className="px-5 stagger-children">
        <div className="flex items-stretch gap-3">
          <div className="flex-1 widget-card widget-wine p-4 text-center">
            <div className="h-10 w-10 rounded-2xl bg-cherry/10 flex items-center justify-center mx-auto mb-2">
              <Wine className="h-5 w-5 text-cherry" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{eventCount}</p>
            <p className="text-[10px] font-semibold text-muted mt-0.5">Events</p>
          </div>
          <div className="flex-1 widget-card widget-sage p-4 text-center">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{totalGuests}</p>
            <p className="text-[10px] font-semibold text-muted mt-0.5">Guests</p>
          </div>
          <div className="flex-1 widget-card widget-gold p-4 text-center">
            <div className="h-10 w-10 rounded-2xl bg-amber-600/10 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-5 w-5 text-amber-700" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{completedEvents}</p>
            <p className="text-[10px] font-semibold text-muted mt-0.5">Completed</p>
          </div>
        </div>
      </section>

      {/* ── Settings List ── */}
      <section className="px-5 mt-7">
        <h3 className="text-[13px] font-bold text-muted uppercase tracking-wider mb-3 px-1">
          Settings
        </h3>
        <div className="wine-card divide-y divide-card-border/40">
          <SettingsRow
            icon={<Bell className="h-[18px] w-[18px] text-blue-600" />}
            iconBg="widget-sky"
            label="Notifications"
          />
          <SettingsRow
            icon={<Palette className="h-[18px] w-[18px] text-purple-600" />}
            iconBg="widget-lavender"
            label="Appearance"
          />
          <SettingsRow
            icon={<Shield className="h-[18px] w-[18px] text-emerald-700" />}
            iconBg="widget-sage"
            label="Privacy"
          />
          <SettingsRow
            icon={<HelpCircle className="h-[18px] w-[18px] text-amber-700" />}
            iconBg="widget-gold"
            label="Help & Support"
          />
        </div>
      </section>

      {/* ── Sign out ── */}
      <section className="px-5 mt-5 mb-6">
        <a
          href="/api/auth/signout"
          className="wine-card px-4 py-4 flex items-center gap-3.5 active:scale-[0.98] transition-transform"
        >
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center dark:bg-red-900/20">
            <LogOut className="h-[18px] w-[18px] text-red-500" />
          </div>
          <span className="text-[15px] font-semibold text-red-500">Sign Out</span>
        </a>
      </section>
    </div>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
}) {
  return (
    <button className="w-full px-4 py-3.5 flex items-center gap-3.5 active:bg-card-border/20 transition-colors touch-target">
      <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <span className="text-[15px] font-medium text-foreground flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted/30 flex-shrink-0" />
    </button>
  );
}
