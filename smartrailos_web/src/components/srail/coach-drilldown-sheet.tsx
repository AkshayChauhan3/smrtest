import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OccupancyBar } from "./occupancy-bar";
import { LineBadge } from "./badges";
import { RouteTimeline } from "./route-timeline";
import {
  findStation,
  OCC_TEXT,
  OCC_TW,
  statusFromOccupancy,
  type CoachStatus,
  type Train,
} from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Users,
  Gauge,
  AlertTriangle,
  Sparkles,
  TrainFront,
} from "lucide-react";

const STATUS_LABEL: Record<CoachStatus, string> = {
  low: "Comfortable",
  moderate: "Filling Up",
  high: "Heavy",
  critical: "Critical",
};

export function CoachDrillDownSheet({
  train,
  open,
  onOpenChange,
}: {
  train: Train | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const stats = useMemo(() => {
    if (!train) return null;
    const coaches = train.coaches;
    const totalCapacity = coaches.reduce((a, c) => a + c.capacity, 0);
    const totalOnboard = coaches.reduce(
      (a, c) => a + Math.round((c.capacity * c.occupancy) / 100),
      0,
    );
    const avg =
      coaches.length > 0
        ? Math.round(coaches.reduce((a, c) => a + c.occupancy, 0) / coaches.length)
        : 0;
    const fullest = [...coaches].sort((a, b) => b.occupancy - a.occupancy)[0];
    const emptiest = [...coaches].sort((a, b) => a.occupancy - b.occupancy)[0];
    return { totalCapacity, totalOnboard, avg, fullest, emptiest };
  }, [train]);

  const current = train ? findStation(train.currentStationId) : null;
  const next = train ? findStation(train.nextStationId) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l-white/5 bg-obsidian-950 p-0 text-slate-200 sm:max-w-xl"
      >
        {train && stats && (
          <>
            <SheetHeader className="space-y-3 border-b border-white/5 bg-obsidian-900 px-6 py-5 text-left">
              <div className="flex items-center gap-3">
                <span className="rounded bg-obsidian-800 px-2 py-1 font-mono text-xs font-bold text-accent-cyan">
                  {train.id}
                </span>
                <LineBadge line={train.line} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {train.status}
                </span>
              </div>
              <SheetTitle className="text-xl font-extrabold leading-tight text-white">
                {train.direction}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400">
                <span className="text-slate-300">
                  {current?.name ?? train.currentStationId}
                </span>
                <ArrowRight className="mx-1.5 inline size-3 text-slate-600" />
                <span className="text-accent-cyan">
                  {next?.name ?? train.nextStationId}
                </span>
                <span className="ml-3 font-mono text-slate-500">
                  Arr {train.arrival} · Dep {train.departure}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-6 py-6">
              {/* Heading to Next Station Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-cyan/20 bg-accent-cyan/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30">
                    <TrainFront className="size-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
                      Active Route Segment
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      Heading to: <span className="text-accent-cyan">{next?.name ?? train.nextStationId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="rounded bg-obsidian-900/80 px-2.5 py-1 text-slate-300 ring-1 ring-white/10">
                    <span className="text-slate-500">From:</span> {current?.name ?? train.currentStationId}
                  </div>
                  <ArrowRight className="size-3 text-slate-500" />
                  <div className="rounded bg-accent-cyan/20 px-2.5 py-1 font-bold text-accent-cyan ring-1 ring-accent-cyan/30">
                    <span className="text-accent-cyan/70">Next:</span> {next?.name ?? train.nextStationId}
                  </div>
                </div>
              </div>

              {/* Route Timeline Component with Next Stations List */}
              <RouteTimeline train={train} />
              <section className="grid grid-cols-2 gap-3">
                <SummaryTile
                  icon={<Users className="size-3.5" />}
                  label="Onboard"
                  value={stats.totalOnboard.toLocaleString()}
                  sub={`of ${stats.totalCapacity.toLocaleString()} seats`}
                />
                <SummaryTile
                  icon={<Gauge className="size-3.5" />}
                  label="Avg Occupancy"
                  value={`${stats.avg}%`}
                  sub={STATUS_LABEL[statusFromOccupancy(stats.avg)]}
                  tone={statusFromOccupancy(stats.avg)}
                />
                <SummaryTile
                  icon={<AlertTriangle className="size-3.5" />}
                  label="Fullest Coach"
                  value={stats.fullest?.label ?? "—"}
                  sub={`${stats.fullest?.occupancy ?? 0}% full`}
                  tone={statusFromOccupancy(stats.fullest?.occupancy ?? 0)}
                />
                <SummaryTile
                  icon={<Sparkles className="size-3.5" />}
                  label="Most Capacity"
                  value={stats.emptiest?.label ?? "—"}
                  sub={`${stats.emptiest?.occupancy ?? 0}% full`}
                  tone={statusFromOccupancy(stats.emptiest?.occupancy ?? 0)}
                />
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300">
                  <span className="size-1.5 rounded-full bg-accent-cyan" />
                  Coach Breakdown
                  <span className="ml-auto font-mono text-[10px] text-slate-500">
                    {train.coaches.length} coaches
                  </span>
                </h3>
                <ul className="mt-4 space-y-3">
                  {train.coaches.map((c) => {
                    const status = statusFromOccupancy(c.occupancy);
                    const onboard = Math.round((c.capacity * c.occupancy) / 100);
                    return (
                      <li
                        key={c.id}
                        className="rounded-lg border border-white/5 bg-obsidian-900 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid size-9 place-items-center rounded-md bg-obsidian-800",
                                OCC_TEXT[status],
                              )}
                            >
                              <TrainFront className="size-4" />
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {c.label}
                              </div>
                              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                {onboard.toLocaleString()} / {c.capacity.toLocaleString()} pax
                              </div>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                              `${OCC_TW[status]}/15`,
                              OCC_TEXT[status],
                            )}
                          >
                            <span
                              className={cn("size-1.5 rounded-full", OCC_TW[status])}
                            />
                            {STATUS_LABEL[status]}
                          </span>
                        </div>
                        <div className="mt-3">
                          <OccupancyBar value={c.occupancy} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {(train.predictedBoarding > 0 || train.predictedDeboarding > 0) && (
                <section className="rounded-lg border border-white/5 bg-obsidian-900 p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                    Predicted At Next Station
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        Boarding
                      </div>
                      <div className="font-bold text-success">
                        +{train.predictedBoarding}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        Deboarding
                      </div>
                      <div className="font-bold text-accent-cyan">
                        −{train.predictedDeboarding}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: CoachStatus;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-obsidian-900 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-lg font-extrabold tabular-nums",
          tone ? OCC_TEXT[tone] : "text-white",
        )}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
