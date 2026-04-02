import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Wine as WineIcon,
  MapPin,
  User,
} from "lucide-react";
import { getWineById } from "@/lib/actions";

export const dynamic = "force-dynamic";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(date).toLocaleDateString();
}

function TypeDot({ type }: { type: string }) {
  const colorClass =
    type === "red"
      ? "bg-wine-burgundy"
      : type === "white"
        ? "bg-wine-gold"
        : type === "rosé"
          ? "bg-wine-rosé"
          : "bg-wine-gold-light";

  return <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={
            star <= Math.round(rating)
              ? "text-wine-gold fill-wine-gold"
              : "text-muted/30"
          }
        />
      ))}
    </div>
  );
}

export default async function WineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wine = await getWineById(id);

  if (!wine) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header with back navigation */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3">
        <Link
          href="/cellar"
          className="touch-target inline-flex items-center gap-1.5 text-wine-burgundy font-medium text-sm"
        >
          <ArrowLeft size={18} />
          <span>Cellar</span>
        </Link>
      </header>

      {/* Wine label image */}
      <div className="flex justify-center px-4 mb-5">
        <div className="w-36 h-48 rounded-2xl bg-wine-cream-dark border border-card-border flex items-center justify-center shadow-sm">
          {wine.labelImage ? (
            <img
              src={wine.labelImage}
              alt={wine.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <WineIcon size={48} className="text-muted/40" />
          )}
        </div>
      </div>

      {/* Wine info */}
      <section className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <TypeDot type={wine.type} />
          <span className="text-sm text-muted capitalize">{wine.type}</span>
          {wine.vintage && (
            <span className="text-sm text-muted">&middot; {wine.vintage}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold font-serif mb-1">{wine.name}</h1>
        <p className="text-base text-muted mb-2">{wine.producer}</p>
        {(wine.region || wine.country) && (
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} />
            <span>
              {[wine.region, wine.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </section>

      {/* Rating summary */}
      <section className="px-4 mb-5">
        <div className="wine-card p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-bold font-serif">
                {wine.avgRating > 0 ? wine.avgRating.toFixed(1) : "--"}
              </span>
              <StarRating rating={wine.avgRating} />
            </div>
            <p className="text-sm text-muted">
              {wine.totalRatings}{" "}
              {wine.totalRatings === 1 ? "rating" : "ratings"}
            </p>
          </div>
          <Link
            href={`/cellar/checkin?wineId=${id}`}
            className="touch-target px-5 py-2.5 rounded-full bg-wine-burgundy text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Rate This Wine
          </Link>
        </div>
      </section>

      {/* Reviews */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold font-serif mb-3">Reviews</h2>

        {wine.reviews.length === 0 ? (
          <div className="text-center py-10">
            <Star size={32} className="text-muted/20 mx-auto mb-2" />
            <p className="text-muted text-sm">No reviews yet</p>
            <p className="text-muted text-xs mt-1">
              Be the first to rate this wine!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {wine.reviews.map((review) => (
              <div key={review.id} className="wine-card p-4">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-full bg-wine-burgundy/15 flex items-center justify-center flex-shrink-0">
                    {review.user.image ? (
                      <img
                        src={review.user.image}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={14} className="text-wine-burgundy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {review.user.displayName ??
                        review.user.name ??
                        "Anonymous"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatTimeAgo(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star
                      size={13}
                      className="text-wine-gold fill-wine-gold"
                    />
                    <span className="text-sm font-semibold">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                {review.notes && (
                  <p className="text-sm leading-relaxed">{review.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
