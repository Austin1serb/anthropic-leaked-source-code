"use client";

import { useState, useTransition } from "react";
import { bookExperience } from "@/lib/experienceActions";
import { Users, CheckCircle } from "lucide-react";

type Props = {
  experienceId: string;
  maxGuests: number;
  pricePerPerson: number;
  currency: string;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function BookingForm({ experienceId, maxGuests, pricePerPerson, currency }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !date) {
      setError("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        await bookExperience({
          experienceId,
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestCount: guests,
          date,
          notes: notes.trim() || undefined,
        });
        setBooked(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Booking failed. Please try again.");
      }
    });
  }

  if (booked) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
        <p className="text-[16px] font-bold text-foreground">Booking confirmed!</p>
        <p className="text-[13px] text-muted mt-1">
          A confirmation has been sent to {email}.
        </p>
      </div>
    );
  }

  const total = pricePerPerson * guests;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-[8px] border border-card-border/50 bg-white text-[14px] text-foreground focus:border-cherry focus:ring-1 focus:ring-cherry/20 outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-[8px] border border-card-border/50 bg-white text-[14px] text-foreground focus:border-cherry focus:ring-1 focus:ring-cherry/20 outline-none"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="mt-1 w-full h-10 px-3 rounded-[8px] border border-card-border/50 bg-white text-[14px] text-foreground focus:border-cherry focus:ring-1 focus:ring-cherry/20 outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Guests <span className="text-[9px] text-muted">(max {maxGuests})</span>
          </label>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="h-10 w-10 rounded-[8px] border border-card-border/50 bg-white text-foreground flex items-center justify-center text-[18px] font-bold hover:bg-card-border/20 transition-colors"
            >
              −
            </button>
            <div className="flex-1 h-10 rounded-[8px] border border-card-border/50 bg-white flex items-center justify-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted" />
              <span className="text-[14px] font-semibold text-foreground">{guests}</span>
            </div>
            <button
              type="button"
              onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
              className="h-10 w-10 rounded-[8px] border border-card-border/50 bg-white text-foreground flex items-center justify-center text-[18px] font-bold hover:bg-card-border/20 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Special requests</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full px-3 py-2 rounded-[8px] border border-card-border/50 bg-white text-[14px] text-foreground focus:border-cherry focus:ring-1 focus:ring-cherry/20 outline-none resize-none"
          placeholder="Allergies, celebrations, preferences..."
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-600 font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-[10px] bg-cherry text-white font-bold text-[15px] hover:bg-cherry/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Booking..." : `Book for ${formatPrice(total, currency)}`}
      </button>

      <p className="text-[11px] text-muted text-center">
        Free cancellation up to 48 hours before the experience.
      </p>
    </form>
  );
}
