import { Flame, MapPin, Wine, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function TrailPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold font-serif">
          Wine Trail
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Your wine journey, tracked
        </p>
      </header>

      {/* Streak & Stats row */}
      <section className="px-4 mt-4">
        <div className="flex gap-3">
          <div className="wine-card flex-1 p-3 flex flex-col items-center">
            <Flame size={22} className="text-orange-500 mb-1" />
            <span className="text-xl font-bold">12</span>
            <span className="text-[10px] text-muted">Day Streak</span>
          </div>
          <div className="wine-card flex-1 p-3 flex flex-col items-center">
            <Wine size={22} className="text-wine-burgundy mb-1" />
            <span className="text-xl font-bold">87</span>
            <span className="text-[10px] text-muted">Wines Rated</span>
          </div>
          <div className="wine-card flex-1 p-3 flex flex-col items-center">
            <MapPin size={22} className="text-wine-sage mb-1" />
            <span className="text-xl font-bold">14</span>
            <span className="text-[10px] text-muted">Regions</span>
          </div>
          <div className="wine-card flex-1 p-3 flex flex-col items-center">
            <CalendarDays size={22} className="text-wine-gold mb-1" />
            <span className="text-xl font-bold">23</span>
            <span className="text-[10px] text-muted">Events</span>
          </div>
        </div>
      </section>

      {/* Activity feed */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-semibold font-serif mb-3">
          Recent Activity
        </h2>

        <div className="space-y-3 mb-6">
          {[
            {
              type: "tasting",
              emoji: "🍷",
              title: "Blind tasting with CPH Wine Club",
              subtitle: "Identified 4/6 wines correctly!",
              time: "Today at 8PM",
              location: "Vesterbro, Copenhagen",
            },
            {
              type: "checkin",
              emoji: "🥂",
              title: "Checked in: Barolo 2019",
              subtitle: "Prunotto - Rich, structured, long finish",
              time: "Yesterday",
              rating: 4.5,
            },
            {
              type: "purchase",
              emoji: "🛒",
              title: "Added 6 bottles to cellar",
              subtitle: "Mixed case from Philipson Wine",
              time: "2 days ago",
            },
            {
              type: "vineyard_visit",
              emoji: "🏡",
              title: "Visited Domaine Leflaive",
              subtitle: "Puligny-Montrachet, Burgundy",
              time: "Last week",
              location: "Burgundy, France",
            },
            {
              type: "education",
              emoji: "📚",
              title: "Completed WSET Level 2 Module: Sparkling",
              subtitle: "Méthode Traditionnelle mastered!",
              time: "Last week",
            },
          ].map((activity, i) => (
            <div
              key={i}
              className="wine-card p-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-wine-cream-dark flex items-center justify-center text-xl flex-shrink-0">
                  {activity.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{activity.title}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {activity.subtitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted">{activity.time}</span>
                    {activity.location && (
                      <span className="text-xs text-muted flex items-center gap-0.5">
                        <MapPin size={10} /> {activity.location}
                      </span>
                    )}
                    {"rating" in activity && (
                      <span className="text-xs text-wine-gold">
                        {"★".repeat(Math.floor(activity.rating as number))}{" "}
                        {activity.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Log activity FAB */}
      <Link
        href="/trail/log"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-wine-burgundy text-white shadow-lg shadow-wine-burgundy/30 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <span className="text-2xl">+</span>
      </Link>
    </div>
  );
}
