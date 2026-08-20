import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { useTrains, useKpi } from "@/lib/api/hooks";
import { useState } from "react";
import { Box, Radar } from "lucide-react";

export const Route = createFileRoute("/dashboard/digital-twin")({
  head: () => ({
    meta: [
      { title: "Digital Twin · SmartRail OS" },
      { name: "description", content: "Live digital twin of Old High Court Interchange." },
    ],
  }),
  component: DigitalTwin,
});

function DigitalTwin() {
  const trainsQ = useTrains();
  const kpiQ = useKpi();
  const trains = trainsQ.data ?? [];
  const kpi = kpiQ.data;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const blueTrains = trains.filter(t => t.line === "blue");
  const redTrains  = trains.filter(t => t.line === "red");

  const selectedTrain = trains.find(t => t.id === selectedId) ?? trains[0] ?? null;

  const totalPax = kpi?.passengersInTransit ?? 0;
  const dotCount = Math.min(80, Math.max(4, Math.round(totalPax / 40)));

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Digital Twin · Concourse Level" right="LIVE FEED · 30 fps" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-obsidian-900">
          <div className="absolute inset-0 grid-bg opacity-60" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent-cyan/5 to-transparent" />
          <svg viewBox="0 0 800 480" className="relative h-[420px] w-full md:h-[520px]">
            {/* Station outline */}
            <rect x="40" y="40" width="720" height="400" rx="16" fill="none" stroke="rgba(45,212,191,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
            {/* Platform 1 */}
            <rect x="80" y="120" width="640" height="60" rx="6" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.4)" />
            <text x="92" y="112" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">PLATFORM 1 · BLUE LINE</text>
            {/* Platform 2 */}
            <rect x="80" y="300" width="640" height="60" rx="6" fill="rgba(244,63,94,0.08)" stroke="rgba(244,63,94,0.4)" />
            <text x="92" y="292" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">PLATFORM 2 · RED LINE</text>

            {/* Concourse */}
            <rect x="80" y="220" width="640" height="40" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
            <text x="92" y="212" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">CONCOURSE</text>

            {/* Crowd dots */}
            {Array.from({ length: dotCount }).map((_, i) => {
              const x = 100 + (i * 13) % 620;
              const y = 230 + ((i * 7) % 20);
              return <circle key={i} cx={x} cy={y} r={1.6} fill="#2dd4bf" opacity={0.55} />;
            })}

            {/* Blue Line trains on Platform 1 (y=130) */}
            {blueTrains.map((t) => {
              const x = Math.min(460, Math.max(80, 80 + ((t.journey_completed_pct ?? 50) / 100) * 480));
              const isSelected = t.id === (selectedTrain?.id);
              const avg = Math.round(t.coaches.reduce((s, c) => s + c.occupancy, 0) / Math.max(1, t.coaches.length));
              const color = avg > 85 ? "#ef4444" : avg > 65 ? "#f59e0b" : "#3b82f6";
              return (
                <g key={t.id} onClick={() => setSelectedId(t.id)} style={{ cursor: "pointer" }}>
                  <rect x={x} y={130} width={180} height={40} rx={6} fill={color}
                    opacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? "#fff" : "none"} strokeWidth={isSelected ? 1.5 : 0} />
                  <text x={x + 8} y={155} fill="white" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono">
                    {t.id} · {avg}%
                  </text>
                </g>
              );
            })}

            {/* Red Line trains on Platform 2 (y=310) */}
            {redTrains.map((t) => {
              const x = Math.min(460, Math.max(80, 80 + ((t.journey_completed_pct ?? 50) / 100) * 480));
              const isSelected = t.id === (selectedTrain?.id);
              const avg = Math.round(t.coaches.reduce((s, c) => s + c.occupancy, 0) / Math.max(1, t.coaches.length));
              const color = avg > 85 ? "#ef4444" : avg > 65 ? "#f59e0b" : "#f43f5e";
              return (
                <g key={t.id} onClick={() => setSelectedId(t.id)} style={{ cursor: "pointer" }}>
                  <rect x={x} y={310} width={180} height={40} rx={6} fill={color}
                    opacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? "#fff" : "none"} strokeWidth={isSelected ? 1.5 : 0} />
                  <text x={x + 8} y={335} fill="white" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono">
                    {t.id} · {avg}%
                  </text>
                </g>
              );
            })}

            {trains.length === 0 && (
              <text x={400} y={240} fill="#475569" fontSize={12} textAnchor="middle" fontFamily="JetBrains Mono">
                NO ACTIVE TRAINS · OFF-PEAK PERIOD
              </text>
            )}

            {/* Gates */}
            {[120, 240, 360, 480, 600].map((x, i) => (
              <g key={x}>
                <rect x={x} y={400} width={40} height={20} rx={3} fill="rgba(255,255,255,0.05)" stroke="rgba(45,212,191,0.4)" />
                <text x={x + 4} y={414} fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">G{i + 1}</text>
              </g>
            ))}

            {/* Live ping */}
            <circle cx="500" cy="240" r="6" fill="#f59e0b" opacity="0.9">
              <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>

          <div className="border-t border-white/5 bg-obsidian-950/60 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="text-accent-cyan">●</span> Live · {trains.length} {trains.length === 1 ? "train" : "trains"} tracked · {totalPax.toLocaleString()} occupants
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
            {selectedTrain ? (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  <Radar className="size-3 text-accent-cyan" /> Train · {selectedTrain.id}
                </div>
                <h4 className="mt-2 text-sm font-bold text-white">{selectedTrain.direction}</h4>
                <div className="mt-4 space-y-3">
                  {selectedTrain.coaches.map((c) => (
                    <OccupancyBar key={c.id} label={c.label} value={c.occupancy} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">No trains active.<br />Click a train to inspect.</div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
              <Box className="size-3 text-accent-cyan" /> Station Systems
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              <Row label="HVAC · Platform 1" value="22.4°C" tone="text-white" />
              <Row label="HVAC · Platform 2" value="23.1°C" tone="text-warning" />
              <Row label="Escalator E1–E4" value="Nominal" tone="text-success" />
              <Row label="Gate 4 Turnstile" value="Offline" tone="text-danger" />
              <Row label="CCTV nodes" value="48 / 48" tone="text-success" />
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <li className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${tone}`}>{value}</span>
    </li>
  );
}
