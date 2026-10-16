import { Sidebar } from "./sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
