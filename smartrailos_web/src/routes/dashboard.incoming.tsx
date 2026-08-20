import { createFileRoute } from "@tanstack/react-router";
import { RISK_TW, riskFor } from "@/lib/mock/data";
import { useDashboardSnapshot } from "@/lib/api/hooks";
import { LineBadge } from "@/components/srail/badges";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { formatEta } from "@/lib/use-live-tick";
import { SectionHeader } from "./dashboard.index";
import { ArrowRight, UserPlus, UserMinus, Clock, Users } from "lucide-react";
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
  const snapQ = useDashboardSnapshot();
  const incomingRaw = snapQ.data?.incoming_trains ?? [];
  const incoming = incomingRaw.filter(t => t.train_id !== "ESP32_DEMO").sort((a, b) => a.eta_minutes - b.eta_minutes);
  const hasRealTrains = incoming.length > 0;

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Incoming Trains" right={`${hasRealTrains ? incoming.length : 0} inbound`} />

      {!hasRealTrains ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-obsidian-900/50 text-center">
          <p className="text-lg font-medium text-slate-300">No Incoming Trains</p>
          <p className="mt-2 text-sm text-slate-500">There are currently no trains scheduled to arrive in the next 30 minutes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {incoming.map((t) => {
          const avg = t.predicted_occupancy_at_station ?? 0;
          const risk = riskFor(avg);
          return (
             <div key={t.train_id} className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-obsidian-800 px-2 py-1 font-mono text-xs font-bold text-accent-cyan">{t.train_id}</span>
                  <LineBadge line={(t.line_name || "").toLowerCase().includes("red") ? "red" : "blue"} />
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", RISK_TW[risk])}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {risk} risk
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-white">{t.train_name}</h3>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span>{t.route}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Cell icon={<Clock className="size-3.5" />} label="ETA" value={`${t.eta_minutes} min`} />
                <Cell icon={<Users className="size-3.5" />} label="Platform Crowd" value={`${(t.predicted_station_crowd ?? 0).toLocaleString()} pax`} />
                <Cell icon={<UserPlus className="size-3.5" />} label="Boarding" value={t.predicted_boarding_count} accent />
                <Cell icon={<UserMinus className="size-3.5" />} label="Deboarding" value={t.predicted_deboarding_count} />
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
      )}
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
