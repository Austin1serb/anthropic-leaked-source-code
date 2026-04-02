"use client";

import { useState, useTransition } from "react";
import { Search, ScanLine, Plus, Star, Wine as WineIcon } from "lucide-react";
import Link from "next/link";
import { searchWines } from "@/lib/actions";

type Wine = {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  type: string;
  region: string;
  country: string;
  avgRating: number;
  totalRatings: number;
  labelImage: string | null;
};

type ActivityWithUser = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  user: { displayName: string | null; name: string | null; image: string | null };
};

const FILTERS = ["All", "Red", "White", "Rosé", "Sparkling", "Orange"];

export function CellarClient({
  wines: initialWines,
  recentActivity,
}: {
  wines: Wine[];
  recentActivity: ActivityWithUser[];
}) {
  const [wines, setWines] = useState(initialWines);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isPending, startTransition] = useTransition();

  function handleSearch(newQuery: string, filter?: string) {
    const currentFilter = filter ?? activeFilter;
    setQuery(newQuery);
    if (filter) setActiveFilter(filter);

    startTransition(async () => {
      const results = await searchWines(
        newQuery,
        currentFilter === "All" ? undefined : currentFilter
      );
      setWines(results);
    });
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold font-serif">Cellar</h1>
          <Link
            href="/cellar/scan"
            className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-wine-burgundy text-white"
          >
            <ScanLine size={20} />
          </Link>
        </div>

        {/* Working search bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search wines, producers, regions..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card-bg border border-card-border text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-wine-burgundy/30 focus:border-wine-burgundy/50"
          />
        </div>
      </header>

      {/* Working filters */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => handleSearch(query, filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter
                ? "bg-wine-burgundy text-white"
                : "bg-card-bg border border-card-border text-foreground active:bg-wine-cream-dark"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Wine list */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold font-serif mb-3">
          {query ? `Results for "${query}"` : "Discover Wines"}
        </h2>

        {isPending && (
          <div className="text-center py-8 text-muted text-sm">
            Searching...
          </div>
        )}

        {!isPending && wines.length === 0 && (
          <div className="text-center py-12">
            <WineIcon size={40} className="text-muted/30 mx-auto mb-3" />
            <p className="text-muted text-sm">No wines found</p>
            <p className="text-muted text-xs mt-1">
              Try scanning a label to add one!
            </p>
          </div>
        )}

        <div className="space-y-2">
          {wines.map((wine) => (
            <Link
              key={wine.id}
              href={`/cellar/wine/${wine.id}`}
              className="wine-card w-full flex items-center gap-3 p-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-14 h-20 rounded-lg bg-wine-cream-dark flex items-center justify-center flex-shrink-0">
                {wine.labelImage ? (
                  <img
                    src={wine.labelImage}
                    alt={wine.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <WineIcon size={24} className="text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      wine.type === "red"
                        ? "bg-wine-burgundy"
                        : wine.type === "white"
                          ? "bg-wine-gold"
                          : wine.type === "rosé"
                            ? "bg-wine-rosé"
                            : "bg-wine-gold-light"
                    }`}
                  />
                  <span className="text-xs text-muted capitalize">
                    {wine.type}
                  </span>
                  {wine.vintage && (
                    <span className="text-xs text-muted">{wine.vintage}</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm truncate">{wine.name}</h3>
                <p className="text-xs text-muted truncate">{wine.producer}</p>
                <p className="text-xs text-muted">
                  {wine.region}, {wine.country}
                </p>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  <Star
                    size={14}
                    className="text-wine-gold fill-wine-gold"
                  />
                  <span className="text-sm font-semibold">
                    {wine.avgRating > 0 ? wine.avgRating.toFixed(1) : "—"}
                  </span>
                </div>
                <span className="text-[10px] text-muted">
                  {wine.totalRatings}{" "}
                  {wine.totalRatings === 1 ? "rating" : "ratings"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent check-ins */}
      {recentActivity.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-lg font-semibold font-serif mb-3">
            Recent Check-ins
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="wine-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-wine-burgundy/20 flex items-center justify-center">
                    {activity.user.image ? (
                      <img
                        src={activity.user.image}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">🧑</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {activity.user.displayName ??
                        activity.user.name ??
                        "Anonymous"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                  <span className="ml-auto text-lg">🥂</span>
                </div>
                {activity.description && (
                  <p className="text-sm">{activity.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}
