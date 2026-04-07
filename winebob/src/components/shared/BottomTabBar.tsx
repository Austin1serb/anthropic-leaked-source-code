"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wine, User } from "lucide-react";

const tabs = [
  { href: "/arena", label: "Tastings", icon: Wine },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Routes where the tab bar should be hidden (focused flows) */
const HIDDEN_ROUTES = ["/arena/create", "/arena/event/"];

export function BottomTabBar() {
  const pathname = usePathname();

  // Hide tab bar on focused flows (create, event control)
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-card-border/30 tab-bar-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-6 pt-2.5 pb-1.5">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
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
