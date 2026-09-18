"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Login page-এ Bottom Navigation দেখাবে না
  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[80] border-t border-slate-800 bg-slate-950/95 shadow-[0_-10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-around px-3 pb-[env(safe-area-inset-bottom)] md:h-[76px] md:max-w-4xl md:px-10">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(
                item.href + "/"
              ));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-[90px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-all md:min-w-[130px] md:max-w-[180px] ${
                active
                  ? "text-blue-400"
                  : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span
                className={`flex h-9 w-12 items-center justify-center rounded-xl transition-all ${
                  active
                    ? "bg-blue-500/10"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={
                    active ? 2.5 : 2
                  }
                />
              </span>

              <span
                className={`text-xs font-medium md:text-sm ${
                  active
                    ? "text-blue-400"
                    : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}