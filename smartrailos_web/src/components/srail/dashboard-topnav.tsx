import { Bell, Search, AlertOctagon } from "lucide-react";
import { useClock, formatTime, formatDate } from "@/lib/use-live-tick";
import { CURRENT_STATION, findStation } from "@/lib/mock/data";
import { useEmergencyStatus } from "@/lib/use-emergency-status";
import { useStations } from "@/lib/api/hooks";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function DashboardTopNav() {
  const now = useClock();
  const emergencyActive = useEmergencyStatus();
  const routerState = useRouterState();
  const stationsQ = useStations();

  // Determine if on a station route (/dashboard/stations/$stationId)
  const pathname = routerState.location.pathname;
  const match = pathname.match(/\/dashboard\/stations\/([^/]+)/);
  const stationId = match ? decodeURIComponent(match[1]) : null;

  const station = stationId
    ? stationsQ.data?.find((s) => s.id.toLowerCase() === stationId.toLowerCase()) || findStation(stationId)
    : null;

  const displayTitle = station ? station.name.toUpperCase() : CURRENT_STATION;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#000000] px-4 backdrop-blur-xl shadow-md md:px-8">
      {/* Left Group: Station Title & Global Search Bar */}
      <div className="flex min-w-0 items-center gap-4 md:gap-6">
        <div className="min-w-0 shrink-0">
          <h1 className="truncate text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm md:text-base">
            {displayTitle}
          </h1>
        </div>

        {/* Global Search Bar on the Left */}
        <button
          onClick={() => (window as unknown as { __openPalette?: () => void }).__openPalette?.()}
          className="flex h-9 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Search className="size-3.5 shrink-0 text-slate-400" />
          <span className="hidden sm:inline">Search trains, stations, schedules…</span>
          <kbd className="ml-2 hidden rounded border border-white/10 bg-obsidian-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 md:block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Group: Clock, Notifications, Emergency Button & Profile Avatar */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Live Clock Badge */}
        <div className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] font-bold tabular-nums text-slate-300 xl:block">
          {formatTime(now)} IST · {formatDate(now)}
        </div>

        {/* Bell Button */}
        <button
          aria-label="Notifications"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Bell className="size-4" />
        </button>

        {/* Red Emergency Action Button */}
        <button
          aria-live="assertive"
          aria-label={emergencyActive ? "Emergency active" : "Emergency"}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold uppercase tracking-widest transition-all shadow-sm",
            emergencyActive
              ? "animate-emergency-blink border-rose-500 text-white"
              : "border-rose-500/30 bg-rose-500/15 text-rose-400 hover:bg-rose-600 hover:text-white"
          )}
        >
          <AlertOctagon className="size-4 shrink-0" />
          <span className="hidden sm:inline">{emergencyActive ? "Emergency!" : "Emergency"}</span>
        </button>

        {/* Profile Avatar */}
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white ring-2 ring-white/10 shadow-sm">
          OP
        </div>
      </div>
    </header>
  );
}
