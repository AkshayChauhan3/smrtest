import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { TRAINS } from "@/lib/mock/data";
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
  const train = TRAINS[0];
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
            {Array.from({ length: 48 }).map((_, i) => {
              const x = 100 + (i * 13) % 620;
              const y = 230 + ((i * 7) % 20);
              return <circle key={i} cx={x} cy={y} r={1.6} fill="#2dd4bf" opacity={0.55} />;
            })}

            {/* Trains */}
            <g>
              <rect x="200" y="130" width="280" height="40" rx="6" fill="#3b82f6" opacity="0.85" />
              <text x="210" y="155" fill="white" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">BL-DN-014 · AT STATION</text>
            </g>
            <g>
              <rect x="380" y="310" width="280" height="40" rx="6" fill="#f43f5e" opacity="0.85" />
              <text x="390" y="335" fill="white" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">RL-DN-009 · DEPARTING</text>
            </g>

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
            <span className="text-accent-cyan">●</span> Live · {TRAINS.length} entities tracked · 1,248 occupants
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-obsidian-900 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
              <Radar className="size-3 text-accent-cyan" /> Train · {train.id}
            </div>
            <h4 className="mt-2 text-sm font-bold text-white">{train.direction}</h4>
            <div className="mt-4 space-y-3">
              {train.coaches.map((c) => (
                <OccupancyBar key={c.id} label={c.label} value={c.occupancy} />
              ))}
            </div>
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
