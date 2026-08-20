import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KpiCard } from "@/components/srail/kpi-card";
import { TrainCard } from "@/components/srail/train-card";
import { CrowdForecast } from "@/components/srail/crowd-forecast";

import { AnimatedNumber } from "@/components/srail/animated-number";
import { LiveTrainTicker } from "@/components/srail/live-train-ticker";
import {
  TRAINS,
  KPI,
  ALERTS,
} from "@/lib/mock/data";
import {
  useAlerts,
  useKpi,
  useTrains,
  useKpiHistory,
} from "@/lib/api/hooks";
import { computeDelta, occupancyBand } from "@/lib/api/smartrail";
import { USE_MOCK } from "@/lib/api/client";
import { jitter, useLiveTick } from "@/lib/use-live-tick";
import {
  TrainFront,
  Users,
  Activity,
  AlertTriangle,
  Sparkles,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview · SmartRail OS Command Center" },
      { name: "description", content: "Live operations overview for Old High Court Interchange." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const trainsQ = useTrains();
  const kpiQ = useKpi();
  const alertsQ = useAlerts();
  const histQ = useKpiHistory();

  // Initial skeleton: wait for the first query to resolve when real backend
  // is wired; in mock mode fall back to the original 700ms shimmer so the UX
  // doesn't flash.
  const [mockReady, setMockReady] = useState(!USE_MOCK);
  useEffect(() => {
    if (!USE_MOCK) return;
    const t = setTimeout(() => setMockReady(true), 700);
    return () => clearTimeout(t);
  }, []);
  const loading = USE_MOCK ? !mockReady : kpiQ.isLoading;

  // In mock mode, jitter the KPI so the page feels alive. With a real backend,
  // refetchInterval drives updates and we use the live KPI directly.
  const tick = useLiveTick(3500);
  const [mockKpi, setMockKpi] = useState(KPI);
  useEffect(() => {
    if (!USE_MOCK) return;
    setMockKpi((k) => ({
      ...k,
      currentTrains: jitter(k.currentTrains, 1, 6, 12),
      passengersInStation: jitter(k.passengersInStation, 40, 900, 1900),
      passengersInTransit: jitter(k.passengersInTransit, 120, 2800, 4200),
      avgOccupancy: jitter(k.avgOccupancy, 3, 45, 88),
      predictedNextHour: jitter(k.predictedNextHour, 80, 1600, 2400),
    }));
  }, [tick]);

  if (loading) return <OverviewSkeleton />;

  const kpi = kpiQ.data ?? mockKpi;
  const trainsRaw = trainsQ.data ?? TRAINS;
  
  // ESP32 visibility: hide during online hours, show during offline hours
  const hasRealTrains = trainsRaw.some(t => t.id !== "ESP32_DEMO");
  const trainsFiltered = hasRealTrains ? trainsRaw.filter(t => t.id !== "ESP32_DEMO") : trainsRaw;

  // Sort trains dynamically by proximity & relevance to Old High Court Interchange
  const [lineFilter, setLineFilter] = useState<"all" | "blue" | "red">("all");
  const [viewAll, setViewAll] = useState(false);

  const trains = [...trainsFiltered]
    .filter((t) => (lineFilter === "all" ? true : t.line === lineFilter))
    .sort((a, b) => {
      if (a.id === "ESP32_DEMO") return -1;
      if (b.id === "ESP32_DEMO") return 1;

      // 1. Prioritize trains stopped at or heading into Old High Court (BL11 / RL07)
      const aAtInterchange =
        a.currentStationId === "BL11" ||
        a.currentStationId === "RL07" ||
        a.nextStationId === "BL11" ||
        a.nextStationId === "RL07";
      const bAtInterchange =
        b.currentStationId === "BL11" ||
        b.currentStationId === "RL07" ||
        b.nextStationId === "BL11" ||
        b.nextStationId === "RL07";

      if (aAtInterchange && !bAtInterchange) return -1;
      if (!aAtInterchange && bAtInterchange) return 1;

      // 2. Active status priority
      if (a.status === "At Station" && b.status !== "At Station") return -1;
      if (b.status === "At Station" && a.status !== "At Station") return 1;
      if (a.status === "Approaching" && b.status !== "Approaching") return -1;
      if (b.status === "Approaching" && a.status !== "Approaching") return 1;

      // 3. Lowest ETA
      return (a.etaSeconds || 0) - (b.etaSeconds || 0);
    });

  const alerts = alertsQ.data && alertsQ.data.length > 0 ? alertsQ.data : ALERTS;
  const visible = viewAll ? trains : trains.slice(0, 3);
  
  const hist = histQ.data;
  const ago = hist?.hour_ago ?? undefined;

  return (
    <div className="animate-fade-in-up space-y-8 px-4 py-6 md:px-8 md:py-8">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Current Trains"
          value={<AnimatedNumber value={kpi.currentTrains} format={(n) => String(Math.round(n)).padStart(2, "0")} />}
          {...computeDelta(kpi.currentTrains, ago?.active_trains)}
          icon={<TrainFront className="size-4" />}
        />
        <KpiCard
          label="In Station"
          value={<AnimatedNumber value={kpi.passengersInStation} />}
          {...computeDelta(kpi.passengersInStation, ago?.total_station_crowd, " pax", true)}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="In Transit"
          value={<AnimatedNumber value={kpi.passengersInTransit} />}
          {...computeDelta(kpi.passengersInTransit, ago?.passengers_in_transit, " pax")}
          icon={<Activity className="size-4" />}
        />
        <KpiCard
          label="Avg Occupancy"
          value={<AnimatedNumber value={kpi.avgOccupancy} format={(n) => `${Math.round(n)}%`} />}
          delta={occupancyBand(kpi.avgOccupancy).label}
          deltaTone={occupancyBand(kpi.avgOccupancy).tone}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label="Active Alerts"
          value={<AnimatedNumber value={kpi.activeAlerts} format={(n) => String(Math.round(n)).padStart(2, "0")} />}
          delta={`${alerts.filter((a) => a.severity === "Emergency" && !a.resolved).length} critical`}
          deltaTone="negative"
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiCard
          label="Next-Hour Crowd"
          value={<AnimatedNumber value={kpi.predictedNextHour} />}
          delta={kpi.predictedNextHour > (ago?.total_station_crowd ?? 0) * 1.15 ? "Surge expected" : "Stable"}
          deltaTone={kpi.predictedNextHour > (ago?.total_station_crowd ?? 0) * 1.15 ? "warning" : "positive"}
          icon={<Sparkles className="size-4" />}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Live Train Status" right={`${visible.length} of ${trains.length} active`} />
              
              <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-obsidian-800/60 p-1 text-[10px] font-bold uppercase tracking-wider">
                <button
                  onClick={() => setLineFilter("all")}
                  className={cn(
                    "rounded px-2 py-0.5 transition-colors",
                    lineFilter === "all" ? "bg-accent-cyan text-obsidian-950" : "text-slate-400 hover:text-white"
                  )}
                >
                  All ({trainsFiltered.length})
                </button>
                <button
                  onClick={() => setLineFilter("blue")}
                  className={cn(
                    "rounded px-2 py-0.5 transition-colors",
                    lineFilter === "blue" ? "bg-accent-blue-2 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  Blue Line
                </button>
                <button
                  onClick={() => setLineFilter("red")}
                  className={cn(
                    "rounded px-2 py-0.5 transition-colors",
                    lineFilter === "red" ? "bg-danger text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  Red Line
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {trains.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-obsidian-900/50 text-center">
                  <TrainFront className="mb-2 size-6 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">No Active Trains</p>
                  <p className="text-xs text-slate-500">There are currently no active trains matching this filter.</p>
                </div>
              ) : (
                visible.map((t, i) => (
                  <div key={t.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <TrainCard train={t} />
                  </div>
                ))
              )}
            </div>

            {trains.length > 3 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setViewAll(!viewAll)}
                  className="rounded-lg border border-white/5 bg-obsidian-800/40 px-4 py-1.5 text-xs font-semibold text-accent-cyan hover:bg-obsidian-800 hover:border-accent-cyan/30 transition-all"
                >
                  {viewAll ? "Show Top 3 Only" : `Show All ${trains.length} Active Trains`}
                </button>
              </div>
            )}
          </section>

          <LiveTrainTicker />

          <CrowdForecast />
        </div>

        <aside className="space-y-6 xl:col-span-4">
          <section className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
            <SectionHeader title="Recent Alerts" right="Last hour" />
            <ul className="mt-4 space-y-3">
              {alerts.filter((a) => !a.resolved).slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-start gap-3 border-l-2 border-warning/60 pl-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white">{a.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{a.description}</div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-600">{a.time}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300">
        <span className="size-1.5 rounded-full bg-accent-cyan" />
        {title}
      </h2>
      {right && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{right}</span>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8 px-4 py-6 md:px-8 md:py-8">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
            <div className={cn("skeleton h-3 w-20")} />
            <div className={cn("skeleton mt-4 h-7 w-24")} />
            <div className={cn("skeleton mt-3 h-2 w-16")} />
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-20" />
              </div>
              <div className="skeleton mt-4 h-4 w-48" />
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="skeleton h-2 w-full" />
                <div className="skeleton h-2 w-full" />
                <div className="skeleton h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4 xl:col-span-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
              <div className="skeleton h-3 w-28" />
              <div className="skeleton mt-3 h-4 w-40" />
              <div className="skeleton mt-2 h-3 w-full" />
              <div className="skeleton mt-4 h-7 w-full" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
