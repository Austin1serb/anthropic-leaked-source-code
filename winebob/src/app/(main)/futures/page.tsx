import { TrendingUp, Clock, Flame, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function FuturesPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold font-serif">
          Vine Futures
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Predict wine world outcomes, earn reputation
        </p>
      </header>

      {/* Your stats */}
      <section className="px-4 mt-4">
        <div className="wine-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Your Reputation</p>
              <p className="text-2xl font-bold text-wine-gold">1,250</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Prediction Accuracy</p>
              <p className="text-2xl font-bold text-wine-sage">67%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category filters */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto scrollbar-hide">
        {[
          { label: "Trending", icon: "🔥" },
          { label: "Vintage", icon: "🍇" },
          { label: "Auctions", icon: "🔨" },
          { label: "Critics", icon: "📝" },
          { label: "Trends", icon: "📈" },
        ].map((cat, i) => (
          <button
            key={cat.label}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              i === 0
                ? "bg-wine-burgundy text-white"
                : "bg-card-bg border border-card-border"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Active markets */}
      <section className="px-4 space-y-3 mb-6">
        {[
          {
            question:
              "Will 2024 Burgundy vintage be rated 95+ by Wine Advocate?",
            category: "vintage",
            yes: 62,
            no: 38,
            totalStaked: 3400,
            resolvesIn: "2 months",
            hot: true,
          },
          {
            question:
              "Will natural wine exceed 20% of restaurant wine lists in Copenhagen by 2027?",
            category: "trend",
            yes: 78,
            no: 22,
            totalStaked: 1200,
            resolvesIn: "8 months",
            hot: false,
          },
          {
            question:
              "Will anyone in tonight's Blind Arena identify all 6 wines?",
            category: "blind_tasting",
            yes: 15,
            no: 85,
            totalStaked: 580,
            resolvesIn: "4 hours",
            hot: true,
          },
          {
            question:
              "Will Sassicaia 2022 reach DKK 3,000 at retail within 12 months?",
            category: "auction",
            yes: 45,
            no: 55,
            totalStaked: 2100,
            resolvesIn: "5 months",
            hot: false,
          },
        ].map((market, i) => (
          <div
            key={i}
            className="wine-card p-4 active:scale-[0.98] transition-transform animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {market.hot && <Flame size={14} className="text-orange-500" />}
                <span className="text-xs font-medium text-muted capitalize">
                  {market.category.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Clock size={12} />
                {market.resolvesIn}
              </div>
            </div>

            <h3 className="text-sm font-semibold mb-3">{market.question}</h3>

            {/* Probability bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-wine-sage w-12">
                Yes {market.yes}%
              </span>
              <div className="flex-1 h-2.5 bg-wine-cream-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-wine-sage rounded-full transition-all"
                  style={{ width: `${market.yes}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-wine-burgundy w-12 text-right">
                No {market.no}%
              </span>
            </div>

            {/* Stake info */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted">
                {market.totalStaked.toLocaleString()} tokens staked
              </span>
              <button className="px-4 py-1.5 bg-wine-burgundy text-white text-xs font-semibold rounded-full active:bg-wine-burgundy-dark transition-colors">
                Stake
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
