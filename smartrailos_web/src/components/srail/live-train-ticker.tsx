import { useEffect, useState } from "react";
import { TRAINS, BLUE_LINE, RED_LINE, type Train } from "@/lib/mock/data";
import { useTrains } from "@/lib/api/hooks";
import { LineBadge } from "./badges";
import { cn } from "@/lib/utils";

function progressFor(train: Train, tickSeconds: number) {
  const stations = train.line === "blue" ? BLUE_LINE : RED_LINE;
  const totalStops = stations.length - 1;
  const currentIdx = stations.findIndex((s) => s.id === train.currentStationId);
  if (currentIdx < 0) return 0;
  const dir = train.originId === stations[0].id ? 1 : -1;
  const baseFrac = currentIdx / totalStops;
  
  const seed = train.id.length;
  const dynamic = ((tickSeconds + seed * 7) % 60) / 60; // 0..1 between stations
  const segment = (1 / totalStops) * dynamic * dir;
  const frac = Math.max(0, Math.min(1, baseFrac + segment));
  return frac * 100;
}

export function LiveTrainTicker({ className }: { className?: string }) {
  const [seconds, setSeconds] = useState(0);
  const trainsQ = useTrains();
  const trainsRaw = trainsQ.data ?? [];
  const hasRealTrains = trainsRaw.some(t => t.id !== "ESP32_DEMO");

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("rounded-xl border border-white/5 bg-obsidian-900 p-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-accent-cyan" />
          Live Network Position
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {TRAINS.length} active
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {!hasRealTrains ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-obsidian-900/50 text-center">
            <p className="text-sm font-medium text-slate-300">System Offline</p>
            <p className="text-xs text-slate-500">Live position tracking is currently paused.</p>
          </div>
        ) : (
          TRAINS.map((t) => {
            const pct = progressFor(t, seconds);
            const lineColor = t.line === "blue" ? "bg-accent-blue-2" : "bg-danger";
            return (
              <div key={t.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent-cyan">{t.id}</span>
                    <LineBadge line={t.line} />
                  </div>
                  <span className="font-mono uppercase tracking-wider text-slate-500">
                    {t.direction}
                  </span>
                </div>
                <div className="relative h-6">
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
                  <div
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-accent-cyan/60 to-accent-cyan"
                    style={{ width: `${pct}%`, transition: "width 1s linear" }}
                  />
                  {/* Station ticks */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20"
                      style={{ left: `${(i / 7) * 100}%` }}
                    />
                  ))}
                  {/* Moving train dot */}
                  <span
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pct}%`, transition: "left 1s linear" }}
                  >
                    <span className={cn("relative block size-3 rounded-sm shadow-lg", lineColor)}>
                      <span
                        className={cn(
                          "absolute inset-0 animate-ping rounded-sm opacity-60",
                          lineColor,
                        )}
                      />
                    </span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
