import { Bell, Search, Sparkles, AlertOctagon } from "lucide-react";
import { useClock, formatTime, formatDate } from "@/lib/use-live-tick";
import { CURRENT_STATION } from "@/lib/mock/data";

export function DashboardTopNav() {
  const now = useClock();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-obsidian-900/80 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-extrabold uppercase tracking-wide text-white md:text-base">
            {CURRENT_STATION}
          </h1>
          <p className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-500 md:block">
            Blue Line · Red Line · Platform 1–2
          </p>
        </div>
        <div className="hidden rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-400 md:block">
          {formatTime(now)} IST · {formatDate(now)}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={() => (window as unknown as { __openPalette?: () => void }).__openPalette?.()}
          className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-slate-400 hover:bg-white/10 md:flex"
        >
          <Search className="size-3.5" />
          <span>Search trains, stations…</span>
          <kbd className="ml-2 rounded border border-white/10 bg-obsidian-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            ⌘K
          </kbd>
        </button>
        <button className="grid size-9 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
          <Bell className="size-4" />
        </button>
        <button className="hidden h-9 items-center gap-2 rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-3 text-xs font-bold uppercase tracking-widest text-accent-cyan hover:bg-accent-cyan/20 md:flex">
          <Sparkles className="size-3.5" />
          AI Assistant
        </button>
        <button className="flex h-9 items-center gap-2 rounded-md border border-alert-red/40 bg-alert-red/15 px-3 text-xs font-bold uppercase tracking-widest text-alert-red hover:bg-alert-red hover:text-white">
          <AlertOctagon className="size-3.5" />
          <span className="hidden sm:inline">Emergency</span>
        </button>
        <div className="ml-1 grid size-9 place-items-center rounded-full bg-obsidian-800 text-xs font-bold text-slate-300 ring-1 ring-white/10">
          OP
        </div>
      </div>
    </header>
  );
}
