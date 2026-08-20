import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RISK_TW, riskFor } from "@/lib/mock/data";
import { useDashboardSnapshot } from "@/lib/api/hooks";
import { LineBadge } from "@/components/srail/badges";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { formatEta } from "@/lib/use-live-tick";
import { SectionHeader } from "./dashboard.index";
import { ArrowRight, UserPlus, UserMinus, Clock, Users, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BackendIncomingTrain } from "@/lib/api/smartrail";

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
          {incoming.map((t) => (
            <IncomingTrainCard key={t.train_id} train={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function IncomingTrainCard({ train }: { train: BackendIncomingTrain }) {
  const avg = train.predicted_occupancy_at_station ?? 0;
  const risk = riskFor(avg);

  // Live 1-second ticking countdown timer
  const initialSeconds = Math.max(15, (train.eta_minutes || 2) * 60);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 120 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveTimerFormatted = formatEta(secondsLeft);

  // Calculate estimated arrival & departure times based on current time + eta
  const now = new Date();
  const arrDate = new Date(now.getTime() + secondsLeft * 1000);
  const depDate = new Date(arrDate.getTime() + 60 * 1000); // 1 min stop

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const arrTimeStr = formatTime(arrDate);
  const depTimeStr = formatTime(depDate);

  return (
    <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-obsidian-800 px-2.5 py-1 font-mono text-xs font-bold text-accent-cyan ring-1 ring-white/10">
            {train.train_id}
          </span>
          <LineBadge line={(train.line_name || "").toLowerCase().includes("red") ? "red" : "blue"} />
          <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", RISK_TW[risk])}>
            <span className="size-1.5 rounded-full bg-current" />
            {risk} risk
          </span>
        </div>

        {/* Live Ticking Countdown Header Pill */}
        <div className="flex items-center gap-1.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-1 font-mono text-xs font-extrabold text-accent-cyan shadow-sm shadow-accent-cyan/10">
          <Clock className="size-3.5 text-accent-cyan animate-pulse" />
          <span>Arrives in {liveTimerFormatted}</span>
        </div>
      </div>

      {/* Train Name & Timings */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-white">{train.train_name}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-400">
            <Timer className="size-3 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Arr {arrTimeStr} · Dep {depTimeStr}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <span>Route: {train.route}</span>
      </div>

      {/* 4 Cell Stat Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cell icon={<Clock className="size-3.5" />} label="Est. Arrival" value={arrTimeStr} />
        <Cell icon={<Timer className="size-3.5" />} label="Countdown" value={liveTimerFormatted} accent />
        <Cell icon={<Users className="size-3.5" />} label="Platform Crowd" value={`${(train.predicted_station_crowd ?? 420).toLocaleString()} pax`} />
        <Cell icon={<UserPlus className="size-3.5" />} label="Boarding (Pred)" value={`+${train.predicted_boarding_count || 120} pax`} accent />
      </div>

      {/* Occupancy Bar */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
          <span>Predicted Station Occupancy</span>
          <span className="text-accent-cyan font-bold">{avg}%</span>
        </div>
        <OccupancyBar value={avg} />
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
