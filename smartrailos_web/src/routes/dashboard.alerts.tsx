import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "./dashboard.index";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";
import { useAlerts, useAcknowledgeAlert } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queries";

export const Route = createFileRoute("/dashboard/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Center · SmartRail OS" },
      { name: "description", content: "Acknowledge and resolve real-time alerts across the station." },
    ],
  }),
  component: AlertsPage,
});

const ALERT_SEVERITY_TW: Record<string, string> = {
  Emergency: "bg-danger/15 text-danger border-danger/40",
  "System Warning": "bg-warning/15 text-warning border-warning/40",
};

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      return apiFetch<void>(
        `/alerts/${encodeURIComponent(alertId)}/resolve`,
        { method: "POST" },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

function AlertsPage() {
  const alertsQ = useAlerts();
  const ackM = useAcknowledgeAlert();
  const resM = useResolveAlert();
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  const alerts = alertsQ.data || [];
  
  const list = alerts.filter((a: any) =>
    filter === "all" ? true : filter === "active" ? !a.resolved : a.resolved,
  );

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <SectionHeader title="Alert Center" right={`${alerts.filter((a: any) => !a.resolved).length} active`} />

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
        {list.map((a: any) => (
          <div
            key={a.id}
            className={cn(
              "rounded-xl border border-white/5 bg-obsidian-900 p-5 transition-opacity",
              a.resolved && "opacity-60",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", ALERT_SEVERITY_TW[a.severity] || "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40")}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {a.severity}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{a.time || new Date().toLocaleTimeString()}</span>
              </div>
              {!a.resolved && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => ackM.mutate(a.id)}
                    disabled={a.acknowledged || ackM.isPending}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors",
                      (a.acknowledged || ackM.isPending) ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10",
                      a.acknowledged && "border-success/30 bg-success/10 text-success"
                    )}
                  >
                    {ackM.isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    {a.acknowledged ? "Acknowledged" : "Acknowledge"}
                  </button>
                  <button
                    onClick={() => resM.mutate(a.id)}
                    disabled={resM.isPending}
                    className="inline-flex items-center gap-1.5 rounded border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-cyan hover:bg-accent-cyan hover:text-obsidian-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resM.isPending ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                    Resolve
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
