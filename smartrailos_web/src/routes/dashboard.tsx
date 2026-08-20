import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/srail/dashboard-sidebar";
import { DashboardTopNav } from "@/components/srail/dashboard-topnav";
import { CommandPalette } from "@/components/srail/command-palette";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "SmartRail OS · Command Center" },
      { name: "description", content: "Real-time station operations dashboard for SmartRail OS." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-obsidian-950 pl-0 text-slate-300 lg:pl-64">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopNav />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
