"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Swords,
  TrendingUp,
  Wine,
  Footprints,
  User,
} from "lucide-react";

const tabs = [
  { href: "/arena", label: "Arena", icon: Swords },
  { href: "/futures", label: "Futures", icon: TrendingUp },
  { href: "/cellar", label: "Cellar", icon: Wine },
  { href: "/trail", label: "Trail", icon: Footprints },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card-bg/95 backdrop-blur-md border-t border-card-border tab-bar-safe">
      <div className="flex items-center justify-around px-2 pt-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center touch-target gap-0.5 transition-colors ${
                isActive
                  ? "text-tab-active"
                  : "text-tab-inactive"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
