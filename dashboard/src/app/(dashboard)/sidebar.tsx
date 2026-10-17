"use client";

import { BarChart3, FileText, Gauge, LayoutGrid, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/usage", label: "Usage", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Sparkles size={16} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">SMG HR Assistant</div>
          <div className="text-xs text-foreground-muted">Admin dashboard</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-border p-3">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
