import Link from "next/link";

import { signOut } from "@/app/login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/15">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <span className="font-semibold">SMG HR Assistant</span>
          <Link href="/documents" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
            Documents
          </Link>
          <Link href="/analytics" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
            Analytics
          </Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
