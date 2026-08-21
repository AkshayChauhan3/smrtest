import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  TrainFront,
  ArrowDownToLine,
  Users,
  Cpu,
  Sparkles,
  BarChart3,
  Bell,
  Megaphone,
  Boxes,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import smartRailLogo from "@/assets/smartrail-logo.png";

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/live-trains", label: "Live Trains", icon: TrainFront },
  { to: "/dashboard/esp-sensor", label: "Live Sensor (ESP32)", icon: Cpu },
  { to: "/dashboard/incoming", label: "Incoming Trains", icon: ArrowDownToLine },
  { to: "/dashboard/stations", label: "Stations", icon: Building2 },
  { to: "/dashboard/crowd", label: "Station Crowd", icon: Users },
  { to: "/dashboard/predictions", label: "Predictions", icon: Sparkles },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/digital-twin", label: "Digital Twin", icon: Boxes },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-obsidian-900 lg:flex">
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
        <div className="grid size-9 place-items-center rounded-md bg-white p-1">
          <img src={smartRailLogo} alt="SmartRail logo" className="size-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-extrabold uppercase tracking-wider text-white">SmartRail</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Command Center
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-cyan/10 text-accent-cyan"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-accent-cyan" : "text-slate-500")} />
              <span className={cn("font-medium", active && "font-semibold")}>{item.label}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-accent-cyan" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="rounded-lg border border-white/5 bg-obsidian-800/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            System Health
          </p>
          <div className="mt-2 flex gap-1">
            <div className="h-1 flex-1 rounded-full bg-accent-cyan" />
            <div className="h-1 flex-1 rounded-full bg-accent-cyan" />
            <div className="h-1 flex-1 rounded-full bg-accent-cyan" />
            <div className="h-1 flex-1 rounded-full bg-white/10" />
          </div>
          <p className="mt-2 font-mono text-[10px] text-slate-500">82.4% nominal</p>
        </div>
      </div>
    </aside>
  );
}
