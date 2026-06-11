import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KpiCard } from "@/components/srail/kpi-card";
import { TrainCard } from "@/components/srail/train-card";
import { CrowdForecast } from "@/components/srail/crowd-forecast";
import { RecommendationCard } from "@/components/srail/recommendation-card";
import { AnimatedNumber } from "@/components/srail/animated-number";
import { LiveTrainTicker } from "@/components/srail/live-train-ticker";
import {
  TRAINS,
  KPI,
  RECOMMENDATIONS,
  ALERTS,
} from "@/lib/mock/data";
import {
  useAlerts,
  useKpi,
  useRecommendations,
  useTrains,
} from "@/lib/api/hooks";
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
  const recsQ = useRecommendations();

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
  const trains = trainsQ.data && trainsQ.data.length > 0 ? trainsQ.data : TRAINS;
  const recs = recsQ.data && recsQ.data.length > 0 ? recsQ.data : RECOMMENDATIONS;
  const alerts = alertsQ.data && alertsQ.data.length > 0 ? alertsQ.data : ALERTS;
  const visible = trains.slice(0, 3);

  return (
    <div className="animate-fade-in-up space-y-8 px-4 py-6 md:px-8 md:py-8">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Current Trains"
          value={<AnimatedNumber value={kpi.currentTrains} format={(n) => String(Math.round(n)).padStart(2, "0")} />}
          delta="+2 vs avg"
          deltaTone="positive"
          icon={<TrainFront className="size-4" />}
        />
        <KpiCard
          label="In Station"
          value={<AnimatedNumber value={kpi.passengersInStation} />}
          delta="Rising"
          deltaTone="warning"
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="In Transit"
          value={<AnimatedNumber value={kpi.passengersInTransit} />}
          delta="Optimal"
          deltaTone="positive"
          icon={<Activity className="size-4" />}
        />
        <KpiCard
          label="Avg Occupancy"
          value={<AnimatedNumber value={kpi.avgOccupancy} format={(n) => `${Math.round(n)}%`} />}
          delta="Yellow band"
          deltaTone="warning"
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
          delta="Surge expected"
          deltaTone="warning"
          icon={<Sparkles className="size-4" />}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <section>
            <SectionHeader title="Live Train Status" right={`${visible.length} of ${trains.length} active`} />
            <div className="mt-4 space-y-4">
              {visible.map((t, i) => (
                <div key={t.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <TrainCard train={t} />
                </div>
              ))}
            </div>
          </section>

          <LiveTrainTicker />

          <CrowdForecast />
        </div>

        <aside className="space-y-6 xl:col-span-4">
          <section>
            <SectionHeader title="AI Recommendations" right="Live" />
            <div className="mt-4 space-y-4">
              {recs.map((r, i) => (
                <div key={r.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <RecommendationCard rec={r} />
                </div>
              ))}
            </div>
          </section>

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
