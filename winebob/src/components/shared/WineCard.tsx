import { Wine as WineIcon, Star } from "lucide-react";

type WineCardProps = {
  name: string;
  producer: string;
  vintage?: number | null;
  type: string;
  region: string;
  country: string;
  avgRating: number;
  totalRatings: number;
  labelImage?: string | null;
  onClick?: () => void;
};

const typeColors: Record<string, string> = {
  red: "bg-wine-burgundy",
  white: "bg-wine-gold",
  rosé: "bg-wine-rosé",
  sparkling: "bg-wine-gold-light",
  orange: "bg-amber-500",
  dessert: "bg-amber-700",
  fortified: "bg-wine-burgundy-dark",
};

export function WineCard({
  name,
  producer,
  vintage,
  type,
  region,
  country,
  avgRating,
  totalRatings,
  labelImage,
  onClick,
}: WineCardProps) {
  return (
    <button
      onClick={onClick}
      className="wine-card w-full flex items-center gap-3 p-3 text-left active:scale-[0.98] transition-transform"
    >
      {/* Wine image or placeholder */}
      <div className="w-14 h-20 rounded-lg bg-wine-cream-dark flex items-center justify-center flex-shrink-0 overflow-hidden">
        {labelImage ? (
          <img
            src={labelImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <WineIcon size={24} className="text-muted" />
        )}
      </div>

      {/* Wine info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`w-2 h-2 rounded-full ${typeColors[type] ?? "bg-muted"}`}
          />
          <span className="text-xs text-muted capitalize">{type}</span>
          {vintage && (
            <span className="text-xs text-muted">{vintage}</span>
          )}
        </div>
        <h3 className="font-semibold text-sm truncate">{name}</h3>
        <p className="text-xs text-muted truncate">{producer}</p>
        <p className="text-xs text-muted">
          {region}, {country}
        </p>
      </div>

      {/* Rating */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <Star
            size={14}
            className="text-wine-gold fill-wine-gold"
          />
          <span className="text-sm font-semibold">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </span>
        </div>
        <span className="text-[10px] text-muted">
          {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
        </span>
      </div>
    </button>
  );
}
