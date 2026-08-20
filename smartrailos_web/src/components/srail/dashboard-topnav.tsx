import { Bell, Search, AlertOctagon } from "lucide-react";
import { useClock, formatTime, formatDate } from "@/lib/use-live-tick";
import { useSimTime } from "@/lib/api/hooks";
import { CURRENT_STATION } from "@/lib/mock/data";
import { useEmergencyStatus } from "@/lib/use-emergency-status";

export function DashboardTopNav() {
  const now = useClock();
  const emergencyActive = useEmergencyStatus();
  const simTimeQ = useSimTime();
  const isSimOverridden = simTimeQ.data?.is_overridden;

  return (
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/5 bg-obsidian-900/80 px-4 py-3 backdrop-blur sm:flex sm:flex-wrap sm:justify-between sm:gap-4 md:h-16 md:px-8 md:py-0">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        <div className="min-w-0">
          <h1 className="truncate text-xs font-extrabold uppercase tracking-wide text-white sm:text-sm md:text-base">
            {CURRENT_STATION}
          </h1>
          <p className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-500 lg:block">
            Blue Line · Red Line · Platform 1–2
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-400 lg:flex">
          {isSimOverridden && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 ring-1 ring-amber-500/30">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              SIM
            </span>
          )}
          <span>{formatTime(now)} IST · {formatDate(now)}</span>
        </div>
      </div>


      {/* Right */}
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {/* Search — hidden on small screens */}
        <button
          onClick={() => (window as unknown as { __openPalette?: () => void }).__openPalette?.()}
          className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-slate-400 hover:bg-white/10 lg:flex"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="hidden xl:inline">Search trains, stations…</span>
          <kbd className="ml-1 hidden rounded border border-white/10 bg-obsidian-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 xl:block">
            ⌘K
          </kbd>
        </button>

        {/* Bell — always visible, icon-only */}
        <button className="grid size-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 md:size-9">
          <Bell className="size-4" />
        </button>

        {/* Emergency — always visible, icon + text on sm+ */}
        <button
          aria-live="assertive"
          aria-label={emergencyActive ? "Emergency active" : "Emergency"}
          className={
            "flex h-8 items-center gap-1.5 rounded-md border px-2 text-[11px] font-bold uppercase tracking-widest sm:h-9 sm:gap-2 sm:px-3 sm:text-xs " +
            (emergencyActive
              ? "animate-emergency-blink border-alert-red text-white"
              : "border-alert-red/40 bg-alert-red/15 text-alert-red hover:bg-alert-red hover:text-white")
          }
        >
          <AlertOctagon className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">{emergencyActive ? "Emergency!" : "Emergency"}</span>
        </button>


        {/* Avatar — always visible */}
        <div className="ml-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-obsidian-800 text-xs font-bold text-slate-300 ring-1 ring-white/10 md:size-9">
          OP
        </div>
      </div>
    </header>
  );
}
