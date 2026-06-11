import { createFileRoute } from "@tanstack/react-router";
import { TRAINS, findStation, riskFor, RISK_TW } from "@/lib/mock/data";
import { LineBadge } from "@/components/srail/badges";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { formatEta } from "@/lib/use-live-tick";
import { SectionHeader } from "./dashboard.index";
import { ArrowRight, UserPlus, UserMinus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/incoming")({
  head: () => ({
    meta: [
      { title: "Incoming Trains · SmartRail OS" },
      { name: "description", content: "Trains approaching Old High Court Interchange with risk and flow forecast." },
    ],
  }),
  component: IncomingPage,
});

function IncomingPage() {
  const incoming = TRAINS.filter((t) => t.status !== "Departing").sort((a, b) => a.etaSeconds - b.etaSeconds);
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Incoming Trains" right={`${incoming.length} inbound`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {incoming.map((t) => {
          const avg = Math.round(t.coaches.reduce((s, c) => s + c.occupancy, 0) / t.coaches.length);
          const risk = riskFor(t);
          return (
            <div key={t.id} className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-obsidian-800 px-2 py-1 font-mono text-xs font-bold text-accent-cyan">{t.id}</span>
                  <LineBadge line={t.line} />
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", RISK_TW[risk])}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {risk} risk
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-white">{t.direction}</h3>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span>{findStation(t.currentStationId)?.name}</span>
                <ArrowRight className="size-3 text-slate-600" />
                <span className="text-accent-cyan">{findStation(t.nextStationId)?.name}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <Cell icon={<Clock className="size-3.5" />} label="ETA" value={formatEta(t.etaSeconds)} />
                <Cell icon={<UserPlus className="size-3.5" />} label="Boarding" value={t.predictedBoarding} accent />
                <Cell icon={<UserMinus className="size-3.5" />} label="Deboarding" value={t.predictedDeboarding} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Predicted Avg Occupancy</span>
                  <span className="font-mono text-accent-cyan">{avg}%</span>
                </div>
                <OccupancyBar value={avg} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/5 bg-obsidian-800/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {icon} {label}
      </div>
      <div className={cn("mt-1 font-mono text-base font-bold", accent ? "text-accent-cyan" : "text-white")}>{value}</div>
    </div>
  );
}
