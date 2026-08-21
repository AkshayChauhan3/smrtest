import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { OccupancyBar } from "./occupancy-bar";
import { LineBadge, RiskBadge } from "./badges";
import { findStation, type Train } from "@/lib/mock/data";
import { formatEta } from "@/lib/use-live-tick";
import { ArrowRight, ChevronRight, Sparkles, Clock, Timer } from "lucide-react";
import { CoachDrillDownSheet } from "./coach-drilldown-sheet";

export function TrainCard({ train, className }: { train: Train; className?: string }) {
  const [open, setOpen] = useState(false);
  const liveTrain = train;
  const current = findStation(train.currentStationId);
  const next = findStation(train.nextStationId);

  const isServerAtStation = train.status === "At Station" || train.status === "Departing";

  // Pick the right ETA source based on status:
  const etaSource = isServerAtStation
    ? (train.departureEtaSeconds ?? train.etaSeconds)
    : (train.arrivalEtaSeconds ?? train.etaSeconds);

  // Target time in ms for current phase
  const [targetMs, setTargetMs] = useState(() => Date.now() + Math.max(0, etaSource ?? 0) * 1000);
  const [phaseSeconds, setPhaseSeconds] = useState(() => Math.max(0, etaSource ?? 0));
  const [dwellElapsed, setDwellElapsed] = useState(0);
  const [postDepSeconds, setPostDepSeconds] = useState(0);

  useEffect(() => {
    const newTarget = Date.now() + Math.max(0, etaSource ?? 0) * 1000;
    setTargetMs((prev) => (Math.abs(prev - newTarget) > 2500 ? newTarget : prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [train.id, train.status, etaSource]);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.round((targetMs - Date.now()) / 1000);

      if (remaining > 0) {
        setPhaseSeconds(remaining);
        setDwellElapsed(0);
        setPostDepSeconds(0);
      } else {
        const overtime = Math.abs(remaining);
        setPhaseSeconds(0);

        if (isServerAtStation) {
          // Dwelling train has departed: count post-departure window (0 to 30s)
          setPostDepSeconds(overtime);
        } else {
          // Approaching train has arrived: simulate standard 30s station halt
          if (overtime <= 30) {
            setDwellElapsed(overtime);
            setPostDepSeconds(0);
          } else {
            // Station halt finished: now departed
            setDwellElapsed(30);
            setPostDepSeconds(overtime - 30);
          }
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs, isServerAtStation]);

  // Auto-remove card 30 seconds after departure
  if (postDepSeconds >= 30) {
    return null;
  }

  // Derive active display phase
  const isHalting = isServerAtStation ? phaseSeconds > 0 : (phaseSeconds <= 0 && dwellElapsed < 30);
  const isDeparted = isServerAtStation ? phaseSeconds <= 0 : (phaseSeconds <= 0 && dwellElapsed >= 30);
  const isApproaching = !isServerAtStation && phaseSeconds > 0 && phaseSeconds <= 60;
  const isEnRoute = !isServerAtStation && phaseSeconds > 60;

  const haltTimeLeft = isServerAtStation ? phaseSeconds : Math.max(0, 30 - dwellElapsed);
  const timerFormatted = formatEta(
    isHalting ? haltTimeLeft : phaseSeconds
  );

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

          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge train={liveTrain} />
            
            {/* Prominent Live Ticking Timer Badge with Real Dynamic Color Flow */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs font-extrabold shadow-sm transition-colors",
                isDeparted
                  ? "border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-rose-500/20"
                  : isHalting
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-amber-500/10"
                  : isApproaching
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-amber-500/10 animate-pulse"
                  : "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan shadow-accent-cyan/10"
              )}
            >
              <Clock
                className={cn(
                  "size-3.5",
                  isDeparted ? "text-rose-400" : (isHalting || isApproaching) ? "text-amber-400" : "text-accent-cyan",
                  "animate-pulse"
                )}
              />
              <span>
                {isDeparted
                  ? `DEPARTED · EN ROUTE (${Math.max(0, 30 - postDepSeconds)}s)`
                  : isHalting
                  ? `STATION HALT · ${timerFormatted} LEFT`
                  : isApproaching
                  ? `ARRIVES IN ${timerFormatted}`
                  : `EN ROUTE · ETA ${timerFormatted}`}
              </span>
            </div>
          </div>
        </div>

        {/* Direction, Live Countdown & Timetable Info */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-bold text-white group-hover:text-accent-cyan transition-colors">
            {train.direction}
          </h3>

          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-bold",
                isDeparted
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
                  : isHalting
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : isApproaching
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan"
              )}
            >
              <Timer className="size-3 animate-spin" style={{ animationDuration: "6s" }} />
              <span>
                {isDeparted
                  ? `Departed · Next: ${next?.name ?? train.nextStationId}`
                  : isHalting
                  ? `Halt: ${timerFormatted}`
                  : `ETA: ${timerFormatted}`}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              <span className="text-slate-500">Arr</span> {train.arrival} · <span className="text-slate-500">Dep</span> {train.departure}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-300 font-medium">
            {isDeparted
              ? `Departed: ${current?.name ?? train.currentStationId}`
              : isHalting
              ? `At Platform: ${next?.name ?? current?.name ?? train.currentStationId}`
              : (current?.name ?? train.currentStationId)}
          </span>
          <ArrowRight className="size-3 text-slate-600" />
          <span className="text-accent-cyan font-semibold">
            {isDeparted
              ? `En Route to: ${next?.name ?? train.nextStationId}`
              : isHalting
              ? `Next Departure: ${next?.name ?? train.nextStationId}`
              : `Heading to: ${next?.name ?? train.nextStationId}`}
          </span>
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
