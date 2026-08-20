import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { OccupancyBar } from "./occupancy-bar";
import { LineBadge, RiskBadge } from "./badges";
import { findStation, type Train } from "@/lib/mock/data";
import { formatEta, jitter, useLiveTick } from "@/lib/use-live-tick";
import { ArrowRight, ChevronRight } from "lucide-react";
import { CoachDrillDownSheet } from "./coach-drilldown-sheet";

export function TrainCard({ train, className }: { train: Train; className?: string }) {
  const [open, setOpen] = useState(false);
  const liveTrain = train;
  const current = findStation(train.currentStationId);
  const next = findStation(train.nextStationId);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View coach details for train ${train.id}`}
        className={cn(
          "group block w-full rounded-xl border border-white/5 bg-obsidian-900 p-5 text-left transition-colors hover:border-accent-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60",
          className,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded bg-obsidian-800 px-2 py-1 font-mono text-xs font-bold text-accent-cyan">
              {train.id}
            </span>
            <LineBadge line={train.line} />
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge train={liveTrain} />
            <span className="font-mono text-[11px] uppercase tracking-widest">
              {train.status === "At Station" ? (
                <span className="text-emerald-400 font-semibold">● At Station</span>
              ) : train.status === "Approaching" ? (
                <span className="text-cyan-400 font-semibold animate-pulse">◉ Approaching</span>
              ) : (
                <span className="text-slate-400">En Route · ETA {formatEta(train.etaSeconds)}</span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-white">{train.direction}</h3>
          <div className="font-mono text-[11px] text-slate-500">
            Arr {train.arrival} · Dep {train.departure}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-300">{current?.name ?? train.currentStationId}</span>
          <ArrowRight className="size-3 text-slate-600" />
          <span className="text-accent-cyan">{next?.name ?? train.nextStationId}</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(train.coaches ?? []).map((c) => (
            <OccupancyBar key={c.id} value={c.occupancy} label={c.label} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-hover:text-accent-cyan">
          View coach details
          <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
      <CoachDrillDownSheet train={liveTrain} open={open} onOpenChange={setOpen} />
    </>
  );
}
