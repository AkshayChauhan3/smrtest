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

// Find station object from id, unpadded id (e.g. "bl-8", "rl-7"), or name
function resolveStation(stIdOrName: string | undefined, lineStations: Station[]): Station | undefined {
  if (!stIdOrName) return undefined;
  const raw = stIdOrName.trim();
  const rawLower = raw.toLowerCase();

  // 1. Direct case-insensitive match on ID or Name
  const direct = lineStations.find(
    (s) => s.id.toLowerCase() === rawLower || s.name.toLowerCase() === rawLower
  );
  if (direct) return direct;

  // 2. Number-aware match (handles "bl-8" -> 8 -> "BL08", "rl-7" -> 7 -> "RL07", "bl-5" -> 5 -> "BL05")
  const numMatch = raw.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    // Check by station order / 1-based index
    const byOrder = lineStations.find((s) => s.order === num);
    if (byOrder) return byOrder;

    // Check by padded ID (e.g. BL08, RL07)
    const isRed = rawLower.startsWith("r");
    const paddedCode = (isRed ? "RL" : "BL") + String(num).padStart(2, "0");
    const byPadded = lineStations.find((s) => s.id.toUpperCase() === paddedCode);
    if (byPadded) return byPadded;

    // Check by array index (if within range 1..length)
    if (num >= 1 && num <= lineStations.length) {
      return lineStations[num - 1];
    }
  }

  // 3. Normalized substring match
  const cleanNeedle = rawLower.replace(/[^a-z0-9]/g, "");
  if (cleanNeedle.length >= 2) {
    const bySub = lineStations.find((s) => {
      const cleanId = s.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanName = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanId.includes(cleanNeedle) || cleanNeedle.includes(cleanId) ||
             cleanName.includes(cleanNeedle) || cleanNeedle.includes(cleanName);
    });
    if (bySub) return bySub;
  }

  return undefined;
}

function formatFullStation(stIdOrName: string | undefined, lineStations: Station[]): string {
  if (!stIdOrName) return "En Route";
  const st = resolveStation(stIdOrName, lineStations);
  if (st) {
    return `${st.id}-${st.name}`;
  }
  return stIdOrName;
}

function getNextStationName(train: Train, lineStations: Station[]): string {
  if (train.nextStationId) {
    const st = resolveStation(train.nextStationId, lineStations);
    if (st) return `${st.id}-${st.name}`;
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
    const target = lineStations[nextIdx] || lineStations[idx];
    return target ? `${target.id}-${target.name}` : "In Transit";
  }

  return "In Transit";
}

export function LiveTrainTicker({ className }: { className?: string }) {
  const trainsQ = useTrains();
  const trainsRaw = trainsQ.data ?? [];
  const trains = trainsRaw.filter((t) => t.id !== "ESP32_DEMO");
  const [filterLine, setFilterLine] = useState<"all" | "blue" | "red">("all");

  const filteredTrains = trains.filter((t) => {
    if (filterLine === "all") return true;
    const isBlue = t.line === "blue" || t.id.toLowerCase().startsWith("bl");
    return filterLine === "blue" ? isBlue : !isBlue;
  });

  const blueCount = trains.filter((t) => t.line === "blue" || t.id.toLowerCase().startsWith("bl")).length;
  const redCount = trains.filter((t) => !(t.line === "blue" || t.id.toLowerCase().startsWith("bl"))).length;

  return (
    <div className={cn("rounded-2xl border-0 bg-[#141720] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-xl", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <h3 className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-accent-cyan" />
          </span>
          Live Network Position
        </h3>

        {/* Line Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setFilterLine("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold transition-all",
              filterLine === "all"
                ? "bg-accent-cyan/20 text-accent-cyan shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            All ({trains.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterLine("blue")}
            className={cn(
              "rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold transition-all",
              filterLine === "blue"
                ? "bg-blue-500/20 text-blue-400 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Blue ({blueCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterLine("red")}
            className={cn(
              "rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold transition-all",
              filterLine === "red"
                ? "bg-rose-500/20 text-rose-400 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Red ({redCount})
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[480px] overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredTrains.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-obsidian-900/50 text-center">
            <p className="text-sm font-medium text-slate-300">No Trains on Line</p>
            <p className="text-xs text-slate-500">No active trains found for the selected filter.</p>
          </div>
        ) : (
          filteredTrains.map((t) => {
            const isBlue = t.line === "blue" || t.id.toLowerCase().startsWith("bl");
            const stations = isBlue ? BLUE_LINE : RED_LINE;
            return <TrainTickerRow key={t.id} train={t} stations={stations} />;
          })
        )}
      </div>
    </div>
  );
}

function isUpTrain(train: Train, curIdx: number, nextIdx: number): boolean {
  if (curIdx !== nextIdx) return nextIdx > curIdx;
  const id = train.id.toUpperCase();
  const dir = (train.direction || "").toUpperCase();
  if (id.includes("UP") || dir.includes("UP") || dir.includes("VASTRAL") || dir.includes("MOTERA") || dir.includes("NORTH") || dir.includes("EAST")) return true;
  if (id.includes("DN") || id.includes("DOWN") || dir.includes("DN") || dir.includes("DOWN") || dir.includes("THALTEJ") || dir.includes("APMC") || dir.includes("SOUTH") || dir.includes("WEST")) return false;
  return true;
}

function TrainTickerRow({ train, stations }: { train: Train; stations: Station[] }) {
  // Live ticking countdown timer second by second
  const initialEta = train.etaSeconds > 0 ? train.etaSeconds : (train.status === "At Station" ? 0 : 35);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialEta);
  const initialDurationRef = useState<number>(Math.max(15, initialEta))[0];

  // Sync whenever backend fresh query data arrives
  useEffect(() => {
    const newEta = train.etaSeconds > 0 ? train.etaSeconds : (train.status === "At Station" ? 0 : 35);
    setSecondsRemaining(newEta);
  }, [train.etaSeconds, train.status, train.currentStationId, train.nextStationId]);

  // Live 1-second ticking countdown without wrap-around reset
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveTimerFormatted = formatEta(secondsRemaining);
  const curStationFullName = formatFullStation(train.currentStationId, stations);
  const nextStationFullName = getNextStationName(train, stations);

  // Calculate hop positions
  const curStationObj = resolveStation(train.currentStationId, stations);
  const curIdx = curStationObj ? stations.indexOf(curStationObj) : 0;

  const nextStationObj = resolveStation(train.nextStationId, stations);
  const nextIdx = nextStationObj 
    ? stations.indexOf(nextStationObj) 
    : (isUpTrain(train, curIdx, curIdx) ? Math.min(stations.length - 1, curIdx + 1) : Math.max(0, curIdx - 1));

  const isUp = isUpTrain(train, curIdx, nextIdx);
  const totalStops = Math.max(stations.length - 1, 1);
  const startPct = (curIdx / totalStops) * 100;
  const targetPct = (nextIdx / totalStops) * 100;

  // Hop progress smoothly advancing from 0 (at current station) to 1.0 (at next station)
  const totalHopDuration = Math.max(15, train.etaSeconds || initialDurationRef || 35);
  const hopProgress = train.status === "At Station"
    ? 0
    : secondsRemaining === 0
      ? 1
      : Math.max(0, Math.min(1, 1 - (secondsRemaining / totalHopDuration)));

  // Continuous interpolated position
  const pct = Math.max(1, Math.min(99, startPct + hopProgress * (targetPct - startPct)));
  const lineColor = train.line === "blue" ? "bg-blue-500 shadow-blue-500/50" : "bg-rose-500 shadow-rose-500/50";
  const lineGlow = train.line === "blue" ? "from-blue-500/10 via-blue-500/30 to-blue-400" : "from-rose-500/10 via-rose-500/30 to-rose-400";

  const directionLabel = train.direction?.toUpperCase().endsWith("BOUND")
    ? train.direction
    : `${train.direction || ""} Bound`.trim();

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

        {/* Live Ticking Next Station Pill with Full CODE-Name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 font-mono text-[11px] font-bold text-accent-cyan shadow-sm">
            <Timer className="size-3 text-accent-cyan animate-pulse" />
            <span>Next: {nextStationFullName}</span>
            <span className="ml-1 rounded bg-accent-cyan/20 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
              {train.status === "At Station" ? "AT PLATFORM" : (secondsRemaining === 0 ? "ARRIVING" : `ETA ${liveTimerFormatted}`)}
            </span>
          </div>
          
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {directionLabel}
          </span>
        </div>
      </div>

      {/* Realistic Dynamic Track Line with Floating CODE-Name Station Label Above Dot */}
      <div className="relative mt-9 mb-1.5 h-10 select-none">
        {/* Track Base Rail */}
        <div className="absolute inset-x-0 bottom-2 h-1.5 rounded-full bg-slate-800 shadow-inner" />
        
        {/* Active Filled Progress Rail (Direction-Aware) */}
        <div
          className={cn("absolute bottom-2 h-1.5 rounded-full bg-gradient-to-r transition-all duration-500 ease-linear", lineGlow)}
          style={
            isUp
              ? { left: 0, width: `${pct}%` }
              : { left: `${pct}%`, width: `${100 - pct}%` }
          }
        />

        {/* Station Ticks along the Line */}
        {stations.map((st, idx) => {
          const stPct = (idx / (stations.length - 1)) * 100;
          const isPassed = isUp ? stPct <= pct : stPct >= pct;
          const isNext = normalizeStation(nextStationFullName).includes(normalizeStation(st.id)) || 
                         normalizeStation(nextStationFullName).includes(normalizeStation(st.name));

          return (
            <div
              key={st.id}
              className="absolute bottom-2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center"
              style={{ left: `${stPct}%` }}
              title={`${st.id}-${st.name}`}
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

        {/* Moving Train Marker Pod with Full CODE-Name Above Dot */}
        <div
          className="absolute bottom-2 -translate-x-1/2 translate-y-1/2 transition-all duration-500 ease-out z-20"
          style={{ left: `${pct}%` }}
        >
          {/* Station CODE-Name Pill Floating Directly Above the Dot */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-30">
            <div className="flex items-center gap-1.5 rounded-md border border-accent-cyan/30 bg-[#0c0e15]/95 px-2.5 py-0.5 shadow-2xl backdrop-blur-md ring-1 ring-black/50">
              <span className="size-1.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="font-mono text-[10px] font-extrabold text-white tracking-tight">
                {curStationFullName}
              </span>
            </div>
            {/* Downward pointer triangle */}
            <div className="mx-auto size-0 border-x-4 border-x-transparent border-t-4 border-t-[#0c0e15]" />
          </div>

          {/* Train Dot Icon */}
          <div className={cn("relative flex size-4 items-center justify-center rounded-full shadow-lg ring-4 ring-black/40", lineColor)}>
            <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", lineColor)} />
            <span className="size-1.5 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
