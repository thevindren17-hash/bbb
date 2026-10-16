"use client";

import { BarChart3, FileText, Gauge, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/usage", label: "Usage", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col border-r border-black/10 dark:border-white/15">
      <div className="px-4 py-5">
        <span className="text-sm font-semibold">SMG HR Assistant</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-black/10 p-3 dark:border-white/15">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
