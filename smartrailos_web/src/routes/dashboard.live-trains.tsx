import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TRAINS, findStation, riskFor, RISK_TW } from "@/lib/mock/data";
import { LineBadge } from "@/components/srail/badges";
import { OccupancyBar } from "@/components/srail/occupancy-bar";
import { formatEta } from "@/lib/use-live-tick";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SectionHeader } from "./dashboard.index";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/live-trains")({
  head: () => ({
    meta: [
      { title: "Live Trains · SmartRail OS" },
      { name: "description", content: "Live train roster with occupancy, ETA and route details." },
    ],
  }),
  component: LiveTrainsPage,
});

function LiveTrainsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = TRAINS.find((t) => t.id === openId) ?? null;

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Live Trains" right={`${TRAINS.length} active`} />

      <div className="overflow-hidden rounded-xl border border-white/5 bg-obsidian-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-obsidian-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <tr>
                {["Train ID", "Direction", "Line", "Current → Next", "Arr / Dep", "Avg Occ.", "Risk", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {TRAINS.map((t) => {
                const avg = Math.round(t.coaches.reduce((s, c) => s + c.occupancy, 0) / t.coaches.length);
                const risk = riskFor(t);
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-accent-cyan">{t.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{t.direction}</td>
                    <td className="px-4 py-3"><LineBadge line={t.line} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <span className="text-slate-300">{findStation(t.currentStationId)?.name}</span>
                      <ArrowRight className="mx-1 inline size-3 text-slate-600" />
                      <span className="text-accent-cyan">{findStation(t.nextStationId)?.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.arrival} / {t.departure}</td>
                    <td className="px-4 py-3"><div className="w-28"><OccupancyBar value={avg} /></div></td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", RISK_TW[risk])}>{risk}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {t.status === "At Station" ? "At Station" : t.status === "Departing" ? "Departing" : `ETA ${formatEta(t.etaSeconds)}`}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setOpenId(t.id)} className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10">
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-white/10 bg-obsidian-900 text-slate-300 sm:max-w-xl">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-white">
                  <span className="rounded bg-obsidian-800 px-2 py-1 font-mono text-xs text-accent-cyan">{open.id}</span>
                  <span>{open.direction}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <RouteTimeline trainId={open.id} />

                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Arrival" value={open.arrival} />
                  <Stat label="Departure" value={open.departure} />
                  <Stat label="ETA" value={formatEta(open.etaSeconds)} />
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Coach Occupancy</h4>
                  {open.coaches.map((c) => (
                    <OccupancyBar key={c.id} label={`${c.label} · ${Math.round((c.occupancy / 100) * c.capacity)}/${c.capacity}`} value={c.occupancy} />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Boarding (pred)" value={String(open.predictedBoarding)} accent />
                  <Stat label="Deboarding (pred)" value={String(open.predictedDeboarding)} accent />
                </div>
              </div>

              <button onClick={() => setOpenId(null)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-slate-500 hover:bg-white/5 hover:text-white">
                <X className="size-4" />
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/5 bg-obsidian-800/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={cn("mt-1 font-mono text-lg font-bold", accent ? "text-accent-cyan" : "text-white")}>{value}</div>
    </div>
  );
}

export function RouteTimeline({ trainId }: { trainId: string }) {
  const train = TRAINS.find((t) => t.id === trainId)!;
  const isBlue = train.line === "blue";
  const route = isBlue
    ? // synthetic route: 7 stops centered on Old High Court (bl-8)
      ["bl-5", "bl-6", "bl-7", "bl-8", "bl-9", "bl-10", "bl-11"]
    : ["rl-4", "rl-5", "rl-6", "rl-7", "rl-8", "rl-9", "rl-10"];
  const currentIdx = route.indexOf(train.currentStationId);

  return (
    <div className="rounded-lg border border-white/5 bg-obsidian-800/40 p-4">
      <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Route</h4>
      <div className="relative">
        <div className={cn("absolute left-2 right-2 top-3 h-px", isBlue ? "bg-accent-blue-2/40" : "bg-danger/40")} />
        <div className="relative flex justify-between">
          {route.map((id, i) => {
            const passed = i < currentIdx;
            const current = i === currentIdx;
            return (
              <div key={id} className="flex w-16 flex-col items-center text-center">
                <div
                  className={cn(
                    "z-10 grid size-6 place-items-center rounded-full border-2",
                    current
                      ? "border-accent-cyan bg-accent-cyan animate-pulse-soft"
                      : passed
                        ? "border-slate-600 bg-slate-600"
                        : isBlue
                          ? "border-accent-blue-2/40 bg-obsidian-900"
                          : "border-danger/40 bg-obsidian-900",
                  )}
                >
                  {current && <div className="size-2 rounded-full bg-obsidian-950" />}
                </div>
                <div className={cn("mt-2 line-clamp-2 text-[9px] font-medium leading-tight", current ? "text-accent-cyan" : "text-slate-500")}>
                  {findStation(id)?.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
