import { Swords, Trophy, Clock, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ArenaPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold font-serif">
          Blind Arena
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Test your palate, challenge friends
        </p>
      </header>

      {/* Daily Challenge Card */}
      <section className="px-4 mt-4">
        <div className="bg-wine-gradient rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} />
            <span className="text-sm font-medium opacity-90">
              Daily Challenge
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif mb-1">
            Mystery Wine #127
          </h2>
          <p className="text-sm opacity-80 mb-4">
            Can you identify today&apos;s blind wine? One guess, no hints.
          </p>
          <button className="w-full py-3 bg-white/20 backdrop-blur rounded-xl font-semibold text-sm active:bg-white/30 transition-colors">
            Start Challenge
          </button>
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-4 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/arena/create"
            className="wine-card p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-wine-burgundy/10 flex items-center justify-center">
              <Users size={22} className="text-wine-burgundy" />
            </div>
            <span className="text-sm font-medium text-center">
              Host Tasting
            </span>
            <span className="text-xs text-muted text-center">
              Create a blind tasting event
            </span>
          </Link>

          <Link
            href="/arena/solo"
            className="wine-card p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-wine-gold/20 flex items-center justify-center">
              <Swords size={22} className="text-wine-gold" />
            </div>
            <span className="text-sm font-medium text-center">
              Solo Practice
            </span>
            <span className="text-xs text-muted text-center">
              Sharpen your blind tasting
            </span>
          </Link>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold font-serif">
            Upcoming Events
          </h2>
          <Link
            href="/arena/events"
            className="text-sm text-wine-burgundy font-medium"
          >
            See all
          </Link>
        </div>

        <div className="space-y-3">
          {[
            {
              title: "Friday Night Bordeaux",
              host: "Wine Club CPH",
              date: "Fri, Apr 4 at 7PM",
              participants: 8,
              difficulty: "intermediate",
            },
            {
              title: "New World vs Old World",
              host: "Sarah M.",
              date: "Sat, Apr 5 at 6PM",
              participants: 5,
              difficulty: "advanced",
            },
          ].map((event, i) => (
            <div
              key={i}
              className="wine-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-wine-cream-dark flex items-center justify-center text-xl">
                🍷
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{event.title}</h3>
                <p className="text-xs text-muted">
                  {event.host} · {event.date}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-wine-sage/20 text-wine-sage capitalize">
                    {event.difficulty}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-0.5">
                    <Users size={10} /> {event.participants}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard preview */}
      <section className="px-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold font-serif">
            Leaderboard
          </h2>
          <Link
            href="/arena/leaderboard"
            className="text-sm text-wine-burgundy font-medium flex items-center gap-0.5"
          >
            <Trophy size={14} /> Full rankings
          </Link>
        </div>

        <div className="wine-card divide-y divide-card-border">
          {[
            { rank: 1, name: "You", score: 2450, emoji: "🥇" },
            { rank: 2, name: "Martin K.", score: 2380, emoji: "🥈" },
            { rank: 3, name: "Anna S.", score: 2210, emoji: "🥉" },
          ].map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="text-lg">{entry.emoji}</span>
              <span className="text-sm font-medium flex-1">{entry.name}</span>
              <span className="text-sm font-semibold text-wine-burgundy">
                {entry.score.toLocaleString()} XP
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
