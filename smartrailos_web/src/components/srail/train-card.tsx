import { useState } from "react";
import { cn } from "@/lib/utils";
import { OccupancyBar } from "./occupancy-bar";
import { LineBadge, RiskBadge } from "./badges";
import { findStation, type Train } from "@/lib/mock/data";
import { formatEta } from "@/lib/use-live-tick";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { CoachDrillDownSheet } from "./coach-drilldown-sheet";

export function TrainCard({ train, className }: { train: Train; className?: string }) {
  const [open, setOpen] = useState(false);
  const liveTrain = train;
  const current = findStation(train.currentStationId);
  const next = findStation(train.nextStationId);

  const totalCapacity = train.coaches.reduce((sum, c) => sum + (c.capacity || 400), 0) || 1200;
  const totalLivePax = train.coaches.reduce(
    (sum, c) => sum + (c.passengers ?? Math.round(((c.capacity || 400) * c.occupancy) / 100)),
    0,
  );
  const liveAvgPct = Math.round(
    train.coaches.reduce((sum, c) => sum + c.occupancy, 0) / Math.max(1, train.coaches.length),
  );

  const totalEstPax =
    train.estimatedDeparturePassengers ??
    train.coaches.reduce(
      (sum, c) =>
        sum +
        (c.estimatedPassengers ??
          c.passengers ??
          Math.round(((c.capacity || 400) * c.occupancy) / 100)),
      0,
    );
  const estAvgPct =
    train.estimatedDepartureOccupancy ??
    Math.round((totalEstPax / totalCapacity) * 100);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View coach details for train ${train.id}`}
        className={cn(
          "group block w-full rounded-xl border border-white/5 bg-obsidian-900 p-5 text-left transition-all hover:border-accent-cyan/40 hover:shadow-lg hover:shadow-accent-cyan/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60",
          className,
        )}
      >
        {/* Top Header: Train ID, Line, Status & ETA */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded bg-obsidian-800 px-2.5 py-1 font-mono text-xs font-bold text-accent-cyan ring-1 ring-white/10">
              {train.id}
            </span>
            <LineBadge line={train.line} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge train={liveTrain} />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {train.status === "At Station" ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  At Station
                </span>
              ) : train.status === "Approaching" ? (
                <span className="inline-flex items-center gap-1 font-semibold text-cyan-400 animate-pulse">
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  Approaching
                </span>
              ) : (
                <span className="text-slate-400">
                  En Route · ETA <span className="font-bold text-white">{formatEta(train.etaSeconds)}</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Direction & Station Info */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-white group-hover:text-accent-cyan transition-colors">
            {train.direction}
          </h3>
          <div className="font-mono text-[11px] text-slate-500">
            Arr {train.arrival} · Dep {train.departure}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-300 font-medium">{current?.name ?? train.currentStationId}</span>
          <ArrowRight className="size-3 text-slate-600" />
          <span className="text-accent-cyan font-medium">{next?.name ?? train.nextStationId}</span>
        </div>

        {/* Estimated Departure Passenger Count at Old High Court Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent-cyan/15 bg-accent-cyan/[0.04] px-3.5 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="size-3.5 text-accent-cyan shrink-0" />
            <span className="text-slate-300 font-medium text-[11px]">
              Est. Departure <span className="text-slate-500 font-normal">(Old High Court)</span>:
            </span>
            <span className="font-mono text-xs font-bold text-accent-cyan">
              {totalEstPax.toLocaleString()} pax
            </span>
            <span className="font-mono text-[10px] text-accent-cyan/70">
              ({estAvgPct}%)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-slate-300" />
              Live: <strong className="text-white font-bold">{totalLivePax.toLocaleString()}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-accent-cyan" />
              Est: <strong className="text-accent-cyan font-bold">{totalEstPax.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Coach Occupancy Dual-Bar Breakdown (Live Real-Time vs ML Estimated Departure) */}
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {(train.coaches ?? []).map((c, idx) => {
            const livePax = c.passengers ?? Math.round(((c.capacity || 400) * c.occupancy) / 100);
            const estPax =
              c.estimatedPassengers ??
              Math.min(c.capacity || 400, Math.round(livePax * 1.08));
            const estPct =
              c.estimatedOccupancy ??
              Math.min(100, Math.round((estPax / (c.capacity || 400)) * 100));

            return (
              <div
                key={c.id}
                className="space-y-2 rounded-lg border border-white/5 bg-obsidian-800/40 p-3"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                  <span>{c.label}</span>
                  <span className="font-mono text-[10px] font-normal text-slate-400">
                    Max {c.capacity || 400}
                  </span>
                </div>

                {/* Bar 1: Real-Time Live Occupancy */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="size-1 rounded-full bg-slate-300" />
                      Live
                    </span>
                    <span className="font-bold text-slate-200">
                      {livePax} pax ({c.occupancy}%)
                    </span>
                  </div>
                  <OccupancyBar
                    value={c.occupancy}
                    showPaxCount={false}
                    className="space-y-0"
                  />
                </div>

                {/* Bar 2: ML Estimated Departure Occupancy */}
                <div className="space-y-1 pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-accent-cyan/90">
                    <span className="flex items-center gap-1">
                      <Sparkles className="size-2.5 text-accent-cyan" />
                      Est. Dep
                    </span>
                    <span className="font-bold text-accent-cyan">
                      {estPax} pax ({estPct}%)
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        estPct < 50
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : estPct < 75
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : estPct < 90
                              ? "bg-gradient-to-r from-orange-500 to-amber-500"
                              : "bg-gradient-to-r from-rose-500 to-red-500",
                      )}
                      style={{ width: `${estPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-hover:text-accent-cyan">
          View full coach breakdown
          <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
      <CoachDrillDownSheet train={liveTrain} open={open} onOpenChange={setOpen} />
    </>
  );
}
