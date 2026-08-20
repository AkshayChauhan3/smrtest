import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { useTrains, useKpi, useStations } from "@/lib/api/hooks";
import { useState } from "react";
import {
  Box,
  Radar,
  TrainFront,
  Activity,
  Zap,
  Users,
  Radio,
  ArrowRight,
  Sparkles,
  Layers,
  Sliders,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { type Train } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/digital-twin")({
  head: () => ({
    meta: [
      { title: "Digital Twin · SmartRail OS Command Center" },
      { name: "description", content: "Live 3D-inspired Digital Twin & Physical Control Room for Old High Court Interchange." },
    ],
  }),
  component: DigitalTwin,
});

function getCoachTheme(pct: number) {
  if (pct >= 90)
    return {
      fill: "rgba(239, 68, 68, 0.15)",
      stroke: "#ef4444",
      text: "#fca5a5",
      badgeBg: "rgba(239, 68, 68, 0.3)",
      badgeText: "#ef4444",
      statusText: "CRITICAL",
    };
  if (pct >= 75)
    return {
      fill: "rgba(249, 115, 22, 0.15)",
      stroke: "#f97316",
      text: "#fdba74",
      badgeBg: "rgba(249, 115, 22, 0.3)",
      badgeText: "#f97316",
      statusText: "HIGH",
    };
  if (pct >= 50)
    return {
      fill: "rgba(245, 158, 11, 0.15)",
      stroke: "#f59e0b",
      text: "#fde047",
      badgeBg: "rgba(245, 158, 11, 0.3)",
      badgeText: "#f59e0b",
      statusText: "MODERATE",
    };
  return {
    fill: "rgba(45, 212, 191, 0.12)",
    stroke: "#2dd4bf",
    text: "#5eead4",
    badgeBg: "rgba(45, 212, 191, 0.25)",
    badgeText: "#2dd4bf",
    statusText: "OPTIMAL",
  };
}

function DigitalTwin() {
  const trainsQ = useTrains();
  const kpiQ = useKpi();
  const stationsQ = useStations();

  const trains = trainsQ.data ?? [];
  const kpi = kpiQ.data;
  const stations = stationsQ.data ?? [];

  const blueTrains = trains.filter((t) => t.line === "blue");
  const redTrains = trains.filter((t) => t.line === "red");

  const [selectedBlueId, setSelectedBlueId] = useState<string | null>(null);
  const [selectedRedId, setSelectedRedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeBlueTrain = blueTrains.find((t) => t.id === selectedBlueId) ?? blueTrains[0] ?? null;
  const activeRedTrain = redTrains.find((t) => t.id === selectedRedId) ?? redTrains[0] ?? null;

  const currentInspectedTrain =
    trains.find((t) => t.id === selectedId) ?? activeBlueTrain ?? activeRedTrain ?? trains[0] ?? null;

  const totalPax = kpi?.passengersInTransit ?? 0;
  const dotCount = Math.min(90, Math.max(8, Math.round(totalPax / 35)));

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Radio className="size-3 text-accent-cyan animate-pulse" /> Telemetry Stream · 30 FPS
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Old High Court Interchange · Digital Twin
          </h1>
        </div>
        
        {/* Top Control Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-obsidian-900 px-3 py-1.5 text-xs font-mono text-slate-300">
            <Activity className="size-3.5 text-emerald-400" />
            <span>Health: <strong className="text-white">99.8%</strong></span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1.5 text-xs font-mono font-bold text-accent-cyan">
            <Zap className="size-3.5" />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left Interactive Canvas Container */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-obsidian-950 shadow-2xl backdrop-blur-xl">
          
          {/* ── PLATFORM 1 CONTROLS HEADER ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-obsidian-900/90 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex size-3 items-center justify-center rounded-full bg-blue-500/20">
                <span className="size-1.5 rounded-full bg-blue-400 animate-ping" />
              </span>
              <div>
                <h3 className="font-mono text-xs font-extrabold text-white tracking-wider">
                  PLATFORM 1 · BLUE LINE TRACK
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Bound: Thaltej Gam ↔ Vastral Gam</p>
              </div>
            </div>

            {/* Train Selector Tabs for Blue Line */}
            <div className="flex flex-wrap items-center gap-1.5">
              {blueTrains.length === 0 ? (
                <span className="text-[11px] font-mono text-slate-500 italic">No trains scheduled</span>
              ) : (
                blueTrains.map((t) => {
                  const isActive = t.id === activeBlueTrain?.id;
                  const isApproaching = t.status === "Approaching" || t.status === "En Route";
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedBlueId(t.id);
                        setSelectedId(t.id);
                      }}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/30"
                          : "bg-obsidian-800 text-slate-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <TrainFront className={cn("size-3.5", isActive ? "text-white" : "text-blue-400")} />
                      <span>{t.id}</span>
                      {isApproaching && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                          ETA 1m
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── PLATFORM 2 CONTROLS HEADER ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-obsidian-900/60 px-6 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex size-3 items-center justify-center rounded-full bg-rose-500/20">
                <span className="size-1.5 rounded-full bg-rose-400 animate-ping" />
              </span>
              <div>
                <h3 className="font-mono text-xs font-extrabold text-white tracking-wider">
                  PLATFORM 2 · RED LINE TRACK
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Bound: APMC ↔ Motera Stadium</p>
              </div>
            </div>

            {/* Train Selector Tabs for Red Line */}
            <div className="flex flex-wrap items-center gap-1.5">
              {redTrains.length === 0 ? (
                <span className="text-[11px] font-mono text-slate-500 italic">No trains scheduled</span>
              ) : (
                redTrains.map((t) => {
                  const isActive = t.id === activeRedTrain?.id;
                  const isApproaching = t.status === "Approaching" || t.status === "En Route";
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedRedId(t.id);
                        setSelectedId(t.id);
                      }}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/25 ring-1 ring-white/30"
                          : "bg-obsidian-800 text-slate-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <TrainFront className={cn("size-3.5", isActive ? "text-white" : "text-rose-400")} />
                      <span>{t.id}</span>
                      {isApproaching && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                          ETA 1m
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SVG Digital Twin Visual Blueprint Canvas */}
          <div className="relative p-4 md:p-6 bg-obsidian-950">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            
            <svg viewBox="0 0 840 480" className="relative h-[440px] w-full md:h-[520px] overflow-visible">
              <defs>
                {/* Neon Glow Filters */}
                <filter id="neonBlueGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="neonRedGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Metallic Gradients */}
                <linearGradient id="metalTrack" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
              </defs>

              {/* Station Outer Boundary Shield */}
              <rect x="25" y="15" width="790" height="450" rx="16" fill="none" stroke="rgba(45,212,191,0.25)" strokeWidth="1.5" strokeDasharray="6 6" />

              {/* ── PLATFORM 1 (BLUE LINE) SVG ZONE ── */}
              {/* Track Rails */}
              <line x1="50" y1="50" x2="790" y2="50" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="50" y1="165" x2="790" y2="165" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
              
              {/* Platform 1 Enclosure Container */}
              <rect x="50" y="52" width="740" height="110" rx="12" fill="rgba(59,130,246,0.04)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.2" />

              {/* Render Platform 1 Train & Coaches */}
              {renderPlatformCoaches({
                train: activeBlueTrain,
                platformY: 52,
                isSelected: activeBlueTrain?.id === currentInspectedTrain?.id,
                onSelectTrain: (id) => setSelectedId(id),
                lineColor: "#3b82f6",
              })}

              {/* ── CONCOURSE LEVEL ── */}
              <rect x="50" y="195" width="740" height="90" rx="12" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
              <text x="68" y="215" fill="#64748b" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono">
                CONCOURSE LEVEL · PASSENGER FLOW & TURNSTILE GATES
              </text>

              {/* Concourse Passenger Dots */}
              {Array.from({ length: dotCount }).map((_, i) => {
                const cx = 80 + ((i * 16) % 680);
                const cy = 222 + ((i * 7) % 55);
                return <circle key={i} cx={cx} cy={cy} r={1.8} fill="#2dd4bf" opacity={0.4} />;
              })}

              {/* Gates G1–G5 */}
              {[75, 215, 355, 495, 635].map((x, i) => {
                const isOffline = i === 3;
                return (
                  <g key={x}>
                    <rect
                      x={x}
                      y="245"
                      width="60"
                      height="26"
                      rx="6"
                      fill={isOffline ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)"}
                      stroke={isOffline ? "#ef4444" : "#10b981"}
                      strokeWidth="1"
                    />
                    <circle cx={x + 12} cy="258" r="3" fill={isOffline ? "#ef4444" : "#10b981"} />
                    <text x={x + 20} y="261" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                      G{i + 1}
                    </text>
                  </g>
                );
              })}

              {/* ── PLATFORM 2 (RED LINE) SVG ZONE ── */}
              {/* Track Rails */}
              <line x1="50" y1="315" x2="790" y2="315" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="50" y1="430" x2="790" y2="430" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.4" />

              {/* Platform 2 Enclosure Container */}
              <rect x="50" y="317" width="740" height="110" rx="12" fill="rgba(244,63,94,0.04)" stroke="rgba(244,63,94,0.3)" strokeWidth="1.2" />

              {/* Render Platform 2 Train & Coaches */}
              {renderPlatformCoaches({
                train: activeRedTrain,
                platformY: 317,
                isSelected: activeRedTrain?.id === currentInspectedTrain?.id,
                onSelectTrain: (id) => setSelectedId(id),
                lineColor: "#f43f5e",
              })}

              {/* Empty State */}
              {trains.length === 0 && (
                <text x={420} y={245} fill="#475569" fontSize="13" textAnchor="middle" fontFamily="JetBrains Mono">
                  NO ACTIVE TRAINS ON NETWORK · SYSTEM OFF-PEAK
                </text>
              )}

              {/* Live Signal Telemetry Radar Ring */}
              <circle cx="770" cy="240" r="6" fill="#2dd4bf">
                <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-obsidian-900/90 px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-accent-cyan animate-pulse" />
              <span>Real-Time Hardware Telemetry · {trains.length} Active Trains Tracked</span>
            </div>
            <div className="flex items-center gap-5 text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" /> &lt;50% Optimal</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-500" /> 50-75% Mod</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-orange-500" /> 75-90% High</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-500" /> &gt;90% Crit</span>
            </div>
          </div>

        </div>

        {/* Right Telemetry & Inspection Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-obsidian-900 p-6 shadow-xl backdrop-blur-xl">
            {currentInspectedTrain ? (
              <>
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2">
                    <Radar className="size-4 text-accent-cyan" /> Selected Train Inspection
                  </div>
                  <span className="rounded-md bg-accent-cyan/10 px-2.5 py-1 font-mono text-xs font-bold text-accent-cyan ring-1 ring-inset ring-accent-cyan/20">
                    {currentInspectedTrain.id}
                  </span>
                </div>
                <h4 className="mt-3 text-base font-bold text-white">{currentInspectedTrain.direction}</h4>

                <div className="mt-3 flex items-center justify-between gap-2 border-b border-white/5 pb-3 text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    {currentInspectedTrain.status}
                  </span>
                  <span>Arr {currentInspectedTrain.arrival} · Dep {currentInspectedTrain.departure}</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Live Coach Occupancy Breakdown</span>
                    <span className="font-mono text-slate-500">{currentInspectedTrain.coaches.length} Coaches</span>
                  </div>
                  {currentInspectedTrain.coaches.map((c) => (
                    <OccupancyBar key={c.id} label={`${c.label} (${c.occupancy}%)`} value={c.occupancy} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No active train selected.<br />Click any train tab or coach to inspect full telemetry.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-obsidian-900 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              <Box className="size-4 text-accent-cyan" /> Station Systems Health
            </div>
            <ul className="mt-4 space-y-2.5 text-xs">
              <Row label="HVAC Platform 1" value="22.4°C" tone="text-white" />
              <Row label="HVAC Platform 2" value="23.1°C" tone="text-warning" />
              <Row label="Escalators E1–E4" value="Nominal" tone="text-success" />
              <Row label="Turnstile Gate 4" value="Offline" tone="text-danger" />
              <Row label="CCTV Surveillance" value="48 / 48 Active" tone="text-success" />
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
}

// Render Platform Coaches for a single focused train cleanly inside platform bounds
function renderPlatformCoaches({
  train,
  platformY,
  isSelected,
  onSelectTrain,
  lineColor,
}: {
  train: Train | null;
  platformY: number;
  isSelected: boolean;
  onSelectTrain: (id: string) => void;
  lineColor: string;
}) {
  if (!train) return null;

  const coaches = train.coaches && train.coaches.length > 0 ? train.coaches : [
    { id: "c1", label: "C1 (Standard)", capacity: 400, occupancy: 35, passengers: 140 },
    { id: "c2", label: "C2 (Ladies)", capacity: 400, occupancy: 25, passengers: 100 },
    { id: "c3", label: "C3 (Standard)", capacity: 400, occupancy: 40, passengers: 160 },
  ];

  const isApproaching = train.status === "Approaching" || train.status === "En Route";
  const avgOcc = Math.round(coaches.reduce((s, c) => s + c.occupancy, 0) / coaches.length);

  // We space 3 coaches perfectly inside the 740px platform container (x=50 to x=790)
  // Coach width: 200px each, Gap: 20px
  // 3 * 200 = 600 + 40 = 640px total span.
  // Start X = 100px. Left margin = 50px, Right margin = 50px. PERFECT SYMMETRY & ZERO OVERLAP!
  const coachWidth = 200;
  const coachGap = 20;
  const startX = 100;

  return (
    <g onClick={() => onSelectTrain(train.id)} style={{ cursor: "pointer" }}>
      {/* Train Info Header Bar inside Platform */}
      <g transform={`translate(${startX}, ${platformY + 10})`}>
        <rect
          x="0"
          y="0"
          width="640"
          height="22"
          rx="6"
          fill="rgba(10, 10, 14, 0.9)"
          stroke={lineColor}
          strokeWidth="1.2"
        />
        <text x="14" y="15" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono">
          🚆 Train ID: <tspan fill={lineColor}>{train.id}</tspan> · Direction: {train.direction} · Avg Occupancy: {avgOcc}%
        </text>

        {isApproaching && (
          <g transform="translate(450, 3)">
            <rect x="0" y="0" width="175" height="16" rx="4" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth="1" />
            <circle cx="10" cy="8" r="3" fill="#f59e0b">
              <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x="18" y="11" fill="#f59e0b" fontSize="8.5" fontWeight="700" fontFamily="JetBrains Mono">
              APPROACHING · ETA {train.etaSeconds ? `${Math.ceil(train.etaSeconds / 60)}m` : "1m"}
            </text>
          </g>
        )}
      </g>

      {/* Approaching Signal Track Motion */}
      {isApproaching && (
        <path
          d={`M 50 ${platformY + 21} L 95 ${platformY + 21}`}
          stroke={lineColor}
          strokeWidth="3"
          strokeDasharray="6 4"
        >
          <animate attributeName="stroke-dashoffset" values="10;0" dur="0.6s" repeatCount="indefinite" />
        </path>
      )}

      {/* 3 SPACIOUS NON-OVERLAPPING COACH CARDS */}
      {coaches.map((c, idx) => {
        const cX = startX + idx * (coachWidth + coachGap);
        const cY = platformY + 38;
        const theme = getCoachTheme(c.occupancy);
        const paxCount = c.passengers ?? Math.round(((c.capacity || 400) * c.occupancy) / 100);

        return (
          <g key={c.id || idx}>
            {/* Coach Outer Box */}
            <rect
              x={cX}
              y={cY}
              width={coachWidth}
              height="60"
              rx="8"
              fill={theme.fill}
              stroke={isSelected ? "#ffffff" : theme.stroke}
              strokeWidth={isSelected ? 1.8 : 1}
            />

            {/* Coach Label (e.g. C1 - Standard) */}
            <text x={cX + 14} y={cY + 20} fill="#ffffff" fontSize="10.5" fontWeight="700" fontFamily="JetBrains Mono">
              {c.label || `Coach ${idx + 1}`}
            </text>

            {/* Occupancy Badge */}
            <rect x={cX + coachWidth - 58} y={cY + 8} width="46" height="17" rx="4" fill="rgba(0,0,0,0.5)" stroke={theme.stroke} strokeWidth="0.8" />
            <text x={cX + coachWidth - 35} y={cY + 20} fill={theme.text} fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
              {c.occupancy}%
            </text>

            {/* Passenger Count */}
            <text x={cX + 14} y={cY + 38} fill="#94a3b8" fontSize="9.5" fontWeight="600" fontFamily="JetBrains Mono">
              {paxCount} pax / max {c.capacity || 400}
            </text>

            {/* Bottom Progress Bar */}
            <rect x={cX + 14} y={cY + 46} width={coachWidth - 28} height="4" rx="2" fill="rgba(255,255,255,0.08)" />
            <rect
              x={cX + 14}
              y={cY + 46}
              width={Math.max(4, (coachWidth - 28) * (c.occupancy / 100))}
              height="4"
              rx="2"
              fill={theme.stroke}
            />
          </g>
        );
      })}
    </g>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <li className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className={`font-mono font-bold ${tone}`}>{value}</span>
    </li>
  );
}



