"use client";

import { useEffect, useRef, useCallback } from "react";

interface EngagementTrackerProps {
  wineId?: string;
  path?: string;
  children: React.ReactNode;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("wb_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("wb_session_id", id);
  }
  return id;
}

type TrackingEvent = {
  eventType: string;
  wineId?: string;
  metadata: Record<string, unknown>;
  sessionId: string;
};

const pendingEvents: TrackingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueEvent(event: TrackingEvent) {
  pendingEvents.push(event);
  if (pendingEvents.length >= 10) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, 5000);
  }
}

function flushEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingEvents.length === 0) return;
  const batch = pendingEvents.splice(0, 20);
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: batch }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Client-side engagement tracker. Wraps content and tracks:
 * - Page view on mount
 * - Scroll depth at 25/50/75/100% thresholds
 * - Time on page at 15s/30s/60s/120s thresholds
 */
export function EngagementTracker({
  wineId,
  path,
  children,
}: EngagementTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollMilestonesRef = useRef(new Set<number>());
  const timeMilestonesRef = useRef(new Set<number>());

  const emit = useCallback(
    (eventType: string, metadata: Record<string, unknown>) => {
      queueEvent({
        eventType,
        wineId,
        metadata,
        sessionId: getSessionId(),
      });
    },
    [wineId]
  );

  // Page view on mount
  useEffect(() => {
    emit("page_view", {
      path: path ?? window.location.pathname,
      referrer: document.referrer || undefined,
    });
    // Flush on page unload
    const handleUnload = () => flushEvents();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [emit, path]);

  // Time-on-page tracking
  useEffect(() => {
    const milestones = [15_000, 30_000, 60_000, 120_000];
    const timers = milestones.map((ms) =>
      setTimeout(() => {
        if (!timeMilestonesRef.current.has(ms)) {
          timeMilestonesRef.current.add(ms);
          emit("engagement", {
            action: `time_on_page_${ms / 1000}s`,
            durationMs: ms,
          });
        }
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [emit]);

  // Scroll depth tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const thresholds = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of thresholds) {
        if (
          percent >= threshold &&
          !scrollMilestonesRef.current.has(threshold)
        ) {
          scrollMilestonesRef.current.add(threshold);
          emit("engagement", {
            action: `scroll_depth_${threshold}`,
            durationMs: 0,
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [emit]);

  return <div ref={containerRef}>{children}</div>;
}
