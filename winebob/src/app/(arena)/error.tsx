"use client";

export default function ArenaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6">
      <div className="bg-card-bg border border-card-border rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.04)] p-8 max-w-sm w-full text-center">
        <h2 className="text-[20px] font-bold font-serif text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-[14px] text-muted mb-6">
          We couldn&apos;t load this page. This is usually temporary.
        </p>
        <button
          onClick={reset}
          className="btn-primary w-full touch-target"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
