import { Settings, Share2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif">
          Profile
        </h1>
        <div className="flex items-center gap-2">
          <button className="touch-target flex items-center justify-center">
            <Share2 size={20} className="text-muted" />
          </button>
          <Link
            href="/profile/settings"
            className="touch-target flex items-center justify-center"
          >
            <Settings size={20} className="text-muted" />
          </Link>
        </div>
      </header>

      {/* Profile card */}
      <section className="px-4 mt-2">
        <div className="wine-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-wine-burgundy/20 flex items-center justify-center text-2xl">
              🧑
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Wine Enthusiast</h2>
              <p className="text-sm text-muted">@winelover</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-wine-gold/20 text-wine-gold font-medium">
                  🏅 Sommelier
                </span>
                <span className="text-xs text-muted">Level 8</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-around mt-4 pt-4 border-t border-card-border">
            <div className="text-center">
              <p className="text-lg font-bold">87</p>
              <p className="text-xs text-muted">Wines</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">12</p>
              <p className="text-xs text-muted">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">28</p>
              <p className="text-xs text-muted">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-wine-gold">1,250</p>
              <p className="text-xs text-muted">Rep</p>
            </div>
          </div>
        </div>
      </section>

      {/* Taste Profile Preview */}
      <section className="px-4 mt-4">
        <div className="wine-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Your Taste Profile</h3>
            <Link
              href="/profile/taste"
              className="text-xs text-wine-burgundy font-medium"
            >
              View full
            </Link>
          </div>
          {/* Simplified taste bars */}
          {[
            { label: "Body", value: 0.7 },
            { label: "Tannin", value: 0.6 },
            { label: "Acidity", value: 0.5 },
            { label: "Sweetness", value: 0.2 },
            { label: "Fruit", value: 0.8 },
            { label: "Oak", value: 0.4 },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted w-16">{pref.label}</span>
              <div className="flex-1 h-2 bg-wine-cream-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-wine-burgundy rounded-full"
                  style={{ width: `${pref.value * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted mt-2">
            Top grapes: Nebbiolo, Pinot Noir, Syrah
          </p>
        </div>
      </section>

      {/* Badges */}
      <section className="px-4 mt-4">
        <div className="wine-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Badges</h3>
            <span className="text-xs text-muted">8 earned</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[
              { emoji: "🍷", name: "First Sip" },
              { emoji: "🔥", name: "7-Day Streak" },
              { emoji: "🎯", name: "Sharp Nose" },
              { emoji: "🌍", name: "Globe Trotter" },
              { emoji: "🏆", name: "Arena Champ" },
              { emoji: "🔮", name: "Oracle" },
              { emoji: "📚", name: "Wine Scholar" },
              { emoji: "👥", name: "Social Sipper" },
            ].map((badge) => (
              <div
                key={badge.name}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full bg-wine-cream-dark flex items-center justify-center text-xl">
                  {badge.emoji}
                </div>
                <span className="text-[10px] text-muted text-center w-14 truncate">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu items */}
      <section className="px-4 mt-4 mb-6">
        <div className="wine-card divide-y divide-card-border">
          {[
            { label: "My Collections", href: "/profile/collections" },
            { label: "Cellar Inventory", href: "/trail/inventory" },
            { label: "Prediction History", href: "/profile/predictions" },
            { label: "Arena Stats", href: "/profile/arena-stats" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-3.5 active:bg-wine-cream-dark/50 transition-colors"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
