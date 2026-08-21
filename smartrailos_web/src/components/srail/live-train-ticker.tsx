import { useEffect, useState, useRef } from "react";
import { BLUE_LINE, RED_LINE, type Train, type Station } from "@/lib/mock/data";
import { useTrains } from "@/lib/api/hooks";
import { LineBadge } from "./badges";
import { cn } from "@/lib/utils";
import { ArrowRight, MapPin, Radio, Clock } from "lucide-react";
import { formatEta } from "@/lib/use-live-tick";

// Helper to normalize station names and IDs
function normalizeStation(st: string): string {
  return (st || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Find station object from id or name
function resolveStation(stIdOrName: string | undefined, lineStations: Station[]): Station | undefined {
  if (!stIdOrName) return undefined;
  const needle = normalizeStation(stIdOrName);
  return lineStations.find((s) => {
    const sId = normalizeStation(s.id);
    const sName = normalizeStation(s.name);
    return sId === needle || sName === needle || needle.includes(sName) || sName.includes(needle);
  });
}

function getNextStationName(train: Train, lineStations: Station[]): string {
  if (train.nextStationId) {
    const st = resolveStation(train.nextStationId, lineStations);
    if (st) return st.name;
    return train.nextStationId;
  }

  // If nextStationId not given, compute from current station + direction
  const curStation = resolveStation(train.currentStationId, lineStations);
  if (curStation) {
    const idx = lineStations.indexOf(curStation);
    const isUp = train.direction?.toUpperCase().includes("UP") || 
                 train.direction?.toUpperCase().includes("NORTH") || 
                 train.direction?.toUpperCase().includes("VASTRAL") || 
                 train.direction?.toUpperCase().includes("MOTERA");
    const nextIdx = isUp ? Math.min(lineStations.length - 1, idx + 1) : Math.max(0, idx - 1);
    return lineStations[nextIdx]?.name || lineStations[idx]?.name;
  }

  return "In Transit";
}

function calculateRealisticProgress(train: Train, clientElapsedSec: number): number {
  const isBlue = train.line === "blue" || train.id.toLowerCase().startsWith("bl");
  const stations = isBlue ? BLUE_LINE : RED_LINE;
  const totalStops = Math.max(stations.length - 1, 1);

  // 1. If backend gave a valid journey_completed_pct, use it as baseline
  if (typeof train.journey_completed_pct === "number" && !isNaN(train.journey_completed_pct)) {
    // Add smooth micro-advance (capped at 2% between 5-second polling updates)
    const microAdvance = Math.min(2.0, clientElapsedSec * 0.05);
    return Math.max(1, Math.min(99, train.journey_completed_pct + microAdvance));
  }

  // 2. Otherwise calculate based on station index
  const curStation = resolveStation(train.currentStationId, stations);
  const curIdx = curStation ? stations.indexOf(curStation) : 0;
  
  const isUp = train.direction?.toUpperCase().includes("UP") || 
               train.direction?.toUpperCase().includes("NORTH") || 
               train.direction?.toUpperCase().includes("VASTRAL") || 
               train.direction?.toUpperCase().includes("MOTERA");

  // Normalized base progress along the track (0% to 100%)
  const basePct = isUp 
    ? (curIdx / totalStops) * 100 
    : (1 - (curIdx / totalStops)) * 100;

  // If in transit, interpolate towards next station smoothly
  const inTransit = train.status === "En Route" || train.status === "Approaching";
  const extraPct = inTransit ? Math.min(4.5, clientElapsedSec * 0.1) : 0;

  return Math.max(1, Math.min(99, basePct + extraPct));
}

export function LiveTrainTicker({ className }: { className?: string }) {
  const trainsQ = useTrains();
  const trainsRaw = trainsQ.data ?? [];
  const trains = trainsRaw.filter((t) => t.id !== "ESP32_DEMO");
  const hasTrains = trains.length > 0;

  // Track elapsed seconds since last query update for smooth non-jumping interpolation
  const [elapsedSec, setElapsedSec] = useState(0);
  const lastSyncRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset client elapsed counter whenever fresh data arrives from backend
    lastSyncRef.current = Date.now();
    setElapsedSec(0);
  }, [trainsQ.dataUpdatedAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec((Date.now() - lastSyncRef.current) / 1000);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("rounded-2xl border-0 bg-[#141720] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-xl", className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-accent-cyan" />
          </span>
          Live Network Position
        </h3>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {trains.length} active trains
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {!hasTrains ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-obsidian-900/50 text-center">
            <p className="text-sm font-medium text-slate-300">System Off-Peak</p>
            <p className="text-xs text-slate-500">Live position tracking will resume during operational schedule.</p>
          </div>
        ) : (
          trains.map((t) => {
            const isBlue = t.line === "blue" || t.id.toLowerCase().startsWith("bl");
            const stations = isBlue ? BLUE_LINE : RED_LINE;
            const pct = calculateRealisticProgress(t, elapsedSec);
            const nextStation = getNextStationName(t, stations);
            const curStation = t.currentStationId || "En Route";

            const lineColor = t.line === "blue" ? "bg-blue-500 shadow-blue-500/50" : "bg-rose-500 shadow-rose-500/50";
            const lineGlow = t.line === "blue" ? "from-blue-500/10 via-blue-500/30 to-blue-400" : "from-rose-500/10 via-rose-500/30 to-rose-400";

            return (
              <div key={t.id} className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                {/* Train Info Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-obsidian-800 px-2.5 py-1 font-mono text-xs font-bold text-accent-cyan ring-1 ring-white/10">
                      {t.id}
                    </span>
                    <LineBadge line={t.line} />
                  </div>

                  {/* Next Station Indicator Pill */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 font-mono text-[11px] font-bold text-accent-cyan shadow-sm">
                      <ArrowRight className="size-3 text-accent-cyan animate-pulse" />
                      <span>Next: {nextStation}</span>
                      {t.etaSeconds > 0 && (
                        <span className="text-slate-400 font-normal">({formatEta(t.etaSeconds)})</span>
                      )}
                    </div>
                    
                    <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {t.direction} Bound
                    </span>
                  </div>
                </div>

                {/* Subtitle Station Range */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="truncate">Current: <span className="text-slate-300 font-semibold">{curStation}</span></span>
                  <span className="font-bold text-slate-400">{Math.round(pct)}% Complete</span>
                </div>

                {/* Realistic Dynamic Track Line */}
                <div className="relative mt-3 h-7 select-none">
                  {/* Track Base Rail */}
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-800 shadow-inner" />
                  
                  {/* Active Filled Progress Rail */}
                  <div
                    className={cn("absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r transition-all duration-500 ease-linear", lineGlow)}
                    style={{ width: `${pct}%` }}
                  />

                  {/* Station Ticks along the Line */}
                  {stations.map((st, idx) => {
                    const stPct = (idx / (stations.length - 1)) * 100;
                    const isPassed = stPct <= pct;
                    const isNext = normalizeStation(st.name) === normalizeStation(nextStation);

                    return (
                      <div
                        key={st.id}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${stPct}%` }}
                        title={`${st.id}: ${st.name}`}
                      >
                        <span
                          className={cn(
                            "block rounded-full transition-all duration-300",
                            isNext
                              ? "size-2.5 bg-accent-cyan ring-4 ring-accent-cyan/30 animate-pulse"
                              : isPassed
                                ? "size-1.5 bg-slate-400"
                                : "size-1 bg-slate-700"
                          )}
                        />
                      </div>
                    );
                  })}

                  {/* Moving Train Marker Pod */}
                  <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
                    style={{ left: `${pct}%` }}
                  >
                    <div className={cn("relative flex size-4 items-center justify-center rounded-full shadow-lg ring-4 ring-black/40", lineColor)}>
                      <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", lineColor)} />
                      <span className="size-1.5 rounded-full bg-white" />
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
