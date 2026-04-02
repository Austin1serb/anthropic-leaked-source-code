"use client";

import { Star } from "lucide-react";
import { useState } from "react";

type RatingStarsProps = {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
};

export function RatingStars({
  value,
  onChange,
  size = 28,
  readonly = false,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue >= star;
        const halfFilled = displayValue >= star - 0.5 && displayValue < star;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`touch-target flex items-center justify-center ${
              readonly ? "cursor-default" : "cursor-pointer active:scale-110"
            } transition-transform`}
            onClick={() => {
              if (!readonly && onChange) {
                // Toggle between full and half star on re-tap
                onChange(value === star ? star - 0.5 : star);
              }
            }}
          >
            <Star
              size={size}
              className={
                filled
                  ? "text-wine-gold fill-wine-gold"
                  : halfFilled
                    ? "text-wine-gold fill-wine-gold/50"
                    : "text-muted/30"
              }
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
