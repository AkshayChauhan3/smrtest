import { useEffect, useState } from "react";
import { BLUE_LINE, RED_LINE, type Train, type Station } from "@/lib/mock/data";
import { useTrains } from "@/lib/api/hooks";
import { LineBadge } from "./badges";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock, MapPin, Radio, Timer } from "lucide-react";
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

export function LiveTrainTicker({ className }: { className?: string }) {
  const trainsQ = useTrains();
  const trainsRaw = trainsQ.data ?? [];
  const trains = trainsRaw.filter((t) => t.id !== "ESP32_DEMO");
  const hasTrains = trains.length > 0;

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
            return <TrainTickerRow key={t.id} train={t} stations={stations} />;
          })
        )}
      </div>
    </div>
  );
}

function TrainTickerRow({ train, stations }: { train: Train; stations: Station[] }) {
  // Live ticking countdown timer second by second
  const initialEta = train.etaSeconds > 0 ? train.etaSeconds : (train.status === "At Station" ? 25 : 45);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialEta);

  // Sync whenever backend fresh query data arrives
  useEffect(() => {
    setSecondsRemaining(train.etaSeconds > 0 ? train.etaSeconds : (train.status === "At Station" ? 25 : 45));
  }, [train.etaSeconds, train.status]);

  // Live 1-second ticking countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? (train.status === "At Station" ? 25 : 55) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [train.status]);

  const liveTimerFormatted = formatEta(secondsRemaining);
  const nextStation = getNextStationName(train, stations);
  const curStation = train.currentStationId || "En Route";

  // Calculate hop positions
  const curStationObj = resolveStation(train.currentStationId, stations);
  const curIdx = curStationObj ? stations.indexOf(curStationObj) : 0;
  
  const isUp = train.direction?.toUpperCase().includes("UP") || 
               train.direction?.toUpperCase().includes("NORTH") || 
               train.direction?.toUpperCase().includes("VASTRAL") || 
               train.direction?.toUpperCase().includes("MOTERA");

  const nextStationObj = resolveStation(train.nextStationId, stations);
  const nextIdx = nextStationObj 
    ? stations.indexOf(nextStationObj) 
    : (isUp ? Math.min(stations.length - 1, curIdx + 1) : Math.max(0, curIdx - 1));

  const totalStops = Math.max(stations.length - 1, 1);
  const startPct = (curIdx / totalStops) * 100;
  const targetPct = (nextIdx / totalStops) * 100;

  // Hop progress advancing continuously as seconds tick down
  const totalHopDuration = Math.max(30, (train.etaSeconds || 45));
  const hopProgress = train.status === "At Station" 
    ? 0 
    : Math.max(0.08, Math.min(0.94, 1 - (secondsRemaining / totalHopDuration)));

  const pct = Math.max(1, Math.min(99, startPct + hopProgress * (targetPct - startPct)));
  const lineColor = train.line === "blue" ? "bg-blue-500 shadow-blue-500/50" : "bg-rose-500 shadow-rose-500/50";
  const lineGlow = train.line === "blue" ? "from-blue-500/10 via-blue-500/30 to-blue-400" : "from-rose-500/10 via-rose-500/30 to-rose-400";

  return (
    <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
      {/* Train Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-obsidian-800 px-2.5 py-1 font-mono text-xs font-bold text-accent-cyan ring-1 ring-white/10">
            {train.id}
          </span>
          <LineBadge line={train.line} />
        </div>

        {/* Live Ticking Next Station Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 font-mono text-[11px] font-bold text-accent-cyan shadow-sm">
            <Timer className="size-3 text-accent-cyan animate-pulse" />
            <span>Next: {nextStation}</span>
            <span className="ml-1 rounded bg-accent-cyan/20 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
              {train.status === "At Station" ? "AT PLATFORM" : `ETA ${liveTimerFormatted}`}
            </span>
          </div>
          
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {train.direction} Bound
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
}
