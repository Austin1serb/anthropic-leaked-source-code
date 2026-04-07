"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wine, Library, Radio, User } from "lucide-react";

const tabs = [
  { href: "/arena", label: "Tastings", icon: Wine },
  { href: "/wines", label: "Wines", icon: Library },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Routes where the tab bar should be hidden (focused flows) */
const HIDDEN_ROUTES = ["/arena/create", "/arena/event/", "/play/", "/join/", "/live/"];

export function BottomTabBar() {
  const pathname = usePathname();

  // Hide on focused flows — but NOT on /live itself (only /live/[id])
  const shouldHide = HIDDEN_ROUTES.some((r) => {
    if (r === "/live/") return pathname.startsWith("/live/");
    return pathname.startsWith(r);
  });
  // Keep tab bar visible on exact /live page
  if (shouldHide && pathname !== "/live") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-card-border/30 tab-bar-safe">
      <div className="container-wide flex items-center justify-around pt-2.5 pb-1.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center touch-target gap-1 transition-all relative ${
                isActive ? "text-cherry" : "text-muted"
              }`}
            >
              <div className={`relative transition-transform ${isActive ? "scale-105" : ""}`}>
                {isActive && (
                  <div className="absolute -inset-2 rounded-xl bg-cherry/8" />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className="relative" />
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
