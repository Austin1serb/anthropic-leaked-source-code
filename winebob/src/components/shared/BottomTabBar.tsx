"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wine, User } from "lucide-react";

const tabs = [
  { href: "/arena", label: "Tastings", icon: Wine },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card-bg/90 backdrop-blur-xl border-t border-card-border/50 tab-bar-safe">
      <div className="flex items-center justify-around px-4 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center touch-target gap-0.5 transition-colors relative ${
                isActive ? "text-cherry" : "text-muted"
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 w-8 h-0.5 rounded-full bg-cherry" />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
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
