import { useEffect, useState } from "react";
import { TRAINS, BLUE_LINE, RED_LINE, type Train } from "@/lib/mock/data";
import { useTrains } from "@/lib/api/hooks";
import { USE_MOCK } from "@/lib/api/client";
import { LineBadge } from "./badges";
import { cn } from "@/lib/utils";
import { TrainFront, Radio } from "lucide-react";

function calculateDynamicProgress(train: Train, tickSeconds: number) {
  const stations = train.line === "blue" ? BLUE_LINE : RED_LINE;
  const totalStops = Math.max(1, stations.length - 1);
  const currentIdx = stations.findIndex((s) => s.id === train.currentStationId);

  let basePct = 0;
  if (typeof train.journey_completed_pct === "number" && train.journey_completed_pct > 0) {
    basePct = train.journey_completed_pct;
  } else if (currentIdx >= 0) {
    basePct = (currentIdx / totalStops) * 100;
  } else {
    // Unique seed for train id if currentStationId is unmapped
    const seed = train.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    basePct = (seed % 70) + 15;
  }

  // Smooth continuous live motion (1 station distance every 15 seconds)
  const stationSpanPct = 100 / totalStops;
  const trainOffsetSeconds = (train.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 3) % 15;
  const progressRatio = ((tickSeconds + trainOffsetSeconds) % 15) / 15;
  
  const livePct = (basePct + progressRatio * stationSpanPct) % 100;
  return Math.max(2, Math.min(98, livePct));
}

export function LiveTrainTicker({ className }: { className?: string }) {
  const [seconds, setSeconds] = useState(0);
  const trainsQ = useTrains();
  const trainsRaw = trainsQ.data ?? [];
  const hasRealTrains = trainsRaw.some((t) => t.id !== "ESP32_DEMO");
  const displayTrains = hasRealTrains
    ? trainsRaw.filter((t) => t.id !== "ESP32_DEMO")
    : (USE_MOCK ? TRAINS : trainsRaw);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("rounded-xl border border-white/5 bg-obsidian-900 p-5 shadow-lg", className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300">
          <Radio className="size-3.5 text-accent-cyan animate-pulse" />
          Live Network Position
        </h3>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{displayTrains.length} Trains En Route · Live Motion</span>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {displayTrains.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-obsidian-900/50 text-center">
            <p className="text-sm font-medium text-slate-300">System Offline</p>
            <p className="text-xs text-slate-500">Live position tracking is currently paused.</p>
          </div>
        ) : (
          displayTrains.map((t) => {
            const pct = calculateDynamicProgress(t, seconds);
            const isBlue = t.line === "blue";
            const lineBg = isBlue ? "bg-blue-500" : "bg-rose-500";
            const lineGlow = isBlue ? "shadow-blue-500/50" : "shadow-rose-500/50";

            return (
              <div key={t.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white bg-obsidian-800 px-2 py-0.5 rounded border border-white/10">
                      {t.id}
                    </span>
                    <LineBadge line={t.line} />
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
                    <span className="text-accent-cyan font-bold">{Math.round(pct)}% Progress</span>
                    <span>{t.direction}</span>
                  </div>
                </div>

                {/* Track Bar with Live Moving Train Node */}
                <div className="relative h-7 rounded-lg bg-obsidian-950/80 px-2 border border-white/5 overflow-hidden">
                  {/* Track Line */}
                  <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
                  
                  {/* Active Track Filled Glow */}
                  <div
                    className={cn(
                      "absolute top-1/2 h-1 -translate-y-1/2 rounded-full transition-all duration-1000 ease-linear",
                      isBlue
                        ? "bg-gradient-to-r from-blue-600 to-cyan-400 shadow-sm shadow-cyan-500/30"
                        : "bg-gradient-to-r from-rose-600 to-amber-400 shadow-sm shadow-rose-500/30"
                    )}
                    style={{ width: `${pct}%` }}
                  />

                  {/* Station Ticks */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 ring-1 ring-white/10"
                      style={{ left: `${4 + (i / 7) * 92}%` }}
                    />
                  ))}

                  {/* MOVING TRAIN DOT & BADGE */}
                  <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-10"
                    style={{ left: `${4 + (pct * 0.92)}%` }}
                  >
                    <div className={cn("relative flex items-center justify-center size-5 rounded-full shadow-md text-white font-bold text-[9px]", lineBg, lineGlow)}>
                      <TrainFront className="size-3 text-white" />
                      <span className={cn("absolute inset-0 rounded-full animate-ping opacity-75", lineBg)} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

