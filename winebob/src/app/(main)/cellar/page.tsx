import { Search, ScanLine, Plus } from "lucide-react";
import Link from "next/link";

export default function CellarPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold font-serif">
            Cellar
          </h1>
          <Link
            href="/cellar/scan"
            className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-wine-burgundy text-white"
          >
            <ScanLine size={20} />
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search wines, producers, regions..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card-bg border border-card-border text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-wine-burgundy/30 focus:border-wine-burgundy/50"
          />
        </div>
      </header>

      {/* Quick filters */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {["All", "Red", "White", "Rosé", "Sparkling", "Orange", "Natural"].map(
          (filter) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === "All"
                  ? "bg-wine-burgundy text-white"
                  : "bg-card-bg border border-card-border text-foreground"
              }`}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Recommendations section */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold font-serif mb-3">
          Recommended for You
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="wine-card flex-shrink-0 w-36 animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-32 bg-wine-cream-dark flex items-center justify-center">
                <span className="text-4xl">🍷</span>
              </div>
              <div className="p-2.5">
                <p className="text-xs text-muted">Bordeaux, France</p>
                <p className="text-sm font-semibold truncate">
                  Sample Wine {i}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-wine-gold">★</span>
                  <span className="text-xs font-medium">4.{i}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent check-ins from friends */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold font-serif mb-3">
          Friends&apos; Check-ins
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wine-card p-3 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-wine-burgundy/20 flex items-center justify-center">
                  <span className="text-sm">🧑</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Friend {i}</p>
                  <p className="text-xs text-muted">2h ago</p>
                </div>
                <span className="ml-auto text-lg">🥂</span>
              </div>
              <p className="text-sm">
                Just tried an amazing Barolo! Rich and complex with notes of tar
                and roses.
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-wine-gold">★★★★</span>
                <span className="text-muted">★</span>
                <span className="text-xs text-muted ml-1">4.0</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAB for quick check-in */}
      <Link
        href="/cellar/checkin"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-wine-burgundy text-white shadow-lg shadow-wine-burgundy/30 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
