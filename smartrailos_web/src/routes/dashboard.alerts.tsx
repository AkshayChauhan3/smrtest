import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { useState } from "react";
import { ALERTS, ALERT_SEVERITY_TW, type Alert } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Center · SmartRail OS" },
      { name: "description", content: "Acknowledge and resolve real-time alerts across the station." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  const list = alerts.filter((a) =>
    filter === "all" ? true : filter === "active" ? !a.resolved : a.resolved,
  );

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Alert Center" right={`${alerts.filter((a) => !a.resolved).length} active`} />

      <div className="flex gap-1 rounded-md border border-white/10 bg-obsidian-800 p-0.5 w-fit">
        {(["active", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
              filter === f ? "bg-accent-cyan text-obsidian-950" : "text-slate-400 hover:text-white",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-xl border border-white/5 bg-obsidian-900 p-5 transition-opacity",
              a.resolved && "opacity-60",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", ALERT_SEVERITY_TW[a.severity])}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {a.severity}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{a.time}</span>
              </div>
              {!a.resolved && (
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10">
                    <Check className="size-3" /> Acknowledge
                  </button>
                  <button
                    onClick={() => setAlerts((s) => s.map((x) => (x.id === a.id ? { ...x, resolved: true } : x)))}
                    className="inline-flex items-center gap-1.5 rounded border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-cyan hover:bg-accent-cyan hover:text-obsidian-950"
                  >
                    <X className="size-3" /> Resolve
                  </button>
                </div>
              )}
            </div>

            <h3 className="mt-3 text-sm font-bold text-white">{a.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
